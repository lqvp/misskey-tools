FROM node:20-slim

WORKDIR /app

# Install system dependencies, SSL certificates, and Yarn
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    python3 \
    build-essential \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    git config --global http.sslVerify false && \
    corepack enable && \
    corepack prepare yarn@stable --activate

# Copy package files
COPY package*.json yarn.lock ./

RUN yarn add ts-node typeorm

# Install dependencies with network timeout
RUN yarn config set network-timeout 300000 && \
    yarn config set strict-ssl false && \
    yarn install --network-timeout 300000

# Copy source code
COPY . .

# Build application
RUN yarn build

# Expose port
EXPOSE 4000