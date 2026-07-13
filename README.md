# 🚀 Niyukti – Full-Stack Human Resource Management System (HRMS)

**Niyukti** is a production-style, cloud-based Human Resource Management System designed to streamline the complete employee lifecycle — from recruitment and onboarding to workforce operations, payroll, approvals, documents, security, and AI-assisted HR workflows.

Developed during an internship at **Energy Efficiency Services Limited (EESL)**, Niyukti explores modern HR technology, enterprise workflows, and full-stack cloud application development.

> **From hiring to workforce management — one centralized HR platform.**

## 🌐 Live Project

**Live Demo:** https://hrms-manpower-portal.vercel.app  
**Backend API:** https://hrms-manpower-backend.onrender.com

> 💡 Try creating a **Candidate Account using your email** to explore the Candidate Portal and recruitment workflow.

---

## ✨ Key Features

### 👥 Role-Based Portals

Dedicated portals and permissions for:

- Administrator
- HR
- Manager
- Employee
- Candidate

### 💼 Recruitment Management

- Job Management
- Hiring Requests
- Candidate Pipeline
- Job Applications
- Candidate Reviews
- Interview Scheduling
- Offer Management
- Employee Onboarding

### 🧑‍💼 Workforce Operations

- Employee Management
- Attendance Management
- Shift Roster
- Leave Requests
- Business Tour Requests
- Expense Claims
- Payroll Information
- Resignation Workflow

### 💰 Finance & Approval Workflows

- Payroll Management
- Expense Processing
- Invoice and Billing Workflows
- Centralized Approval Center
- SLA and Action Tracking

### 📄 Documents & E-Sign

- Employee Documents
- Identity Proofs
- Offer Letters
- Contracts
- Certificates
- Signed Documents
- E-Sign Workflows
- Cloud-Based File Storage

### 🔔 Notifications

Notifications for:

- Leave Approvals
- Interview Schedules
- Recruitment Status
- Payroll Updates
- Company Announcements
- Pending Actions

### 🔐 Authentication & Security

- JWT Authentication
- Secure Bearer Token Authorization
- Role-Based Access Control (RBAC)
- Password Hashing
- Candidate Email Verification
- Forgot Password and Password Reset
- Account Lock Protection
- Audit Logs
- Security Logs
- Permission Controls
- Cross-Tab Logout Synchronization

### 🤖 AI HR Copilot

An initial AI-assisted HR module designed to support smarter HR insights and decision-support workflows.

### 📊 Administration & Analytics

- Admin Dashboard
- HR Dashboard
- Manager Dashboard
- Employee Dashboard
- Reports
- Analytics
- SLA Metrics
- Security Center
- Company Settings
- Branding and Logo Management
- Public Settings
- Integration Hub
- External Sync Workflows

---

## 🛠️ Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React.js, Vite, React Router DOM, Axios, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, RBAC |
| Email | Brevo Transactional Email |
| File Storage | Cloudinary |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | GitHub |

---

## 🏗️ System Architecture

```text
User / Candidate
       │
       ▼
React + Vite Frontend
       │
       │ REST API / Bearer Token
       ▼
Node.js + Express.js Backend
       │
       ├── Authentication & RBAC
       ├── Business Logic
       ├── Validation & Middleware
       ├── Brevo Email Service
       └── Cloudinary File Storage
       │
       ▼
MongoDB Atlas
