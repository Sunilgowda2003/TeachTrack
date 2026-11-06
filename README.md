# 🎓 TeachTrack – Teacher Management System

A full-stack **Teacher Management System** built using **Java 21, Spring Boot, MySQL, HTML, CSS, and JavaScript**.

TeachTrack helps administrators efficiently manage teaching staff through a modern, responsive dashboard. It includes secure authentication, teacher CRUD operations, attendance management, reports, analytics, and application settings.

---

## 📸 Screenshots

### 🔐 Login Page

Secure administrator login with JWT-based authentication.

<p align="center">
  <img src="./TeachTrack-Frontend/Screenshots/login.png" width="850" alt="TeachTrack Login"/>
</p>

---

### 📊 Dashboard

The dashboard provides an overview of teacher-related information, including total teachers, active teachers, subjects, salary statistics, teacher distribution, and monthly salary analytics.

<table>
  <tr>
    <th align="center">🌙 Dark Mode</th>
    <th align="center">☀️ Light Mode</th>
  </tr>
  <tr>
    <td align="center">
      <img src="./TeachTrack-Frontend/Screenshots/dashboard-dark.png" width="500" alt="Dashboard Dark Mode"/>
    </td>
    <td align="center">
      <img src="./TeachTrack-Frontend/Screenshots/dashboard-light.png" width="500" alt="Dashboard Light Mode"/>
    </td>
  </tr>
</table>

---

### 👨‍🏫 Teacher Directory

Manage teaching staff using card-based or table-based layouts.

- Search teachers
- Filter by subject
- Sort teacher records
- Switch between grid and table views
- Edit and delete teacher information
- View teacher details such as email, subject, qualification, salary, and status

<table>
  <tr>
    <th align="center">Grid View</th>
    <th align="center">Table View</th>
  </tr>
  <tr>
    <td align="center">
      <img src="./TeachTrack-Frontend/Screenshots/teacher-directory-grid.png" width="500" alt="Teacher Directory Grid"/>
    </td>
    <td align="center">
      <img src="./TeachTrack-Frontend/Screenshots/teacher-directory-table.png" width="500" alt="Teacher Directory Table"/>
    </td>
  </tr>
</table>

---

### ➕ Add Teacher

Add new teacher records through a form containing teacher information such as name, email, phone, subject, qualification, and salary.

<p align="center">
  <img src="./TeachTrack-Frontend/Screenshots/add-teacher.png" width="850" alt="Add Teacher"/>
</p>

---

### 📅 Attendance Management

Manage and track daily teacher attendance.

- Select attendance date
- View attendance statistics
- Mark teachers as Present, Absent, Leave, or Not Marked
- Save attendance records
- View attendance information

<p align="center">
  <img src="./TeachTrack-Frontend/Screenshots/attendance.png" width="850" alt="Attendance Management"/>
</p>

---

### 📈 Reports & Analytics

Review teacher and attendance statistics through the reports dashboard.

- Total teacher statistics
- Active teacher statistics
- Present and absent counts
- Date-based attendance reports
- Export reports to Excel

<p align="center">
  <img src="./TeachTrack-Frontend/Screenshots/reports.png" width="850" alt="Reports and Analytics"/>
</p>

---

### ⚙️ Settings

Manage administrator profile and application preferences.

- Profile settings
- Theme customization
- Light and dark mode
- Font size preferences
- Notification preferences

<p align="center">
  <img src="./TeachTrack-Frontend/Screenshots/settings.png" width="850" alt="TeachTrack Settings"/>
</p>

---

## ✨ Features

### 🔐 Authentication and Security

- Admin login and authentication using JWT
- Password hashing using BCrypt
- Protected API endpoints
- Role-based authorization
- Session management
- Secure logout

### 👨‍🏫 Teacher Management

- Create, read, update, and delete teacher records
- Search teachers
- Filter teachers by subject
- Sort by name, salary, and joining date
- Pagination
- Grid and table views
- Teacher status management
- Form validation

### 📊 Dashboard

- Total teachers
- Active teachers
- Subject statistics
- Salary overview
- Teacher distribution analytics
- Monthly salary chart

