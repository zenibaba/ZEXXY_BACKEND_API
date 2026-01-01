# ZEXXY Backend API

## 🚀 Serverless Backend with GitHub Database

This backend uses **GitHub as the database** - no traditional database required!

---

## 📂 Structure

```
backend/
├── api/                    # Serverless endpoints
│   ├── register.js        # User registration
│   ├── login.js           # User authentication
│   ├── broadcasts.js      # Fetch broadcasts
│   └── status.js          # System statistics
├── lib/
│   └── github-db.js       # GitHub database layer
├── package.json
├── vercel.json            # Vercel configuration
└── .env.example           # Environment variables
```

---

## 🔧 Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
GITHUB_TOKEN=your_github_pat_token
GITHUB_REPO_OWNER=zenibaba
GITHUB_REPO_NAME=ZEXXY_KEYAUTH
```

### 3. Test Locally
```bash
npm run dev
```

Server starts at: http://localhost:3000

---

## 🌐 Deploy to Vercel

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Method 2: Vercel Dashboard

1. Go to https://vercel.com
2. Import Git repository
3. Configure environment variables:
   - `GITHUB_TOKEN`
   - `GITHUB_REPO_OWNER`
   - `GITHUB_REPO_NAME`
4. Deploy!

---

## 📡 API Endpoints

### **POST /api/register**
Register new user with activation key

**Request:**
```json
{
  "username": "testuser",
  "password": "testpass123",
  "key": "ZEXXY-ABC123",
  "hwid": "DEVICE-12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "user": {
    "username": "testuser",
    "rank": "USER",
    "expiry": 1735737600,
    "hwid": "DEVICE-12345"
  },
  "is_universal_hwid": false,
  "is_reusable": false
}
```

### **POST /api/login**
User authentication

**Request:**
```json
{
  "username": "testuser",
  "password": "testpass123",
  "hwid": "DEVICE-12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "testuser",
    "rank": "USER",
    "expiry": 1735737600,
    "status": "ACTIVE",
    "hwid": "DEVICE-12345"
  }
}
```

### **POST /api/broadcasts**
Get broadcasts for user rank

**Request:**
```json
{
  "rank": "USER"
}
```

**Response:**
```json
{
  "success": true,
  "broadcasts": [
    {
      "id": "BR-123456",
      "title": "System Notification",
      "message": "Update available!",
      "target": "ALL",
      "link": null,
      "created_at": "2026-01-01T15:00:00Z",
      "active": true
    }
  ],
  "count": 1
}
```

### **GET /api/status**
System statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 10,
      "active": 8,
      "banned": 2
    },
    "keys": {
      "total": 50,
      "unused": 30,
      "used": 18,
      "banned": 2
    }
  }
}
```

### **POST /api/sync-stats**
Sync user generation stats and rarity IDs from the app

**Request:**
```json
{
  "username": "testuser",
  "hwid": "DEVICE-12345",
  "stats": {
    "generated": 10,
    "success": 8,
    "failed": 2
  },
  "rarity_ids": [
    { "id": "123456789", "score": 7 },
    { "id": "987654321", "score": 8 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stats synced successfully",
  "stats": {
    "generated": 50,
    "success": 45,
    "failed": 5,
    "last_sync": "2026-01-01T12:00:00Z"
  }
}
```

---

## 🔒 Security

- GitHub token stored as environment variable
- CORS enabled for app access
- HWID validation
- Expiry checking
- Banned user/key checking

---

## 📱 React Native Integration

Update your app service:

```typescript
// src/services/GitHubAuth.ts
const API_URL = 'https://your-app.vercel.app/api';

async register(username, password, key, hwid) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, key, hwid })
  });
  return await res.json();
}

async login(username, password, hwid) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, hwid })
  });
  return await res.json();
}

async getBroadcasts(rank) {
  const res = await fetch(`${API_URL}/broadcasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rank })
  });
  return await res.json();
}
```

---

## ✅ Advantages of GitHub Database

- ✅ **No database costs** - Completely free
- ✅ **Automatic backups** - Git history
- ✅ **Version control** - Track all changes
- ✅ **Easy to inspect** - View data on GitHub
- ✅ **Serverless friendly** - Perfect for Vercel
- ✅ **No complex setup** - Just GitHub token needed

---

## 🐛 Troubleshooting

**"Database not found"**
- Check GitHub token has correct permissions
- Verify repository exists
- Run `python key_manager.py init`

**"CORS error"**
- CORS is already configured
- Check API URL in app

**"Authorization failed"**
- Regenerate GitHub token
- Update environment variable on Vercel

---

## 📝 Next Steps

1. Deploy to Vercel
2. Update React Native app with API URL
3. Test registration and login
4. Enable broadcasts in app

Happy deploying! 🚀
