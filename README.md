# 🩸 BloodBonds — Blood Donation & Emergency Management Platform

A full-stack MERN web application designed to connect blood donors, hospitals, blood banks, and administrators through a centralized emergency blood donation management system.

The platform helps organizations quickly find matching blood donors during emergencies while maintaining secure donor records, donation history tracking, and admin-controlled organization verification.

---

## 🚀 Live Demo

Frontend: https://blood-bonds.vercel.app/  
Backend API: https://bloodbonds.onrender.com/

---

## ✨ Features

- Donor Registration & Login
- Organization Registration & Approval System
- Admin Dashboard Management
- JWT Authentication & Authorization
- OTP Verification Flow
- Emergency Blood Request System
- Blood Requirement Management
- Donation History Tracking
- Role-Based Access Control
- Profile Image Upload
- Mobile Call Integration for Emergency Requests
- MongoDB Atlas Cloud Database Integration
- Responsive UI Design

---

## 🧠 How the Project Works

### 👤 Donor Flow
- Donor registers with personal and blood details
- OTP verification is used for secure signup
- After login, donors can view emergency blood requests
- Donors can contact organizations directly via call button
- Donation history is updated after successful donation

---

### 🏥 Organization Flow
- Organizations register and wait for admin approval
- After approval, they can post emergency blood requests
- They manage blood requirements and track responses from donors

---

### 🛡️ Admin Flow
- Admin verifies and approves organizations
- Ensures only valid organizations are activated
- Manages donors, organizations, and platform activity
- Monitors emergency requests system-wide

---

## 🔁 System Architecture

Frontend (React + Vite)
↓
API Requests (Axios / Fetch)
↓
Backend Server (Node.js + Express)
↓
JWT Authentication Middleware
↓
MongoDB Atlas Database
↓
Response sent back to frontend
↓
UI updates dynamically

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- CSS
- React Router DOM

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- JWT (JSON Web Token)
- bcryptjs

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

## 📂 Folder Structure

```
BloodBonds/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── ...
│
├── README.md
└── package.json
```

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/msangeeth28/BloodBonds.git
```

---

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## ▶️ Running the Project

### Start Frontend

```bash
cd frontend
npm run dev
```

---

### Start Backend

```bash
cd backend
node createAdmin.js
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file inside backend folder:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/donor/send-otp | Generate donor OTP |
| POST | /api/auth/donor/verify-otp | Verify donor OTP |
| POST | /api/auth/organization/register | Register organization |
| POST | /api/auth/login | Login user |
| GET  | /api/auth/me | Get profile |
| PUT  | /api/auth/profile-image | Upload profile image |
| POST | /api/auth/forgot-password | Forgot password OTP |
| POST | /api/auth/reset-password | Reset password |

---

## 🌍 Deployment

- Frontend deployed on Vercel  
- Backend deployed on Render  
- Database hosted on MongoDB Atlas  

> Note: First request may take a few seconds because backend runs on free tier hosting. If there is a delay in OTP, check in the console!

---

## 🤝 Contributing

Pull requests are welcome.  
For major changes, open an issue first to discuss improvements.

---


## 👨‍💻 Author

### Patapalla Thoran Mani Sangeeth  
GitHub: https://github.com/msangeeth28
