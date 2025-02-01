# Stage 1: Build Elastalert
FROM python:3.12-alpine3.21 as elastalert-builder
ARG ELASTALERT_VERSION=2.23.0
ENV ELASTALERT_VERSION=${ELASTALERT_VERSION}
ARG ELASTALERT_URL=https://github.com/jertel/elastalert2/archive/refs/tags/$ELASTALERT_VERSION.zip
ENV ELASTALERT_URL=${ELASTALERT_URL}
ENV ELASTALERT_HOME /opt/elastalert

WORKDIR /opt

RUN apk add --update --no-cache wget unzip && \
    wget -O elastalert.zip "${ELASTALERT_URL}" && \
    unzip elastalert.zip && \
    rm elastalert.zip && \
    mv e* "${ELASTALERT_HOME}"

# Stage 2: Install Dependencies
FROM node:22.13-alpine3.21 as install
ENV PATH /home/node/.local/bin:$PATH

RUN apk add --update --no-cache \
    ca-certificates \
    cargo \
    curl \
    gcc \
    libffi-dev \
    libmagic \
    make \
    musl-dev \
    openssl \
    openssl-dev \
    py3-pip \
    py3-wheel \
    python3 \
    python3-dev \
    tzdata

COPY --from=elastalert-builder /opt/elastalert /opt/elastalert

WORKDIR /opt/elastalert-server
COPY . /opt/elastalert-server

RUN npm install --omit=dev --quiet && \
    pip3 install --no-cache-dir --upgrade pip==24.3.1 --break-system-packages

USER node

WORKDIR /opt/elastalert

RUN pip3 install --no-cache-dir cryptography --prefix=/home/node/.local --break-system-packages && \
    pip3 install --no-cache-dir -r requirements.txt --prefix=/home/node/.local --break-system-packages

# Stage 3: Final Image
FROM node:22.13-alpine3.21
LABEL maintainer="John Susek <john@johnsolo.net>"
ENV TZ Etc/UTC
ENV PATH /home/node/.local/bin:$PATH

RUN apk add --update --no-cache \
    ca-certificates \
    libffi-dev \
    openssl \
    openssl-dev \
    py3-pip \
    python3 \
    tzdata

COPY --from=install /opt/elastalert /opt/elastalert
COPY --from=install /home/node/.local/lib/python3.12/site-packages /home/node/.local/lib/python3.12/site-packages

WORKDIR /opt/elastalert-server

COPY --from=install /opt/elastalert-server ./

COPY config/elastalert.yaml /opt/elastalert/config.yaml
COPY config/config.json config/config.json
COPY rule_templates/ /opt/elastalert/rule_templates
COPY elastalert_modules/ /opt/elastalert/elastalert_modules

# Add default rules directory
# Set permission as an unprivileged user (1000:1000), compatible with Kubernetes
RUN mkdir -p /opt/elastalert/rules/ /opt/elastalert/server_data/tests/ \
    && chown -R node:node /opt

USER node

EXPOSE 3030

WORKDIR /opt/elastalert-server

ENTRYPOINT ["npm", "start"]
