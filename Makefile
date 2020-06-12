v ?= v0.2.4

all: build

build:
	docker pull python:3.8-alpine3.12 && docker pull node:alpine
	docker build --build-arg ELASTALERT_VERSION=$(v) -t elastalert .

server: build
	docker run -it --rm -p 3030:3030 \
	--net="host" \
	elastalert:latest

.PHONY: build