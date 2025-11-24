# Docker Troubleshooting Guide

Common issues and how to fix them.

## Problem: "docker: command not found" or "Docker is not installed"

### Solution:
1. Download and install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Restart your computer after installation
3. Open a new terminal and try again

---

## Problem: "docker-compose: command not found"

### Solution:
1. Docker Compose is included with Docker Desktop
2. Make sure Docker Desktop is running
3. Try `docker compose` instead (newer syntax)
4. Update Docker Desktop to the latest version

---

## Problem: Containers won't start / "bind: address already in use"

### Solution 1: Port is already in use
```bash
# Stop other containers
docker-compose down

# Or use a different port
docker-compose up -d -p 8080:3001
```

### Solution 2: Docker resources exhausted
```bash
# Clean up unused images and volumes
docker system prune -a --volumes
```

---

## Problem: "Database connection refused"

### Solution:
```bash
# Check if db is running
docker-compose ps

# Check db logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait 10 seconds for database to initialize
# Then restart app
docker-compose restart app
```

---

## Problem: "Column 'approval_admin_id' does not exist"

### Solution:
```bash
# Database schema hasn't initialized yet
# Wait 30 seconds for initialization
# Then restart app
docker-compose restart app
```

---

## Problem: Can't access http://localhost:3001

### Diagnostic steps:
```bash
# 1. Check if containers are running
docker-compose ps

# 2. Check for errors
docker-compose logs -f app

# 3. Verify port is listening
docker-compose exec app lsof -i :3001

# 4. Check network connectivity
docker-compose exec app ping db
```

### Solutions:
- If app container is not running: `docker-compose restart app`
- If db container is not running: `docker-compose down && docker-compose up -d`
- If port says "refused": Wait 30 seconds, containers might still be starting
- Try `http://127.0.0.1:3001` instead of localhost

---

## Problem: Login fails / "Invalid credentials"

### Solution:
```bash
# Make sure you're using the default test credentials
Username: student
Password: student123

# If those don't work, check if database initialized
docker-compose logs db

# Reset database (warning: deletes all data!)
docker-compose down -v
docker-compose up -d

# Wait 1 minute for initialization
```

---

## Problem: File uploads not working

### Solution:
```bash
# Check if uploads folder exists
ls -la backend/uploads/

# If not, create it
mkdir -p backend/uploads

# Check permissions
docker-compose exec app ls -la /app/backend/uploads/

# Restart app
docker-compose restart app
```

---

## Problem: Database corruption / inconsistent state

### Solution: Full reset (WARNING: Deletes all data)
```bash
# Stop everything
docker-compose down

# Remove all volumes (deletes database)
docker volume prune

# Remove images and rebuild
docker-compose up -d --build

# Wait 1-2 minutes for full initialization
```

---

## Problem: "Docker Desktop not running"

### Solution (Windows):
1. Open Docker Desktop application manually
2. Wait for it to fully start (shows tray icon)
3. Try your command again

### Solution (Mac):
1. Open Applications → Docker
2. Wait for tray icon to appear
3. Try your command again

---

## Problem: App crashes on startup

### Solution:
```bash
# Check what error occurred
docker-compose logs -f app

# Common fixes:
# 1. Wrong environment variables
docker-compose exec app env | grep DB_

# 2. Database not ready
docker-compose restart db
docker-compose restart app

# 3. Wrong Node version
docker-compose exec app node --version

# 4. Missing dependencies
docker-compose down
docker-compose up -d --build
```

---

## Problem: PostgreSQL running out of connections

### Solution:
```bash
# Restart database
docker-compose restart db

# Or increase connection limit in docker-compose.yml
# Add to db service environment:
# POSTGRES_MAX_CONNECTIONS=100
```

---

## Problem: Slow performance / high CPU usage

### Solution 1: Stop background services
```bash
# Stop any other Docker containers
docker ps
docker stop <container-id>
```

### Solution 2: Increase Docker resources
1. Open Docker Desktop
2. Settings → Resources
3. Increase CPU and Memory allocation
4. Apply and restart

### Solution 3: Clear cache
```bash
docker-compose down
docker system prune
docker-compose up -d
```

---

## Problem: Can't connect to database from outside container

### Solution:
PostgreSQL inside container is only accessible from within Docker network.

To access database directly:
```bash
docker-compose exec db psql -U postgres -d lost_and_found
```

Or set up port forwarding:
```bash
# Edit docker-compose.yml, database section should have:
ports:
  - "5432:5432"

# Then connect to: localhost:5432
```

---

## Problem: SSL/certificate errors

### Solution:
```bash
# Usually not needed for local development
# Disable SSL temporarily in backend/server.js:

// const pool = new Pool({
//   ssl: true
// });

// Change to:
const pool = new Pool({
  ssl: false
});

docker-compose down
docker-compose up -d
```

---

## Problem: Out of disk space

### Solution:
```bash
# See Docker disk usage
docker system df

# Clean up unused images
docker image prune

# Clean up unused volumes
docker volume prune

# Clean up everything (aggressive)
docker system prune -a
```

---

## Problem: ".env file not found"

### Solution:
```bash
# Create from example
cp .env.example .env

# Edit the file
# Windows: notepad .env
# Mac/Linux: nano .env
# Or use your favorite text editor

# Restart containers
docker-compose down
docker-compose up -d
```

---

## Getting Help

When asking for help, provide:
```bash
# Current status
docker-compose ps

# Recent errors
docker-compose logs --tail=50

# Environment info
echo $DOCKER_HOST
docker --version
docker-compose --version
```

Copy-paste these outputs when asking for help in group chat.

---

## Still Stuck?

1. Try the full reset:
   ```bash
   docker-compose down -v
   docker volume prune
   docker-compose up -d
   ```

2. Wait 2 minutes for full initialization

3. Try accessing http://localhost:3001

4. Check logs: `docker-compose logs -f`

5. If still broken, ask your groupmates or Christopher!
