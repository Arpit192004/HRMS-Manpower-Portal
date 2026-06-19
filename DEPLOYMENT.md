# HRMS Manpower Portal Deployment

## Recommended Hosting

- Backend: Render
- Frontend: Vercel
- Database: MongoDB Atlas

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
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/hrms_manpower
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-url.vercel.app
```

After backend deploys, open:

```text
https://your-backend-url.onrender.com/api/health
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
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## Seed Login Users

After backend is connected to MongoDB Atlas, run locally once against Atlas:

```powershell
cd frontend/backend
$env:MONGO_URI="mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/hrms_manpower"
npm run seed
```

Default login:

```text
admin@hrms.com
Admin@123
```

