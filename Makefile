v ?= 2.32.0

all: build

build:
	sudo docker pull python:3.14-alpine3.24 && sudo docker pull node:24.22.2-alpine3.24
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	praecoapp/elastalert-server:latest

.PHONY: build