### 📅 Attendance

- Daily attendance management
- Date selection
- Present, Absent, Leave, and Not Marked statuses
- Attendance statistics
- Attendance record saving

### 📈 Reports

- Teacher statistics
- Attendance reports
- Date-based filtering
- Excel report export

### ⚙️ Settings

- Administrator profile settings
- Light and dark themes
- Font size customization
- Notification preferences

---

## 🛠️ Technology Stack

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- Maven
- JWT Authentication
- BCrypt Password Encoding
- RESTful APIs

### Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API

### Database

- MySQL

### Development Tools

- Spring Tool Suite (STS)
- Visual Studio Code
- MySQL Workbench
- Postman
- Git
- GitHub

---

## 🏗️ Project Architecture

```text
TeachTrack
│
├── backend
│   └── Spring Boot Application
│       ├── config
│       ├── controller
│       ├── dto
│       ├── entity
│       ├── exception
│       ├── repository
│       ├── security
│       └── service
│
├── TeachTrack-Frontend
│   ├── Screenshots
│   ├── app.js
│   ├── index.html
│   └── style.css
│
└── README.md
```

### Architecture Flow

```text
Frontend (HTML, CSS, JavaScript)
             |
             | REST API Requests
             v
       Controller Layer
             |
             v
        Service Layer
             |
             v
      Repository Layer
             |
             v
        MySQL Database
```

The frontend communicates with the Spring Boot backend through REST APIs using the Fetch API. Teacher information is persisted in MySQL using Spring Data JPA and Hibernate.

---

## 🗄️ Database Setup

Create the database in MySQL:

```sql
CREATE DATABASE teachtrack_db;
```

Configure the database connection in `application.properties`.

Example configuration:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/teachtrack_db
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**Security Note:** Replace the placeholder credentials with your local configuration. Never commit database passwords or JWT secrets to GitHub.

---

## 🚀 Getting Started

### Prerequisites

Install the following tools:

- Java 21
- Maven
- MySQL
- Spring Tool Suite (STS)
- Visual Studio Code
- Live Server extension

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Sunilgowda2003/TeachTrack.git
   ```

2. Open the `backend` folder in Spring Tool Suite.
3. Configure Java 21.
4. Create the MySQL database.
5. Configure MySQL credentials in `application.properties`.
6. Configure the required JWT secret.
7. Update Maven dependencies if necessary.
8. Run `TeachtrackApplication.java` as a Spring Boot application.

**Backend URL:**

```text
http://localhost:8080
```

**API Base URL:**

```text
http://localhost:8080/api
```

### Frontend Setup

1. Open the `TeachTrack-Frontend` folder in Visual Studio Code.
2. Ensure the Spring Boot backend is running.
3. Open `index.html` using the Live Server extension.

**Frontend URL:**

```text
http://127.0.0.1:5500
```

---

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/register` | Register admin |

### Teacher Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teachers` | Retrieve all teachers |
| GET | `/api/teachers/{id}` | Retrieve teacher by ID |
| POST | `/api/teachers` | Add a teacher |
| PUT | `/api/teachers/{id}` | Update teacher details |
| DELETE | `/api/teachers/{id}` | Delete a teacher |

Teacher management endpoints require JWT authentication and administrator authorization.

---

## 🔒 Security

- JWT-based authentication
- BCrypt password hashing
- Protected REST API endpoints
- Role-based authorization
- Stateless authentication
- Input validation
- Global exception handling
- CORS configuration

---

## 🧪 Testing

The following functionality has been tested:

- Admin login
- Dashboard loading
- Teacher CRUD operations
- Teacher search and sorting
- Pagination
- Attendance management
- Reports and analytics
- Excel export
- Settings and theme customization
- Logout and session clearing
- Form validation
- Data persistence after refresh and re-login

---

## 🔮 Future Enhancements

- Cloud deployment
- Advanced analytics
- Automated notifications
- Additional reporting options

---

## 👨‍💻 Author

**Sunil J S**

Java Full Stack Developer

[GitHub Profile](https://github.com/Sunilgowda2003)

---

## 📄 License

This project is created for learning and portfolio purposes.
