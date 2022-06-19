v ?= 2.5.1

all: build

build:
	docker pull python:3.10-alpine3.16 && docker pull node:16.15-alpine3.16
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	elastalert:latest

.PHONY: build
