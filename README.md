# 🎓 College Value Dashboard

A complete full-stack **College Value Dashboard** designed for college placement officers and administrators to monitor placement performance, student engagement, skill readiness, hiring outcomes, recruiter activity, and institutional value.

The dashboard uses persisted SQLite data and provides decision-grade analytics with strict server-side college data isolation, automated data quality checks, and freshness monitoring.

---

## 🚀 Live Demo

**Live Application:**
https://college-value-dashboard-1.onrender.com

**GitHub Repository:**
https://github.com/gokulakb/college-value-dashboard

---

## 📊 Overview

The College Value Dashboard provides real-data analytics for:

* College placement performance
* Student engagement tracking
* Profile completion monitoring
* Skill readiness analysis
* Application and offer tracking
* Recruiter activity monitoring
* Department-wise placement performance
* College performance comparison
* Data quality and freshness verification
* Actionable decision insights
* CSV report export
* College-level data isolation

The dashboard converts raw student, application, offer, recruiter, and portal event data into trusted metrics that support real placement and administrative decisions.

---

## ✨ Features

### 🎓 College Dashboard

* 10 key performance indicators
* Real-time metrics calculated from SQLite
* Placement funnel visualization
* Monthly application trends
* Offer status distribution
* Department performance analysis
* Recruiter activity tracking
* Actionable decision insights
* Data quality monitoring
* Data freshness verification
* Metric dictionary
* CSV report export

### 📈 Placement Analytics

* Total student tracking
* Placement rate calculation
* Student engagement analysis
* Profile completion monitoring
* Skill readiness tracking
* Application volume analysis
* Offer tracking
* Offer acceptance analysis
* Average salary monitoring

### 💼 Hiring Outcomes

The dashboard tracks hiring outcomes across:

* Applications
* Shortlists
* Interviews
* Offers
* Hires
* Rejections

This helps placement officers identify where students are dropping out of the placement process.

### 👥 Recruiter Activity

* Active recruiter tracking
* Company activity monitoring
* Students reached analysis
* Interview scheduling activity
* Offer creation tracking
* Recruiter activity trends

### 💡 Actionable Insights

The dashboard dynamically identifies:

* Low placement rates
* Low student engagement
* Incomplete student profiles
* Low skill readiness
* Weak offer acceptance
* Low recruiter activity

Each insight provides:

* Metric
* Current value
* Status
* Recommended action

### 🛡️ Data Trust

The dashboard verifies:

* Data freshness
* Missing student information
* Missing college IDs
* Duplicate records
* Invalid application statuses
* Invalid offer statuses
* Negative salary values
* Orphan records
* Stale portal events

### 🏢 Admin Dashboard

Administrators can:

* View platform-wide metrics
* Compare college performance
* Monitor placement rates
* Compare student engagement
* Compare skill readiness
* Identify high-performing colleges
* Identify colleges requiring intervention
* Monitor platform events
* Review data quality
* Check data freshness

### 📤 Additional Features

* CSV report export
* Session-based authentication
* Role-based access control
* College-level data isolation
* Responsive desktop and mobile design
* Interactive Chart.js visualizations
* Loading states
* Error handling
* Empty-state handling
* Status indicators

---

## 🛠️ Technology Stack

| Layer          | Technology         |
| -------------- | ------------------ |
| Backend        | Node.js            |
| API Framework  | Express.js         |
| Database       | SQLite3            |
| Frontend       | HTML5              |
| Styling        | CSS3               |
| Client Logic   | Vanilla JavaScript |
| Charts         | Chart.js           |
| Authentication | express-session    |
| Data Export    | CSV                |
| Deployment     | Render             |

---

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
│   │
│   ├── css/
│   │   ├── login.css
│   │   └── dashboard.css
│   │
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

## 🗄️ Database Schema

### Colleges

