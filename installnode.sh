#!/bin/bash

apt-get update
apt-get install npm
npm cache clean -f
npm install -g n
n stable