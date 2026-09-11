# PhishGuard — Installation & Setup Guide

This guide details the steps required to set up and run the PhishGuard backend API, machine learning pipeline, and React frontend interface.

---

## Prerequisites

- **Python:** Version 3.10 or higher
- **Node.js:** Version 18.0 or higher (`npm` included)
- **Git:** Installed on system

---

## 1. Backend & ML Setup

### Step 1: Navigate to Project Root & Backend
```bash
cd phishguard/backend
```

### Step 2: Create & Activate Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Validate Dataset & Train Models (Optional if artifacts exist)
```bash
cd ../ml
python dataset_validator.py
python train.py
python evaluate_phase2.py
```

### Step 5: Start FastAPI Backend Server
```bash
cd ../backend
python run.py
```
- Server starts at: `http://localhost:8000`
- Interactive OpenAPI Docs available at: `http://localhost:8000/docs`
- Health check endpoint: `http://localhost:8000/health`

---

## 2. Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd phishguard/frontend
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Start Vite Development Server
```bash
npm run dev
```
- Frontend application runs at: `http://localhost:5173`

### Step 4: Build Production Bundle
```bash
npm run build
```
- Compiled production static files generated in `phishguard/frontend/dist/`.

---

## 3. Running Automated Tests

From the project root (`phishguard/`):
```bash
python -m unittest discover -s tests
```
- Executes all 38 unit and integration tests across backend, ML predictor, and threat intelligence modules.
