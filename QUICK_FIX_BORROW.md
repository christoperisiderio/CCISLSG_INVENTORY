# ⚡ QUICK FIX: How to Apply the Borrow Issue Fix

**Problem:** "Only CCISLSG items can be borrowed by students" error

**Solution Time:** 5 minutes

---

## What Was Fixed

✅ Changed item status from 'CCISLSG' to 'available'  
✅ Fixed database schema (added description, fixed default)  
✅ Fixed backend endpoints to save status properly  
✅ Fixed parameter order in borrow request INSERT  
✅ Added debug logging for troubleshooting  

---

## How to Apply Fix

### Step 1: Stop the Backend Server
```powershell
# Find what's running on port 3001
netstat -ano | findstr ":3001"

# Kill it (replace 18320 with your PID)
Stop-Process -Id 18320 -Force
```

### Step 2: Fix Existing Items in Database
```bash
cd D:\ACADS\CSC107\CCISLSG_INVENTORY\backend
node fix_items_status.js
```

You'll see:
```
✓ Updated X items:
  - Projector (ID: 1) -> status: available
  - Laptop Stand (ID: 2) -> status: available
  ...
✅ Item status fix complete!
```

### Step 3: Reload Sample Data (Optional)
If items are still not appearing correctly:
```bash
node insert_sample_inventory.js
```

### Step 4: Start Backend Server
```bash
npm start
```

Should see:
```
Server running on port 3001
Database tables created or already exist
```

### Step 5: Test in Frontend
1. Go to http://localhost:5173
2. Login as student
3. Go to Dashboard → "Available Items to Borrow"
4. Click "Borrow" on any item
5. Fill in quantity, purpose, and notes
6. Click "Submit"
7. ✅ Should see "Borrow request submitted!"

---

## Done!

If it still doesn't work:

1. Check backend console for `[BORROW]` logs
2. Check database: `SELECT * FROM items WHERE status='CCISLSG';` (should be empty)
3. Verify items exist: `SELECT id, name, status, quantity FROM items;`
4. Check user is student role

---

## Files That Were Changed

1. ✅ `backend/server.js` - Fixed endpoints and schema
2. ✅ `backend/insert_sample_inventory.js` - Changed status to 'available'
3. ✅ `backend/fix_items_status.js` - NEW - Migration script

All changes are backwards compatible and don't require code changes on frontend.

---

**Apply this fix now and borrowing will work!** 🚀
