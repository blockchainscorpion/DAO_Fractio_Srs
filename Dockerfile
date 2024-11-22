# Development Dockerfile
FROM node:18-alpine

# Install required packages and Truffle globally
RUN apk add --no-cache python3 make g++ git && \
    npm install -g truffle@5.11.5

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose ports
EXPOSE 3000 7545 8545

# Set environment variables
ENV NODE_ENV=development \
    HOST=0.0.0.0

# Create docker-entrypoint.sh
RUN echo '#!/bin/sh\n\
# Start Ganache in background\n\
ganache --host 0.0.0.0 --port 7545 & \n\
\n\
# Wait for Ganache to start\n\
sleep 5\n\
\n\
# Compile and migrate contracts\n\
truffle compile\n\
truffle migrate\n\
\n\
# Start development server\n\
npm start' > /app/docker-entrypoint.sh && \
chmod +x /app/docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]