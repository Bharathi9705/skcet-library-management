# 📚 SKCET Library Management System

A full-stack, production-ready Library Management System built for **Sri Krishna College of Engineering and Technology**. Features department-wise book catalogs, role-based access control, automated fine calculation, real-time dashboards, and a modern responsive UI with dark mode.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## ✨ Features

- 🔐 **JWT Authentication** with role-based access control (Admin · Librarian · Student)
- 📚 **150+ Books** across 10 engineering departments (CSE, CSD, ECE, EEE, Civil, Mechanical, Mechatronics, IT, Cyber Security, General)
- 🔍 **Advanced Search** by title, author, ISBN, department, and category
- 📤 **Issue & Return Workflow** with automated due-date tracking
- 💰 **Fine Calculation Engine** (₹2/day late fee, auto-computed on return)
- 📊 **Live Dashboards** — Admin/Librarian analytics and Student personal dashboard
- 📌 **Book Reservations** for unavailable titles
- 🔔 **Real-time Notifications** for issues, returns, and fines
- 📈 **Reports & Analytics** — monthly trends, department availability, popular books, CSV export
- 🌗 **Dark/Light Mode** with persistent theme preference
- 📱 **Fully Responsive** mobile-first UI
- 👤 **Profile Management** with photo upload

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|--------------------------------------|
| Backend      | Node.js, Express.js                  |
| Database     | MySQL 8 (mysql2 driver)              |
| Auth         | JWT, bcryptjs                        |
| Frontend     | Vanilla JavaScript (SPA), HTML5, CSS3 |
| Security     | Helmet, express-rate-limit, express-validator |
| Dev Tools    | nodemon                              |

---

## 📂 Project Structure

```
library-management/
├── server.js                 # Express app entry point
├── config/
│   └── db.js                 # MySQL connection pool
├── models/                   # Data layer (User, Book, Issue, Notification, Reservation)
├── controllers/               # Business logic
├── routes/                    # REST API endpoints
├── middleware/                 # Auth, RBAC, error handling
├── public/                    # Frontend SPA
│   ├── index.html
│   ├── css/style.css
│   └── js/                    # api, auth, app, dashboard, books, issues, users, reports, notifs
└── database/
    └── library.sql            # Schema + seed data
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18
- MySQL 8.x

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/skcet-library-management.git
cd skcet-library-management
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the database
```bash
mysql -u root -p < database/library.sql
```

### 4. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your MySQL credentials and a secure JWT secret.

### 5. Run the server
```bash
npm run dev      # development (auto-restart)
npm start        # production
```

### 6. Open in browser
```
http://localhost:5000
```

---

## 🔑 Demo Accounts

| Role       | Email                          | Password   |
|------------|----------------------------------|------------|
| Admin      | admin@skcet.ac.in                | password   |
| Librarian  | librarian@skcet.ac.in            | password   |
| Student    | bharathi@student.skcet.ac.in     | password   |

> ⚠️ Change these credentials before deploying to production.

---

## 🌐 API Overview

| Method | Endpoint                  | Description                  |
|--------|----------------------------|-------------------------------|
| POST   | `/api/auth/login`          | User login                    |
| POST   | `/api/auth/register`       | User registration              |
| GET    | `/api/books`                | List/search books               |
| POST   | `/api/books`                | Add a book (Admin/Librarian)    |
| POST   | `/api/issues`               | Issue a book                   |
| PUT    | `/api/issues/:id/return`   | Return a book (auto fine calc) |
| GET    | `/api/issues/stats`         | Dashboard statistics            |
| GET    | `/api/users`                 | List users (Admin/Librarian)    |

Full endpoint list in [`/routes`](./routes).

---

## 🔒 Security

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with configurable expiry
- Helmet HTTP security headers
- Rate limiting on all API routes
- Parameterized SQL queries (no injection risk)
- Server-side input validation via express-validator

---

## 📝 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🙋 Author

Built by **Bharathi A**, B.E. ECE, Sri Krishna College of Engineering and Technology.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.