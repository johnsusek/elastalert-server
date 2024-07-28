v ?= 2.19.0

all: build

build:
	docker pull python:3.12-alpine3.20 && docker pull node:20.16-alpine3.20
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	praecoapp/elastalert-server:latest

.PHONY: build