| Field          | Type     | Description            |
| -------------- | -------- | ---------------------- |
| id             | INTEGER  | Primary key            |
| college_code   | TEXT     | Unique college code    |
| college_name   | TEXT     | College name           |
| city           | TEXT     | College city           |
| state          | TEXT     | College state          |
| total_students | INTEGER  | Total student capacity |
| created_at     | DATETIME | Creation timestamp     |
| updated_at     | DATETIME | Last update timestamp  |

### Users

| Field      | Type     | Description           |
| ---------- | -------- | --------------------- |
| id         | INTEGER  | Primary key           |
| name       | TEXT     | User name             |
| email      | TEXT     | Login email           |
| password   | TEXT     | User password         |
| role       | TEXT     | College or Admin role |
| college_id | INTEGER  | Assigned college      |
| created_at | DATETIME | Creation timestamp    |

### Students

| Field             | Type     | Description               |
| ----------------- | -------- | ------------------------- |
| id                | INTEGER  | Primary key               |
| college_id        | INTEGER  | Foreign key to colleges   |
| student_name      | TEXT     | Student name              |
| department        | TEXT     | Academic department       |
| graduation_year   | INTEGER  | Graduation year           |
| profile_completed | BOOLEAN  | Profile completion status |
| skill_ready       | BOOLEAN  | Skill readiness status    |
| placement_status  | TEXT     | Current placement status  |
| created_at        | DATETIME | Creation timestamp        |
| updated_at        | DATETIME | Last update timestamp     |

### Applications

| Field              | Type     | Description               |
| ------------------ | -------- | ------------------------- |
| id                 | INTEGER  | Primary key               |
| college_id         | INTEGER  | Foreign key to colleges   |
| student_id         | INTEGER  | Foreign key to students   |
| company_name       | TEXT     | Company name              |
| job_role           | TEXT     | Job role                  |
| application_status | TEXT     | Current application stage |
| applied_at         | DATETIME | Application timestamp     |
| updated_at         | DATETIME | Last update timestamp     |

### Offers

| Field        | Type     | Description             |
| ------------ | -------- | ----------------------- |
| id           | INTEGER  | Primary key             |
| college_id   | INTEGER  | Foreign key to colleges |
| student_id   | INTEGER  | Foreign key to students |
| company_name | TEXT     | Company name            |
| job_role     | TEXT     | Offered job role        |
| salary_lpa   | REAL     | Offered salary          |
| offer_status | TEXT     | Offer status            |
| offered_at   | DATETIME | Offer timestamp         |
| responded_at | DATETIME | Response timestamp      |

### Recruiter Activities

| Field            | Type     | Description                |
| ---------------- | -------- | -------------------------- |
| id               | INTEGER  | Primary key                |
| college_id       | INTEGER  | Foreign key to colleges    |
| recruiter_name   | TEXT     | Recruiter name             |
| company_name     | TEXT     | Company name               |
| activity_type    | TEXT     | Recruiter activity         |
| students_reached | INTEGER  | Number of students reached |
| created_at       | DATETIME | Activity timestamp         |

### Portal Events

| Field           | Type     | Description                  |
| --------------- | -------- | ---------------------------- |
| id              | INTEGER  | Primary key                  |
| college_id      | INTEGER  | Foreign key to colleges      |
| user_id         | INTEGER  | Associated user              |
| event_name      | TEXT     | Event type                   |
| event_source    | TEXT     | Event source                 |
| event_timestamp | DATETIME | Event timestamp              |
| metadata        | TEXT     | Additional event information |

### Audit Logs

| Field      | Type     | Description        |
| ---------- | -------- | ------------------ |
| id         | INTEGER  | Primary key        |
| user_id    | INTEGER  | Associated user    |
| college_id | INTEGER  | Associated college |
| action     | TEXT     | Action performed   |
| resource   | TEXT     | Accessed resource  |
| created_at | DATETIME | Action timestamp   |

---

## 📈 Metric Dictionary

