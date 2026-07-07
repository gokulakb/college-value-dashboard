## 📁 Project Structure

```text
college-value-dashboard/
│
├── config/
│   └── database.js
│
├── controllers/
│   ├── authController.js
│   ├── collegeController.js
│   ├── adminController.js
│   └── analyticsController.js
│
├── database/
│   ├── schema.sql
│   └── seed.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── routes/
│   ├── authRoutes.js
│   ├── collegeRoutes.js
│   ├── adminRoutes.js
│   ├── analyticsRoutes.js
│   └── exportRoutes.js
│
├── services/
│   ├── metricsService.js
│   ├── dataQualityService.js
│   └── auditService.js
│
├── utils/
│   └── csvExporter.js
│
├── data/
│   └── college_value.db
│
├── public/
│   ├── index.html
│   ├── college-dashboard.html
│   ├── admin-dashboard.html
│   ├── css/
│   │   ├── login.css
│   │   └── dashboard.css
│   └── js/
│       ├── login.js
│       ├── college-dashboard.js
│       └── admin-dashboard.js
│
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 📈 Metric Dictionary

| Metric | Definition | Source | Calculation | Decision Support |
| --- | --- | --- | --- | --- |
| Total Students | Total students in the college | `students` | `COUNT(*)` | Understand placement cohort size |
| Placement Rate | Eligible students who are placed | `students` | Placed ÷ Eligible × 100 | Evaluate placement performance |
| Engagement Rate | Students who submitted applications | `applications` | Applicants ÷ Eligible × 100 | Identify participation issues |

---

## 📊 Sample Data

The application includes realistic persisted sample data.

| Entity | Count | Details |
| --- | ---: | --- |
| Colleges | 4 | IITB, REVA, NITK, PESU |
| Users | 5 | 4 college officers and 1 admin |
| Students | 100 | Distributed across colleges |
| Applications | 150 | Multiple application stages |
| Offers | 35 | Multiple offer outcomes |
| Recruiter Activities | 40 | Multiple activity types |
| Portal Events | 200 | End-to-end portal activity |

---

## 👤 Demo Credentials

### College Users

| College | Email | Password |
| --- | --- | --- |
| IIT Bombay | `officer@iitb.edu` | `demo123` |
| REVA University | `officer@reva.edu` | `demo123` |
| NITK Surathkal | `officer@nitk.edu` | `demo123` |
| PES University | `officer@pes.edu` | `demo123` |

### Administrator

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@collegevalue.com` | `admin123` |
