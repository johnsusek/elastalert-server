FROM python:3.8-alpine3.12 as py-ea
ARG ELASTALERT_VERSION=v0.2.4
ENV ELASTALERT_VERSION=${ELASTALERT_VERSION}
ARG ELASTALERT_URL=https://github.com/Yelp/elastalert/archive/$ELASTALERT_VERSION.zip
ENV ELASTALERT_URL=${ELASTALERT_URL}
ENV ELASTALERT_HOME /opt/elastalert

WORKDIR /opt

RUN apk add --update --no-cache wget && \
    wget -O elastalert.zip "${ELASTALERT_URL}" && \
    unzip elastalert.zip && \
    rm elastalert.zip && \
    mv e* "${ELASTALERT_HOME}"

WORKDIR "${ELASTALERT_HOME}"

# Fix until Fix LineNotify & Pagertree #2783(https://github.com/Yelp/elastalert/pull/2783) is merged
# Fix until Bugfix and better error handling on zabbix alerter #2640(https://github.com/Yelp/elastalert/pull/2640) is merged
# Fix until Fix is_enabled not work with reload #3036(https://github.com/Yelp/elastalert/pull/3036) is merged 
COPY patches/loaders.py /opt/elastalert/elastalert/loaders.py

# Fix until Bugfix and better error handling on zabbix alerter #2640(https://github.com/Yelp/elastalert/pull/2640) is merged
COPY patches/zabbix.py /opt/elastalert/elastalert/zabbix.py

# Fix until Fix SNS(Program & Docs) #2793(https://github.com/Yelp/elastalert/pull/2793) is merged
# Fix until Fix Stomp #3024(https://github.com/Yelp/elastalert/pull/3024) is merged
# Fix until Remove the forgotten code of new_style_string_format #3028(https://github.com/Yelp/elastalert/pull/3028) is merged
# Fix until TheHive alerter: Allow severity and tlp to be set by rule #2891(https://github.com/Yelp/elastalert/pull/2891) is merged
COPY patches/alerts.py /opt/elastalert/elastalert/alerts.py

# Fix until Fix elasticsearch-py versionup test_rule.py error #3046(https://github.com/Yelp/elastalert/pull/3046) is merged
COPY patches/test_rule.py /opt/elastalert/elastalert/test_rule.py

# Fix until Fix initializing self.thread_data.alerts_sent for running elastalert-test-rule #2991(https://github.com/Yelp/elastalert/pull/2991) is merged
# Fix until Fix is_enabled not work with reload #3036(https://github.com/Yelp/elastalert/pull/3036) is merged 
COPY patches/elastalert.py /opt/elastalert/elastalert/elastalert.py

# Fix until Change Library blist to sortedcontainers #3019(https://github.com/Yelp/elastalert/pull/3019) is merged
COPY patches/ruletypes.py /opt/elastalert/elastalert/ruletypes.py

# Fix until Sync requirements.txt and setup.py & update py-zabbix #2818(https://github.com/Yelp/elastalert/pull/2818) is merged
# Fix until Remove configparser #3010(https://github.com/Yelp/elastalert/pull/3010) is merged
# Fix until Add tzlocal<3.0 #3094(https://github.com/Yelp/elastalert/pull/3094) is merged
# Fix until Change Library blist to sortedcontainers #3019(https://github.com/Yelp/elastalert/pull/3019) is merged
COPY patches/requirements.txt  /opt/elastalert/requirements.txt 

# kibana_discover 7.4 - 7.12 support
# Fix until Fix Remove Duplicate Key in Schema YAML #2343(https://github.com/Yelp/elastalert/pull/2343) is merged
# Fix until Fix Fix Zabbix(Docs & schema.yaml) #2794(https://github.com/Yelp/elastalert/pull/2794) is merged
COPY patches/schema.yaml /opt/elastalert/elastalert/schema.yaml

# kibana_discover 7.4 - 7.12 support
COPY patches/kibana_discover.py /opt/elastalert/elastalert/kibana_discover.py

#RUN python3 setup.py install

FROM node:14.15-alpine3.13
LABEL maintainer="John Susek <john@johnsolo.net>"
ENV TZ Etc/UTC
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
    python3 \
    python3-dev \
    tzdata

#COPY --from=py-ea /usr/lib/python3.8/site-packages /usr/lib/python3.8/site-packages
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

RUN pip3 install --no-cache-dir --upgrade pip

USER node

EXPOSE 3030

WORKDIR /opt/elastalert

RUN pip3 install --no-cache-dir cryptography --user
RUN pip3 install --no-cache-dir -r requirements.txt --user

WORKDIR /opt/elastalert-server

ENTRYPOINT ["npm", "start"]
