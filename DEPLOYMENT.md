# Niyukti Deployment

## Recommended Hosting

- Backend: Render
- Frontend: Vercel
- Database: MongoDB Atlas
- File storage: Cloudinary
- Email: Brevo

## Backend on Render

Root directory:

```text
frontend/backend
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/hrms-manpower?retryWrites=true&w=majority&appName=HRMSCluster
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://hrms-manpower-portal.vercel.app

BREVO_API_KEY=your_brevo_api_key
MAIL_FROM=Niyukti <your_verified_sender@example.com>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

After backend deploys, open:

```text
https://hrms-manpower-backend.onrender.com/api/health
```

## Frontend on Vercel

Root directory:

```text
frontend/client
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variable:

```env
VITE_API_URL=https://hrms-manpower-backend.onrender.com/api
```

## Seed Login Users

After backend is connected to MongoDB Atlas, run locally once against Atlas:

```powershell
cd C:\Users\arpit\OneDrive\Desktop\HRM\frontend\backend
$env:MONGO_URI="mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/hrms-manpower?retryWrites=true&w=majority&appName=HRMSCluster"
npm run seed
```

Demo logins:

```text
Admin: admin@hrms.com / Admin@123
HR: hr@hrms.com / Hr@12345
Payroll: payroll@hrms.com / Payroll@123
Client: client@hrms.com / Client@123
Employee: employee@hrms.com / Employee@123
Candidate: candidate1@hrms.com / Candidate@123
```

## Final Production Checklist

- Rotate all secrets that were used during development.
- Confirm MongoDB Atlas Network Access allows Render and local seed access only.
- Confirm `/api/health` returns `success: true`.
- Confirm direct protected URLs redirect to login when logged out.
- Test Admin, Client, Employee and Candidate login flows.
- Test forgot password email delivery.
- Test Cloudinary upload from document/company logo upload.
- Test `/admin/security-logs` filters and CSV export.
- Test `/admin/integrations` Run Test Sync.
- Confirm Vercel latest commit is deployed.
- Confirm Render latest commit is deployed.
