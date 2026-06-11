# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN echo "=== Installing dependencies ===" && \
    npm install

# Copy application source
COPY . .

# Debug: show project structure before build
RUN echo "=== Project files before build ===" && \
    pwd && \
    ls -la && \
    echo "=== package.json ===" && \
    cat package.json

# Run build
RUN echo "=== Running build ===" && \
    npm run build

# Debug: verify build output
RUN echo "=== Build output ===" && \
    ls -la && \
    echo "=== dist contents ===" && \
    find dist -type f || echo "No dist directory found"

# Verify entrypoint exists
RUN test -f dist/index.js || (echo "ERROR: dist/index.js not found" && exit 1)

# Expose application port
EXPOSE 8080

# Start application
CMD ["node", "dist/index.js"]