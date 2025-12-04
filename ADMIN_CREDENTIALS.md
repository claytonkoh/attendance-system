# Admin Credentials

## Default Admin Account

**Email:** `admin@attendance.com`  
**Password:** `admin123`

## Login URL

- Admin Panel: `http://localhost:5174`

## Security Notes

⚠️ **IMPORTANT**: These are default credentials for development only.  
Please change the password after your first login for security.

## How to Create Additional Admin Users

Run the following command from the `backend` folder:

```bash
.\venv\Scripts\python create_admin.py
```

You can edit `create_admin.py` to create users with different credentials.

## Roles Available

- `admin` - Full access to admin panel (user management, attendance reports, etc.)
- `lecturer` - Can view and manage classes and attendance
- `student` - Can mark attendance and view personal records

---

**Created:** 2025-12-03  
**Script Location:** `backend/create_admin.py`
