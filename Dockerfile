FROM python:3.6.8-alpine3.8 as py-ea
ARG ELASTALERT_VERSION=v0.2.1
ENV ELASTALERT_VERSION=${ELASTALERT_VERSION}
ARG ELASTALERT_URL=https://github.com/Yelp/elastalert/archive/$ELASTALERT_VERSION.zip
ENV ELASTALERT_URL=${ELASTALERT_URL}
ENV ELASTALERT_HOME /opt/elastalert

WORKDIR /opt

RUN apk add --update --no-cache ca-certificates openssl-dev openssl python3-dev python3 libffi-dev gcc musl-dev wget && \
    wget -O elastalert.zip "${ELASTALERT_URL}" && \
    unzip elastalert.zip && \
    rm elastalert.zip && \
    mv e* "${ELASTALERT_HOME}"

WORKDIR "${ELASTALERT_HOME}"

RUN python3 setup.py install

FROM node:alpine
LABEL maintainer="John Susek <john@johnsolo.net>"
ENV TZ Etc/UTC

RUN apk add --update --no-cache curl tzdata python3 ca-certificates openssl-dev openssl python3-dev gcc musl-dev make libffi-dev libmagic

COPY --from=py-ea /usr/lib/python3.6/site-packages /usr/lib/python3.6/site-packages
COPY --from=py-ea /opt/elastalert /opt/elastalert
# COPY --from=py-ea /usr/bin/elastalert* /usr/bin/

WORKDIR /opt/elastalert-server
COPY . /opt/elastalert-server

RUN npm install --production --quiet
COPY config/elastalert.yaml /opt/elastalert/config.yaml
COPY config/config.json config/config.json
COPY rule_templates/ /opt/elastalert/rule_templates
COPY elastalert_modules/ /opt/elastalert/elastalert_modules

# Add default rules directory
# Set permission as unpriviledged user (1000:1000), compatible with Kubernetes
RUN mkdir -p /opt/elastalert/rules/ /opt/elastalert/server_data/tests/ \
    && chown -R node:node /opt

USER node

EXPOSE 3030

WORKDIR /opt/elastalert

RUN pip3 install -r requirements.txt --user

WORKDIR /opt/elastalert-server

ENTRYPOINT ["npm", "start"]
