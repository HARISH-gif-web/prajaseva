# 🏛️ PrajaSeva Portal - Government of Andhra Pradesh

> **People • Government • Together**  
> Official Citizen Services & Spandana Grievance Redressal e-Governance Platform

![PrajaSeva Portal Banner](https://img.shields.io/badge/Government_of_Andhra_Pradesh-PrajaSeva-059669?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 🌟 Overview

**PrajaSeva** is a modern e-Governance portal engineered for the citizens of Andhra Pradesh. The platform enables citizens to apply for state welfare schemes, request revenue certificates, lodge civic grievances under the Spandana framework, and track processing timelines in real time.

The system features **dual backend architectures** (Python FastAPI and Node.js) with 100% API parity, SQLite / JSON storage, and a resilient frontend with dynamic auto-detection and offline fallback.

---

## ✨ Features

- **Dynamic Zero-State Counting Engine**: Starts at clean 0 and counts submissions in real-time.
- **4-Step Application Engine**: Multi-step wizard for Jagananna Vidya Deevena (Fee Reimbursement) with document uploads and preview validation.
- **Real-Time Application Tracking**: Public reference tracker with 4-stage e-Governance audit timeline.
- **Spandana Grievance Redressal**: Lodge civic issues directly to municipal and revenue authorities with 7-day SLA tracking.
- **Multi-Credential Authentication**: Seamless citizen login using Email, 10-digit Mobile, or 12-digit Aadhaar.
- **Statutory Eligibility Calculator**: Evaluates income, caste category, and criteria instantly.
- **Dual Enterprise Backends**:
  - **Python FastAPI (`:8000`)**: OpenAPI Swagger UI (`/docs`), Pydantic v2 schemas, JWT auth.
  - **Node.js (`:5000`)**: Zero external dependencies, pure native modules, matching endpoints.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (3.10+ recommended)

### 2. Frontend Setup
```bash
# Navigate to portal root
npm install
npm run dev
# Running on http://localhost:3000/
```

### 3. Python FastAPI Backend (Port 8000)
```bash
# Start FastAPI backend
python backend-python/run_server.py
# API Docs available at http://127.0.0.1:8000/docs
```

### 4. Node.js Express-Compatible Backend (Port 5000)
```bash
# Start Node.js backend
node backend-node/server.js
# Health check at http://localhost:5000/api/health
```

---

## 🔑 Demo Accounts

| Role | Credential / Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@ap.gov.in` / `9876543210` / `453289012345` | `Citizen@123` | Kiran Kumar (Visakhapatnam, Gajuwaka) |
| **Officer** | `officer@ap.gov.in` | `Officer@123` | Sri R. Venkat Rao (Tahsildar / MRO) |
| **Admin** | `admin@ap.gov.in` | `Admin@123` | State IT Nodal Administrator |

---

## 🏛️ Supported Departments & Schemes

- **Revenue Department**: Caste, Income & Asset, Residence & Nativity Certificates, Webland 1B records.
- **Education Department**: Jagananna Vidya Deevena (Fee Reimbursement), Vasathi Deevena.
- **Health Department**: Dr. YSR Aarogyasri Health Scheme (Universal cashless healthcare up to ₹25 Lakhs).
- **Agriculture Department**: YSR Rythu Bharosa - PM KISAN input support.
- **Municipal Administration**: Civic maintenance, drinking water, streetlights, building approvals.
- **Transport Department**: Driving license renewals, LLR slot booking.
- **Housing Department**: YSR Jagananna Pedalandariki Illu housing colonies.

---

## 📄 License

Developed for the **Government of Andhra Pradesh** e-Governance initiative. All rights reserved.
