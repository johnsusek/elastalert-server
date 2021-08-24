v ?= 2.2.1

all: build

build:
	docker pull python:3.8-alpine3.13 && docker pull node:14.15-alpine3.13
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	elastalert:latest

.PHONY: build
