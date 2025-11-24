# CCISLSG Inventory System - Setup Guide for Groupmates

Welcome! This guide will help you set up and run the CCISLSG Inventory System using Docker.

---

## 📋 Prerequisites

Before you start, make sure you have:
- **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop))
- **Git** installed
- A terminal/command prompt

---

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd CCISLSG_INVENTORY
```

### Step 2: Create Environment Variables File

Copy the example environment file and create your own:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

### Step 3: Edit the `.env` File

Open the `.env` file with your text editor and update these values:

```env
# Database
DB_NAME=lost_and_found
DB_USER=postgres
DB_PASSWORD=your_secure_password_here    # Change this!
DB_HOST=db

# JWT
JWT_SECRET=your_jwt_secret_key           # Change this!

# Node environment
NODE_ENV=production
```

**⚠️ Important:** Change `DB_PASSWORD` and `JWT_SECRET` to something unique for security.

### Step 4: Start the Application

```bash
docker-compose up -d
```

This command will:
- Download necessary images (first time only)
- Create and start the database container
- Build and start the application container
- Take 1-2 minutes on first run

### Step 5: Verify Everything is Running

Check if containers are running:
```bash
docker-compose ps
```

You should see:
- `ccislsg_db` (PostgreSQL)
- `ccislsg_app` (Application)

Both should show "Up" status.

### Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3001
```

You should see the CCISLSG Inventory System login page.

---

## 📖 Common Tasks

### View Logs (Troubleshooting)

**All services:**
```bash
docker-compose logs -f
```

**Only app logs:**
```bash
docker-compose logs -f app
```

**Only database logs:**
```bash
docker-compose logs -f db
```

Press `Ctrl+C` to stop viewing logs.

### Stop the Application

```bash
docker-compose down
```

### Restart the Application

```bash
docker-compose restart
```

### Stop and Remove All Data

⚠️ **This will delete the database!**
```bash
docker-compose down -v
```

### View Database (Advanced)

Connect to PostgreSQL directly:
```bash
docker-compose exec db psql -U postgres -d lost_and_found
```

Then you can run SQL commands:
```sql
SELECT * FROM users;
SELECT * FROM items;
\dt  -- List all tables
\q   -- Exit
```

---

## 🔑 Default Credentials (After First Setup)

Once the system is running, you can log in with:

**Superadmin:**
- Username: `superadmin`
- Password: `superadmin123`

**Admin:**
- Username: `admin`
- Password: `admin123`

**Student:**
- Username: `student`
- Password: `student123`

---

## 💾 File Uploads

File uploads (photos, etc.) are stored in:
```
./backend/uploads/
```

This folder persists even if containers restart.

---

## 🐛 Troubleshooting

### Issue: Port 3001 already in use

**Solution:** Stop other applications using port 3001 or use a different port:
```bash
docker-compose up -d -p 8080:3001
```
Then access at `http://localhost:8080`

### Issue: Database connection refused

**Solution:** Wait a moment for the database to fully start, then restart:
```bash
docker-compose restart app
```

### Issue: Docker not starting

**Solution:** 
- Make sure Docker Desktop is running
- Restart Docker Desktop
- Check if your system has virtualization enabled (for Windows/Linux)

### Issue: "Column does not exist" errors

**Solution:** This means the database hasn't fully initialized. Give it 30 seconds and refresh:
```bash
docker-compose restart app
```

### Issue: Can't access http://localhost:3001

**Solution:** 
1. Check if containers are running: `docker-compose ps`
2. Check logs: `docker-compose logs app`
3. Verify Docker Desktop is running
4. Try a different port or restart: `docker-compose restart`

---

## 📱 Features

### Student Features
- **Search Items** - Find lost items reported by admins
- **Claim Items** - Submit claims for items with photo proof and student ID
- **View Claims** - Track status of your claim requests (pending/approved/rejected)
- **Notifications** - Receive updates on claim status

### Admin Features
- **Lost Items Management** - Add, edit, and delete lost items with photos
- **Claim Review** - Review and approve/reject student claims
- **Inventory Management** - Add and manage inventory items
- **Borrow System** - Manage student borrow requests
- **Admin News Feed** - Post updates and announcements
- **View Logs** - Track all system activities
- **Export Data** - Download inventory data as CSV

### Superadmin Features
- All admin features
- Admin management
- System administration

---

## 🔄 Workflow

1. **Admin** adds lost items with photos
2. **Student** searches for and finds lost items
3. **Student** claims item with photo proof and student ID
4. **Admin** reviews and approves/rejects the claim
5. **Student** can cancel pending claims
6. **Admin** tracks all activities in logs

---

## 📞 Need Help?

If something isn't working:

1. Check the logs: `docker-compose logs -f`
2. Make sure `.env` file is created
3. Verify Docker is running
4. Try restarting: `docker-compose restart`
5. As a last resort: `docker-compose down -v && docker-compose up -d`

---

## 🔐 Security Notes

- ⚠️ **Never commit `.env` file** to Git - it contains secrets
- Change `DB_PASSWORD` and `JWT_SECRET` before deployment
- In production, use strong, unique passwords
- `.env` file should only exist on your local machine

---

## 📦 System Requirements

- **Disk Space:** ~2GB for Docker images and database
- **RAM:** 2GB minimum recommended
- **CPU:** Any modern processor

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start application |
| `docker-compose down` | Stop application |
| `docker-compose logs -f` | View live logs |
| `docker-compose ps` | Show running containers |
| `docker-compose restart` | Restart application |
| `docker-compose exec db psql -U postgres` | Connect to database |

---

## ✅ First Time Checklist

- [ ] Docker installed
- [ ] Repository cloned
- [ ] `.env` file created
- [ ] `.env` file edited with secure passwords
- [ ] `docker-compose up -d` executed
- [ ] Verified containers running: `docker-compose ps`
- [ ] Accessed http://localhost:3001 in browser
- [ ] Logged in with test credentials

---

**Happy coding! 🚀**

Have questions? Check the logs first: `docker-compose logs -f`
