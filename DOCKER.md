# CCISLSG Inventory - Docker Setup

This directory contains Docker configuration for the CCISLSG Inventory System.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured (see below)

### 1. Create `.env` file in project root

```env
# Database
DB_NAME=lost_and_found
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_HOST=db

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production

# Node environment
NODE_ENV=production
```

### 2. Build and run with Docker Compose

```bash
docker-compose up -d
```

This will:
- Build the application image
- Start PostgreSQL database
- Start the app server on port 3001
- Set up volumes for data persistence

### 3. Stop the application

```bash
docker-compose down
```

### 4. View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
```

## Manual Docker Commands

### Build image
```bash
docker build -t ccislsg-inventory:latest .
```

### Run container
```bash
docker run -p 3001:3001 \
  -e DB_HOST=localhost \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=lost_and_found \
  -e JWT_SECRET=your_secret \
  ccislsg-inventory:latest
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Node environment |
| `DB_HOST` | db | Database hostname |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | lost_and_found | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `JWT_SECRET` | your_secret_key_change_in_production | JWT signing secret |

## Docker Compose Services

### `db` (PostgreSQL)
- Image: `postgres:15-alpine`
- Port: `5432`
- Volume: `postgres_data` (persistent storage)
- Healthcheck enabled

### `app`
- Builds from Dockerfile
- Port: `3001`
- Depends on `db` service
- Volume: `./backend/uploads` (for file uploads)

## File Uploads

File uploads are stored in `./backend/uploads` directory which is mounted as a volume in the container.

## Production Considerations

1. **Change JWT_SECRET** in `.env` file
2. **Use strong DB_PASSWORD**
3. **Set up SSL/TLS** for production
4. **Configure backup strategy** for PostgreSQL volume
5. **Use environment-specific** `.env` files
6. **Monitor container logs** for errors
7. **Set resource limits** in docker-compose

## Troubleshooting

### Database connection refused
```bash
# Check if db service is running
docker-compose logs db

# Restart db service
docker-compose restart db
```

### Port already in use
```bash
# Use different port
docker-compose up -d -p 8080:3001
```

### Clear all data and start fresh
```bash
docker-compose down -v
docker-compose up -d
```

## Accessing the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432

## Next Steps

1. Configure environment variables in `.env`
2. Run `docker-compose up -d`
3. Check logs: `docker-compose logs -f`
4. Access application at http://localhost:3001
