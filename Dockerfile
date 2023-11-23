# Stage 1: Build Elastalert
FROM python:3.11-alpine3.18 as elastalert-builder
ARG ELASTALERT_VERSION=2.14.0
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
FROM node:16.20.2-alpine3.18 as install
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
    pip3 install --no-cache-dir --upgrade pip==23.3.1

USER node

WORKDIR /opt/elastalert

RUN pip3 install --no-cache-dir cryptography --user && \
    pip3 install --no-cache-dir -r requirements.txt --user

# Stage 3: Final Image
FROM node:16.20.2-alpine3.18
LABEL maintainer="John Susek <john@johnsolo.net>"
ENV TZ Etc/UTC
ENV PATH /home/node/.local/bin:$PATH

RUN apk add --update --no-cache \
    py3-pip \
    python3 \
    tzdata

COPY --from=install /opt/elastalert /opt/elastalert
COPY --from=install /home/node/.local/lib/python3.11/site-packages /home/node/.local/lib/python3.11/site-packages

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