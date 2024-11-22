# Docker Setup for DAO-Test

## Overview
This guide covers running the DAO-Test project in a Docker environment for streamlined development and testing.

## Prerequisites
- Docker installed on your system
- Docker Compose installed on your system
- Basic familiarity with Docker commands

## Quick Start

1. Build and start the containers:
```bash
docker-compose up --build
```

This single command will:
- Build the Docker images for both app and test environments
- Start Ganache blockchain
- Compile and migrate smart contracts
- Start the development server

## Development Environment

### Available Services

- **Frontend**: http://localhost:3000
- **Ganache RPC**: http://localhost:7545
- **Test Environment**: Separate container for isolated testing

### Common Commands

```bash
# Start the environment in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Run tests
docker-compose run dao-test

# Access Truffle console
docker exec -it dao-test truffle console
```

## Container Structure

### Main Application (dao-app)
- Development server
- Ganache blockchain
- Hot-reloading enabled
- Volume mounts for development

### Test Environment (dao-test)
- Isolated test container
- Shares network with main application
- Independent node_modules

## Troubleshooting

### Contract Migration Issues
```bash
docker exec -it dao-test truffle migrate --reset
```

### Node Modules Issues
```bash
# Remove volumes and rebuild
docker-compose down -v
docker-compose up --build
```

### Blockchain State Reset
```bash
docker-compose down
docker-compose up
```

### Port Conflicts
If you see port binding errors, ensure ports 3000, 7545, and 8545 are not in use by other applications.

## Configuration

### Available Ports
- 3000: Frontend application
- 7545: Ganache blockchain
- 8545: Additional blockchain port

### Environment Variables
Default development environment variables are set in docker-compose.yml:
- NODE_ENV=development
- GANACHE_HOST=0.0.0.0
- HOST=0.0.0.0

## Best Practices

1. Always use `--build` when Dockerfile or dependencies change
2. Use `docker-compose down` before significant configuration changes
3. Check logs with `docker-compose logs -f` for troubleshooting
4. Use the test container for running tests to ensure isolation