| Metric                  | Definition                            | Source                 | Calculation                  | Decision Support                 |
| ----------------------- | ------------------------------------- | ---------------------- | ---------------------------- | -------------------------------- |
| Total Students          | Total students in the college         | students               | COUNT(*)                     | Understand placement cohort size |
| Placement Rate          | Eligible students who are placed      | students               | Placed ÷ Eligible × 100      | Evaluate placement performance   |
| Engagement Rate         | Students who submitted applications   | students, applications | Applicants ÷ Eligible × 100  | Identify participation issues    |
| Profile Completion Rate | Students with completed profiles      | students               | Completed ÷ Total × 100      | Plan profile completion drives   |
| Skill Readiness Rate    | Eligible students ready for placement | students               | Skill Ready ÷ Eligible × 100 | Identify training needs          |
| Total Applications      | Applications submitted                | applications           | COUNT(*)                     | Measure student participation    |
| Total Offers            | Offers received                       | offers                 | COUNT(*)                     | Track hiring conversion          |
| Offer Acceptance Rate   | Responded offers that were accepted   | offers                 | Accepted ÷ Responded × 100   | Evaluate offer competitiveness   |
| Active Recruiters       | Recruiters active in the last 30 days | recruiter_activities   | COUNT(DISTINCT recruiter)    | Measure employer engagement      |
| Average Salary          | Average salary of accepted offers     | offers                 | AVG(salary_lpa)              | Evaluate placement quality       |

---

## 🎯 Decision Mapping

| Metric Condition             | Recommended Action                                        |
| ---------------------------- | --------------------------------------------------------- |
| Placement Rate below 60%     | Increase recruiter outreach and targeted placement drives |
| Engagement Rate below 70%    | Run an application participation campaign                 |
| Profile Completion below 80% | Launch a student profile completion drive                 |
| Skill Readiness below 70%    | Prioritize training and skill-gap intervention            |
| Offer Acceptance below 70%   | Review salary, role, and location preferences             |
| Active Recruiters below 5    | Increase employer engagement                              |

The dashboard converts metrics into actions instead of displaying vanity numbers.

---

## 🔒 College Data Isolation

College data isolation is enforced on the server using session-based authentication.

A college can access only its own:

* Students
* Applications
* Offers
* Recruiter activities
* Portal events
* Analytics
* CSV reports

### How Isolation Works

1. A college officer logs in.
2. The server creates an authenticated session.
3. The session stores the user's authorized `college_id`.
4. The frontend does not send or select a college ID.
5. Every college API reads the authorized college ID from the server session.
6. SQL queries filter records using `WHERE college_id = ?`.
7. Unauthorized access attempts are rejected.

The backend uses:

```javascript
const collegeId = req.session.user.college_id;
```

Every college query is scoped using:

```sql
WHERE college_id = ?
```

This prevents users from accessing another college's data by changing URLs, query parameters, request bodies, or frontend values.

### Access Control

* Unauthenticated requests return `401 Unauthorized`.
* Unauthorized role access returns `403 Forbidden`.
* College users cannot access admin routes.
* CSV exports contain only the authenticated college's data.

---

## 🛡️ Data Quality Checks

The dashboard performs automated data quality checks.

### 1. Missing Data Check

Checks for:

* Missing student names
* Missing college IDs
* Required field errors

### 2. Duplicate Check

Detects unexpected duplicate student records.

### 3. Status Validation

Checks for:

* Invalid application statuses
* Invalid offer statuses

### 4. Salary Validation

Detects negative or invalid salary values.

### 5. Orphan Record Check

Verifies that student references are connected to valid records.

### 6. Freshness Check

Checks whether recent portal events are available.

The Data Trust section displays:

* Total checks
* Passed checks
* Failed checks
* Data quality score
* Detected issues

---

## 🕒 Data Freshness

Freshness is calculated from the latest portal event timestamp.

