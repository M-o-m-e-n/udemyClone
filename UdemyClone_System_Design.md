# 🎓 Udemy Clone System Design and Project Plan

A comprehensive system design and project plan for EduMaster, an online learning platform similar to Udemy. This document outlines the architecture, workflows, data models, and a detailed project timeline.
---

## 1. 🏗️ System Architecture Overview

```mermaid
graph TD
  A["User"] --> B["Frontend - Next.js / React"]
  B --> C["API Gateway / Backend - Node.js (NestJS)"]
  C --> D["User Service / Auth (JWT)"]
  C --> E["Course Service (Postgres + Prisma)"]
  C --> F["Media Service (S3 / Cloudinary)"]
  C --> G["Payment Service (Stripe/PayPal)"]
  C --> H["Search Service (ElasticSearch)"]
  C --> I["Analytics / Event Bus"]
  F --> J["CDN / HLS Streaming"]
```

---

## 2. 🎥 Lecture Playback Flow

```mermaid
sequenceDiagram
  participant User as "User"
  participant FE as "Frontend"
  participant API as "API Gateway"
  participant Auth as "Auth Service"
  participant Course as "Course Service"
  participant Media as "Media Service (CDN)"
  User->>FE: Click 'Play' lecture
  FE->>API: GET /courses/{id}/lectures/{lid}/play (with JWT)
  API->>Auth: Validate JWT
  Auth-->>API: 200 OK
  API->>Course: Verify enrollment & permissions
  Course-->>API: 200 OK
  API->>Media: Request signed playback URL
  Media-->>API: Signed URL (short-lived)
  API-->>FE: Playback metadata + signed URL
  FE->>Media: Stream video (HLS/DASH)
```

---

## 3. 🧱 Course Creation Workflow

```mermaid
graph LR
  I["Instructor UI"] --> API["API Gateway"]
  API --> CourseSvc["Course Service (Postgres)"]
  API --> MediaSvc["Media Service (S3)"]
  MediaSvc --> Transcode["Transcoder Workers"]
  Transcode --> Storage["HLS Storage (S3)"]
  Transcode --> CDN["CDN"]
  Transcode --> CourseSvc["(notify via event)"]
```

---

## 4. 🧩 Simplified Data Model (ER Diagram)

```mermaid
erDiagram
  USERS ||--o{ COURSES : "creates"
  USERS ||--o{ ENROLLMENTS : "enrolls"
  COURSES ||--o{ LECTURES : "contains"
  COURSES ||--o{ REVIEWS : "has"
  ENROLLMENTS }o--|| COURSES : "for"
  USERS ||--o{ REVIEWS : "writes"
```

---

## 5. 📆 Project Plan

### 📅 Total Duration: ~14–16 Weeks

A breakdown of the Udemy Clone project into phases and time estimates.

### **Phase 1: Project Setup & Planning (1 week)**

| Task | Description | Duration |
|------|--------------|-----------|
| Requirements Review | Confirm features and priorities | 1 day |
| Tech Stack Setup | Setup Node.js, Prisma, PostgreSQL, React, Docker | 2 days |
| Folder Structure | Git, environment configs | 2 days |
| CI/CD Setup | GitHub Actions, Docker Compose | 2 days |

**Deliverable:** Backend + Frontend skeleton ready for development.

---

### **Phase 2: Authentication & Authorization (2 weeks)**

| Task | Description | Duration |
|------|--------------|-----------|
| User Registration/Login | JWT endpoints | 3 days |
| Password Hashing | bcrypt integration | 1 day |
| Token Management | Handle cookie token | 2 days |
| Role-Based Access | Middleware for roles | 3 days |
| Frontend Integration | Auth forms | 3 days |

**Deliverable:** Fully working Auth system.

---

### **Phase 3: Course Management (3 weeks)**

| Task | Description | Duration |
|------|--------------|-----------|
| Course Model | Define Prisma schema | 3 days |
| Instructor Dashboard | CRUD for courses | 4 days |
| Video Upload | Integrate S3/Cloudinary (automatic chunking) | 4 days |
| Course Listing | Filters and pagination | 3 days |
| Frontend UI | Course detail, lecture player | 5 days |

**Deliverable:** Instructors can create & students can view courses.

---

### **Phase 4: Enrollment & Payment (2 weeks)**

| Task | Description | Duration |
|------|--------------|-----------|
| Enrollment Model | DB and logic | 2 days |
| Stripe Integration | Checkout, webhooks | 4 days |
| Frontend Checkout | UI for payments | 3 days |
| Email Confirmation | Send post-purchase email | 3 days |

**Deliverable:** Paid course enrollment system live.

---

### **Phase 5: Reviews & Progress (2 weeks)**

| Task | Description | Duration |
|------|--------------|-----------|
| Reviews CRUD | Students can add/edit reviews | 2 days |
| Rating System | Aggregate ratings | 1 day |
| Progress Tracking | Track lectures per student | 3 days |
| Frontend Integration | Show ratings, progress bar | 4 days |

**Deliverable:** Student interaction & tracking features complete.

---

### **Phase 6: Admin Dashboard (1.5 weeks)**

| Task | Description | Duration |
|------|--------------|-----------|
| Admin Access | RBAC for admins | 2 days |
| Manage Courses/Users | CRUD admin tools | 4 days |
| Analytics | Revenue and enrollment reports | 3 days |

**Deliverable:** Admins can manage the platform.

---

### **Phase 7: Testing & Deployment (2.5 weeks)**

| Task | Description | Duration |
|------|--------------|-----------|
| Unit Testing | Jest / Supertest | 5 days |
| Frontend Testing | Cypress / React Testing Library | 3 days |
| Security Optimization | Helmet, CORS, Rate limiting | 3 days |
| Dockerization & Deploy | Nginx, CI/CD pipelines | 5 days |

**Deliverable:** Production-ready platform.

---

## 6. 🗓️ Gantt Chart

```mermaid
gantt
    title Udemy Clone Project Timeline
    dateFormat  YYYY-MM-DD
    section Setup & Planning
    Project Setup :done, des1, 2025-10-13, 7d
    section Authentication
    Auth System :active, des2, after des1, 14d
    section Course Management
    Course System :des3, after des2, 21d
    section Payment & Enrollment
    Payment Flow :des4, after des3, 14d
    section Reviews & Tracking
    Reviews & Progress :des5, after des4, 14d
    section Admin Dashboard
    Admin Panel :des6, after des5, 10d
    section Testing & Deployment
    QA & Deploy :des7, after des6, 18d
```

---

**Author:** ChatGPT (GPT-5)  
**Last Updated:** 2025-10-12
