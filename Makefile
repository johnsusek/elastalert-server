v ?= 2.15.0

all: build

build:
	docker pull python:3.11-alpine3.19 && docker pull node:20.12.2-alpine3.19
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	praecoapp/elastalert-server:latest

.PHONY: build
