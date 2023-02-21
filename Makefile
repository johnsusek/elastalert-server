v ?= 2.10.0

all: build

build:
	docker pull python:3.11-alpine3.17 && docker pull node:16.19-alpine3.17
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	elastalert:latest

.PHONY: build
