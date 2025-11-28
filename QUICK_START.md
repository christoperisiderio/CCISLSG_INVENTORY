# CCISLSG Inventory - Quick Start (TL;DR)

## 30 Second Setup

```bash
# 1. Clone and enter directory
git clone <repository-url>
cd CCISLSG_INVENTORY

# 2. Create .env file
cp .env.example .env

# 3. Edit .env (change DB_PASSWORD and JWT_SECRET)
# Open .env with any text editor

# 4. Start
docker-compose up -d

# 5. Wait 30 seconds, then open browser
# http://localhost:3001
```

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Superadmin | superadmin | superadmin123 |
| Admin | admin | admin123 |
| Student | student | student123 |

## Essential Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View status
docker-compose ps

# View logs (troubleshoot)
docker-compose logs -f

# Restart
docker-compose restart

# Hard reset (loses data!)
docker-compose down -v && docker-compose up -d
```

## Access Points

- **App**: http://localhost:3001
- **API**: http://localhost:3001/api
- **Database**: localhost:5432

## Issues?

```bash
# Check what's wrong
docker-compose logs -f

# Usually fixes it
docker-compose restart

# Nuclear option
docker-compose down -v
docker-compose up -d
```

## File Locations

- **Uploads**: `./backend/uploads/`
- **Config**: `.env`
- **Logs**: `docker-compose logs -f`
