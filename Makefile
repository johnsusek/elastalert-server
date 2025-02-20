v ?= 2.23.0

all: build

build:
	sudo docker pull python:3.12-alpine3.21 && sudo docker pull node:22.14-alpine3.21
	docker build --build-arg ELASTALERT_VERSION=$(v) -t praecoapp/elastalert-server .

server: build
	docker run -it --rm -p 3030:3030 -p 3333:3333 \
	--net="host" \
	praecoapp/elastalert-server:latest

.PHONY: build
