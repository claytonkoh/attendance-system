# Environment Variables Setup Guide

## 🎯 Quick Summary

Ada 3 aplikasi yang perlu env variables:

- **Frontend** (main site)
- **Admin** (admin dashboard)
- **Backend** (API server)

---

## 📦 Backend (Railway)

### Lokasi File

- `backend/.env` (local only - tidak perlu push)

### Variables

```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/attendance_db
SECRET_KEY=your-super-secret-key-min-32-chars
ML_SERVICE_URL=http://localhost:8001
```

### Railway Dashboard Setup

1. Buka Railway project → Backend service
2. Variables tab → Add variables:
   - `MONGODB_URL`: Connection string dari MongoDB
   - `SECRET_KEY`: Generate random 32+ chars
   - `ML_SERVICE_URL`: (opsional untuk ML service)
3. Redeploy backend

---

## Frontend (Vercel)

### File yang Sudah Ada

- `frontend/.env.local` (local dev - sudah di .gitignore)
- `frontend/.env.production` (production - sudah di .gitignore)

### Variables

```env
# .env.local
VITE_ADMIN_DASHBOARD_URL=http://localhost:5174/dashboard
VITE_API_URL=http://localhost:8000

# .env.production
VITE_ADMIN_DASHBOARD_URL=https://attendance-system-admin.vercel.app/dashboard
VITE_API_URL=https://your-backend.railway.app
```

### Vercel Dashboard Setup

1. Frontend project → Settings → Environment Variables
2. Tambahkan:
   - `VITE_ADMIN_DASHBOARD_URL`: `https://attendance-system-admin.vercel.app/dashboard`
   - `VITE_API_URL`: `https://your-backend.railway.app` ← **GANTI DENGAN URL RAILWAY ANDA**
3. Environment: **Production** (dan Preview jika mau)
4. Redeploy frontend

---

## Admin Dashboard (Vercel)

### File yang Sudah Ada

- `admin/.env.local` (local dev)
- `admin/.env.production` (production)

### Variables

```env
# .env.local
VITE_API_URL=http://localhost:8000

# .env.production
VITE_API_URL=https://your-backend.railway.app
```

### Vercel Dashboard Setup

1. Admin project → Settings → Environment Variables
2. Tambahkan:
   - `VITE_API_URL`: `https://your-backend.railway.app` ← **GANTI DENGAN URL RAILWAY ANDA**
3. Environment: **Production**
4. Redeploy admin

---

## Cara Update URL Backend Railway

1. Buka Railway dashboard → Backend service
2. Copy deployment URL (contoh: `https://attendance-backend-production.up.railway.app`)
3. Update semua `.env.production`:

   ```bash
   # frontend/.env.production
   VITE_API_URL=https://attendance-backend-production.up.railway.app

   # admin/.env.production
   VITE_API_URL=https://attendance-backend-production.up.railway.app
   ```

4. Update Vercel env variables untuk **Frontend** dan **Admin** projects
5. Redeploy kedua Vercel apps

---

## Testing

### Local Development

```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Admin
cd admin
npm run dev
```

### Production

1. Login di main site (Vercel frontend)
2. Login sebagai admin
3. Harus redirect ke admin dashboard (Vercel admin)
4. Token harus valid dan dashboard load

---

## Troubleshooting

### Issue: 404 NOT_FOUND di admin dashboard

**Solusi**: VITE_API_URL tidak di-set di Vercel admin project

### Issue: Token invalid

**Solusi**: Backend URL salah atau tidak diset

### Issue: CORS error

**Solusi**: Tambahkan frontend & admin URLs ke backend CORS settings

### Issue: Redirect ke localhost saat production

**Solusi**: VITE_ADMIN_DASHBOARD_URL tidak di-set di Vercel frontend project

---

## Checklist Deploy

- [ ] Backend deployed di Railway dengan env vars
- [ ] Copy backend Railway URL
- [ ] Update `frontend/.env.production` dengan backend URL
- [ ] Update `admin/.env.production` dengan backend URL
- [ ] Set env vars di Vercel Frontend project
- [ ] Set env vars di Vercel Admin project
- [ ] Push changes ke GitHub
- [ ] Redeploy frontend di Vercel
- [ ] Redeploy admin di Vercel
- [ ] Test login as admin dan verify redirect works
