#!/bin/bash

# Check if a version tag was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a version tag (e.g., ./deploy.sh v6)"
  exit 1
fi

VERSION=$1
IMAGE="asia-southeast1-docker.pkg.dev/project-75920df4-d8a9-4366-a59/api-teens/express-app:$VERSION"

echo "🚀 Building, pushing, and deploying version: $VERSION..."

docker build -t $IMAGE .
docker push $IMAGE
gcloud.cmd run deploy api-teens --image $IMAGE --region asia-southeast1 --platform managed

echo "✅ Deployment complete!"