# Student Dashboard - EduPortal

A comprehensive educational management system with role-based access for students, teachers, and administrators.

## Features

### 🎓 Student Features
- **Personal Dashboard**: Overview of courses, assignments, and academic progress
- **Course Management**: View enrolled courses and course details
- **Assignment Tracking**: Track assignments and due dates
- **Grade Monitoring**: View grades and feedback from teachers
- **GPA Calculation**: Automatic GPA calculation based on grades

### 👨‍🏫 Teacher Features
- **Course Creation**: Create and manage courses
- **Assignment Management**: Create assignments with due dates and point values
- **Student Management**: View enrolled students in courses
- **Grade Center**: Grade assignments and provide feedback
- **Dashboard Analytics**: Overview of teaching statistics

### 👨‍💼 Admin Features
- **User Management**: View and manage all system users
- **System Overview**: Comprehensive statistics and analytics
- **Course Oversight**: Monitor all courses in the system
- **Reports**: Generate system reports and analytics

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Session-based authentication with bcrypt
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Modern CSS with Flexbox and Grid
- **Icons**: Font Awesome 6

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation & Setup

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start MongoDB**:
   ```bash
   # If using MongoDB service
   sudo systemctl start mongod
   
   # Or if using MongoDB directly
   mongod
   ```

4. **Configure environment variables**:
   - The `.env` file is already created with default values
   - Update the MongoDB connection string if needed
   - Change the JWT and session secrets for production

5. **Start the application**:
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**:
   - Open your browser and go to `http://localhost:3000`
   - The application will be running on port 3000

## Default Accounts

The system automatically creates a default admin account:

- **Email**: admin@school.edu
- **Password**: admin123
- **Role**: Administrator

You can create additional accounts using the registration form.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user info

### Student Endpoints
- `GET /api/student/courses` - Get student's courses
- `GET /api/student/assignments` - Get student's assignments
- `GET /api/student/grades` - Get student's grades

### Teacher Endpoints
- `GET /api/teacher/courses` - Get teacher's courses
- `POST /api/teacher/courses` - Create new course
- `POST /api/teacher/assignments` - Create new assignment
- `POST /api/teacher/grades` - Submit grades

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get system statistics

## Database Schema

### User
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (student/teacher/admin),
  firstName: String,
  lastName: String,
  createdAt: Date
}
```

### Course
```javascript
{
  name: String,
  code: String (unique),
  description: String,
  teacher: ObjectId (ref: User),
  students: [ObjectId] (ref: User),
  createdAt: Date
}
```

### Assignment
```javascript
{
  title: String,
  description: String,
  course: ObjectId (ref: Course),
  dueDate: Date,
  maxPoints: Number,
  createdAt: Date
}
```

### Grade
```javascript
{
  student: ObjectId (ref: User),
  assignment: ObjectId (ref: Assignment),
  course: ObjectId (ref: Course),
  points: Number,
  feedback: String,
  submittedAt: Date,
  gradedAt: Date
}
```

## File Structure

```
student-dashboard/
├── server.js              # Express server and API routes
├── package.json           # Project dependencies and scripts
├── .env                   # Environment variables
├── README.md              # Project documentation
└── public/                # Frontend files
    ├── index.html         # Login/Registration page
    ├── dashboard.html     # Main dashboard
    ├── css/
    │   └── style.css      # Styling
    └── js/
        ├── auth.js        # Authentication logic
        └── dashboard.js   # Dashboard functionality
```

## Usage Guide

### For Students:
1. Register with role "Student"
2. View your dashboard overview
3. Navigate to courses to see enrolled courses
4. Check assignments and due dates
5. Monitor your grades and GPA

### For Teachers:
1. Register with role "Teacher"
2. Create courses using the "Add Course" button
3. Create assignments for your courses
4. View enrolled students
5. Grade assignments and provide feedback

### For Administrators:
1. Use the default admin account or create a new admin user
2. View system statistics and overview
3. Manage all users in the system
4. Monitor courses and system activity

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- CORS protection
- Input validation and sanitization
- Secure cookie settings

## Customization

You can customize the application by:

- Modifying the CSS variables in `style.css`
- Adding new fields to the database schemas
- Extending the API with additional endpoints
- Adding new dashboard sections
- Implementing additional features like file uploads, messaging, etc.

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check the connection string in `.env`

2. **Port Already in Use**:
   - Change the PORT in `.env` file
   - Or stop other services using port 3000

3. **Session Issues**:
   - Clear browser cookies
   - Check session secret configuration

4. **Permission Errors**:
   - Ensure proper file permissions
   - Run with appropriate user privileges

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review the code comments
- Create an issue in the repository

---

**Note**: This is a educational project demonstrating a complete full-stack web application with authentication and role-based access control. For production use, additional security measures and testing should be implemented.