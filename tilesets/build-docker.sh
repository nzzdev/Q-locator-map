#!/bin/bash
DOCKER_IMAGE_NAME="q-locator-map-tilesets"
DOCKER_TAG="dev"
echo "DOCKER TAG is '$DOCKER_TAG'"
read -p "docker username:" DOCKER_USERNAME
read -s -p "docker password: " DOCKER_PASSWORD
docker build -t $DOCKER_IMAGE_NAME:$DOCKER_TAG .;
echo "uploading docker container to dockerhub with user $DOCKER_USERNAME"
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
docker tag $DOCKER_IMAGE_NAME:$DOCKER_TAG nzzonline/$DOCKER_IMAGE_NAME:$DOCKER_TAG;
docker push nzzonline/$DOCKER_IMAGE_NAME:$DOCKER_TAG;
echo "done"