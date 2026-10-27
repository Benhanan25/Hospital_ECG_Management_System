# Hospital ECG Management System

HTML + CSS + JavaScript + Node.js + Express.js + MongoDB.

## Install
1. Install Node.js.
2. Install MongoDB Community Server.
3. MongoDB Compass is optional.
4. Open this folder in VS Code.

## First run
Open VS Code Terminal in this folder:

npm install

Copy `.env.example` to `.env` and keep:
MONGO_URI=mongodb://127.0.0.1:27017/hospital_ecg

Then start:
npm start

Open:
http://localhost:5000

Login:
admin
Use the admin credentials configured in your .env file.

Features:
- Admin login
- Dashboard
- Auto Patient ID P001, P002...
- Duplicate prevention using name + DOB + gender
- OPD / Ward / Clinic visits
- Patient search
- ECG records
- ECG file upload
- MongoDB storage

This is an educational/development system. Real hospital deployment requires stronger authentication, authorization, HTTPS, audit logs, backups and privacy/security controls.