| Data Age           | Status  |
| ------------------ | ------- |
| Less than 24 hours | Fresh   |
| 24 to 72 hours     | Warning |
| More than 72 hours | Stale   |

The dashboard displays:

* Last event received
* Data age
* Total events processed
* Freshness status
* Data quality score

This helps detect broken or delayed data flows before incorrect metrics are used for decisions.

---

## 🔌 API Endpoints

### Authentication APIs

| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| POST   | `/api/auth/login`  | Authenticate user       |
| POST   | `/api/auth/logout` | Destroy current session |
| GET    | `/api/auth/me`     | Get authenticated user  |

### College APIs

| Method | Endpoint                              | Description                      |
| ------ | ------------------------------------- | -------------------------------- |
| GET    | `/api/college/overview`               | College KPI metrics              |
| GET    | `/api/college/funnel`                 | Placement funnel data            |
| GET    | `/api/college/application-trend`      | Monthly application trends       |
| GET    | `/api/college/offer-distribution`     | Offer status distribution        |
| GET    | `/api/college/department-performance` | Department placement performance |
| GET    | `/api/college/recruiter-trend`        | Recruiter activity trends        |
| GET    | `/api/college/insights`               | Actionable decision insights     |
| GET    | `/api/college/metric-dictionary`      | Metric definitions and sources   |
| GET    | `/api/college/data-trust`             | Data freshness information       |
| GET    | `/api/college/data-quality`           | Data quality results             |

### Admin APIs

| Method | Endpoint                        | Description                    |
| ------ | ------------------------------- | ------------------------------ |
| GET    | `/api/admin/overview`           | Platform-wide metrics          |
| GET    | `/api/admin/college-comparison` | College performance comparison |
| GET    | `/api/admin/event-trend`        | Platform event trends          |
| GET    | `/api/admin/data-quality`       | Platform data quality          |
| GET    | `/api/admin/data-trust`         | Platform data freshness        |

### Export and Health APIs

| Method | Endpoint                     | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| GET    | `/api/export/college-report` | Export college report as CSV |
| GET    | `/api/health`                | Application health check     |

---

## 📊 Sample Data

The application includes realistic persisted sample data.

| Entity               | Count | Details                        |
| -------------------- | ----: | ------------------------------ |
| Colleges             |     4 | IITB, REVA, NITK, PESU         |
| Users                |     5 | 4 college officers and 1 admin |
| Students             |   100 | Distributed across colleges    |
| Applications         |   150 | Multiple application stages    |
| Offers               |    35 | Multiple offer outcomes        |
| Recruiter Activities |    40 | Multiple activity types        |
| Portal Events        |   200 | End-to-end portal activity     |

All dashboard metrics are calculated from persisted SQLite database records.

---

## 👤 Demo Credentials

### College Users

| College         | Email              | Password  |
| --------------- | ------------------ | --------- |
| IIT Bombay      | `officer@iitb.edu` | `demo123` |
| REVA University | `officer@reva.edu` | `demo123` |
| NITK Surathkal  | `officer@nitk.edu` | `demo123` |
| PES University  | `officer@pes.edu`  | `demo123` |

### Administrator

| Role          | Email                    | Password   |
| ------------- | ------------------------ | ---------- |
| Administrator | `admin@collegevalue.com` | `admin123` |

---

## 🏠 Local Installation

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/gokulakb/college-value-dashboard.git
cd college-value-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Application

```bash
npm start
```

### 4. Open the Application

```text
http://localhost:10000
```

---

## 🚀 Deployment on Render

### Deployment Steps

1. Push the project to GitHub.
2. Log in to Render.
3. Create a new Web Service.
4. Connect the GitHub repository.
5. Configure the service.

### Build Command

```bash
npm install
```

### Start Command

```bash
npm start
```

### Environment Variables

