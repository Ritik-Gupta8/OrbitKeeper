# Production Dockerfile for OrbitKeeper Backend on Google Cloud Run
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed (e.g. for native modules)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Ensure app files are owned by node user
RUN chown -R node:node /app

# Set container environment defaults
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run injects PORT (defaults to 8080)
EXPOSE 8080

# Run as non-root user for enterprise container security
USER node

# Start Express server
CMD ["node", "index.js"]
