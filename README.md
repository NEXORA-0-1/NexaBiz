# 🌟 NexaBiz SmartPOS

> **A Smart, Modern, IoT-Integrated Financial Platform for Small Retail Business Owners**  
> _Powered by NestJS, React, TypeScript, PostgreSQL, and MQTT_

---

## 🚀 Overview

**NexaBiz SmartPOS** is a cutting-edge Point-of-Sale system designed to empower **small retail businesses** like vegetable shops, groceries, and hardware stores.

With real-time IoT device integration, cloud dashboards, and secure multi-tenant support — this system is built to **automate**, **analyze**, and **scale** financial operations.

---

## 🧱 Tech Stack

| Layer        | Technology                                    |
|--------------|-----------------------------------------------|
| 🧑‍🎨 Frontend | React + TypeScript + Tailwind CSS             |
| 🔧 Backend   | NestJS + TypeScript                           |
| 🗃️ Database  | PostgreSQL + Prisma ORM                       |
| 🔐 Auth      | JWT-based (or Firebase/Auth0 if extended)     |
| 📡 IoT       | MQTT protocol for Smart Scales                |
| ☁️ Hosting   | Vercel (Frontend), Railway/Render (Backend)   |
| 🧪 DevOps    | GitHub Actions, Docker (optional)             |

---

## 📸 Features

- ✅ User Signup/Login with JWT Auth  
- ✅ Multi-tenant system (multiple shops with isolated data)  
- ✅ Sales entry (manual + IoT smart scale)  
- ✅ Profit & Expense Tracking  
- ✅ Role-based dashboards (Owner, Cashier)  
- ✅ IoT-ready with MQTT (ESP32, Raspberry Pi, Smart Devices)

---

## 📁 Project Structure

```
SMARTPOS/
├── backend/                 # NestJS Backend
│   ├── prisma/              # Prisma schema and DB migrations
│   ├── src/
│   │   ├── auth/            # Signup/Login services
│   │   ├── sales/           # (Coming Soon) Sales management
│   │   └── main.ts          # Application entry point
│   ├── .env                 # Backend environment variables
│   └── package.json
│
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── pages/           # Signup, Login, Dashboard
│   │   ├── api.ts           # Axios instance
│   │   └── App.tsx          # Route handling
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
└── README.md                # This file
```

---

## 🧪 Getting Started (Development)

### 🔧 Backend Setup

```bash
cd SMARTPOS/backend
npm install

# Create .env file
touch .env
# Add your environment variables:
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smartpos"
# JWT_SECRET="your_jwt_secret"

# Initialize Prisma DB
npx prisma generate
npx prisma migrate dev --name init

# Start backend
npm run start:dev
```

Backend should now be running at:  
`http://localhost:5000`

---

### 💻 Frontend Setup

```bash
cd SMARTPOS/frontend
npm install

# Optional: Configure port or backend URL
echo "PORT=5173" > .env

# Start frontend
npm start
```

Frontend runs at:  
`http://localhost:5173`

---

### ⚠️ API URL Setup

In `frontend/src/api.ts`, point to your backend:

```ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
});

export default API;
```

---

## 🔐 Authentication (JWT)

- `POST /auth/signup` → Register new user  
- `POST /auth/login` → Login and receive JWT token  
- Token is stored in browser `localStorage`  
- Token contains user email + ID, and is decoded on frontend to show user info

---

## 📡 Smart Scale IoT Integration

SmartPOS will support:

- Digital Scales with built-in Wi-Fi + MQTT client  
- ESP32 / Raspberry Pi that reads serial weight data  
- Sends real-time weight to backend via MQTT → converts to sales data

**Coming Soon:**
- Device pairing and simulation tools  
- Dashboard with live sales stream

---

## 🧠 Multi-Tenant Architecture

NexaBiz supports **multi-tenant** mode:

- Each user belongs to an `organization_id`  
- All sales, users, and devices are scoped by tenant  
- Prevents data leakage between shops  
- Enables scalable SaaS for thousands of businesses

---

## 🔐 .env Examples

### Backend `.env`

```
DATABASE_URL=postgresql://user:password@localhost:5432/smartpos
JWT_SECRET=my_super_secret_key
```

### Frontend `.env`

```
PORT=5173
```

---

## 📊 MVP Roadmap

- [x] JWT-based Signup/Login  
- [x] Role-based dashboard  
- [x] Multi-tenant user structure  
- [x] Token-based auth (JWT decode on dashboard)  
- [ ] Add sale entry manually  
- [ ] Auto-capture sale from smart scale (MQTT)  
- [ ] Expense/income tracking + charts  
- [ ] Admin dashboard for super users

---

## 👥 Team

- 💻 NexaBiz Dev Team — 4 members focused on frontend, backend, and IoT

---

## 🤝 Contributing

Want to help make NexaBiz global?  
Fork this repo and run:

```bash
git clone https://github.com/your-org/nexabiz-smartpos.git
```

Then follow setup instructions above.

---

## 📬 Contact

📧 hello@nexabiz.io  
🌐 [https://nexabiz.io](https://nexabiz.io)

---

## 📜 License

MIT License © 2025 NexaBiz

> Let’s empower the world’s small businesses — starting with one smart sale.