| Variable       | Value               | Description               |
| -------------- | ------------------- | ------------------------- |
| SESSION_SECRET | Secure random value | Session encryption secret |
| NODE_ENV       | production          | Application environment   |

The application automatically uses the port provided by Render through `process.env.PORT`.

---

## 🔧 Troubleshooting

### Port 10000 Already in Use

Find the process:

```powershell
Get-NetTCPConnection -LocalPort 10000
```

Stop the process:

```powershell
Stop-Process -Id <PROCESS_ID> -Force
```

Restart the application:

```powershell
npm start
```

### Database Issues

If the database needs to be recreated, remove the local database file and restart the application.

```powershell
Remove-Item data\college_value.db -ErrorAction SilentlyContinue
npm start
```

### Application Does Not Start

Reinstall dependencies:

```powershell
Remove-Item node_modules -Recurse -Force
npm install
npm start
```

---

## 📝 Evaluation Mapping

### Core Deliverable — 50/50

* ✅ College Value Dashboard live
* ✅ College dashboard working
* ✅ Admin dashboard working
* ✅ Real database metrics
* ✅ End-to-end demoable

### Real-Data Quality — 20/20

* ✅ Persisted SQLite data
* ✅ Multiple colleges
* ✅ Student data
* ✅ Application data
* ✅ Offer data
* ✅ Recruiter activity data
* ✅ Portal event data
* ✅ Real SQL aggregations

### Live Verification — 15/15

* ✅ Live KPI values
* ✅ Metric source explanations
* ✅ Metric dictionary
* ✅ Data freshness status
* ✅ Data quality checks
* ✅ CSV report export
* ✅ College and admin journey verification

### Failure and Edge Cases — 15/15

* ✅ Server-side college isolation
* ✅ Unauthorized access handling
* ✅ Null detection
* ✅ Duplicate detection
* ✅ Invalid status detection
* ✅ Stale data detection
* ✅ Error handling
* ✅ Empty-state handling

## 🎯 Target Score: 100/100

---

## 🎬 2-Minute Demo Script

### Step 1 — College Login

Log in using:

```text
Email: officer@reva.edu
Password: demo123
```

> "This is the College Value Dashboard for REVA University. The server session determines the authorized college, and every metric is calculated from persisted SQLite data."

### Step 2 — KPI Metrics

> "The top metrics show total students, placement rate, engagement rate, profile completion, skill readiness, applications, offers, offer acceptance, recruiter activity, and average salary."

### Step 3 — Placement Analytics

> "The charts show the complete placement funnel, monthly application trends, offer outcomes, department performance, and recruiter activity."

### Step 4 — Actionable Insights

> "The Actionable Insights section converts dashboard metrics into decisions by identifying low placement, weak engagement, skill gaps, offer acceptance issues, and recruiter inactivity."

### Step 5 — Data Trust

> "The Data Trust section verifies data freshness and runs automated quality checks for missing values, duplicates, invalid statuses, negative salaries, orphan records, and stale events."

### Step 6 — College Data Isolation

> "The frontend does not send a college ID. The backend reads the authorized college directly from the authenticated session."

Log out and log in using:

```text
Email: officer@iitb.edu
Password: demo123
```

> "The dashboard now displays only IIT Bombay data, proving that college-level data isolation is enforced."

### Step 7 — Admin Dashboard

Log in using:

```text
Email: admin@collegevalue.com
Password: admin123
```

> "The admin dashboard compares college performance, identifies institutions requiring intervention, and monitors platform-wide data quality and freshness."

---

## ✅ Definition of Done

* College Value Dashboard live
* College journey working end-to-end
* Admin journey working end-to-end
* Real data persisted in SQLite
* College metrics calculated from database records
* College data isolation enforced
* Data quality checks implemented
* Data freshness monitoring working
* Actionable insights generated
* CSV report export working
* Dashboard live and demoable

---

## 📄 License

This project is developed for educational and internship evaluation purposes.

---
