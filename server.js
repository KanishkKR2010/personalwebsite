const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  console.log('Note: Install and start MongoDB to use the database features');
  console.log('For now, the server will start but database operations will fail');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Course Schema
const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  dueDate: { type: Date, required: true },
  maxPoints: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
});

// Grade Schema
const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  points: { type: Number, required: true },
  feedback: { type: String },
  submittedAt: { type: Date },
  gradedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Grade = mongoose.model('Grade', gradeSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  if (req.session.userId) {
    User.findById(req.session.userId).then(user => {
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ error: 'Invalid session' });
      }
    }).catch(err => {
      res.status(500).json({ error: 'Server error' });
    });
  } else {
    res.status(401).json({ error: 'Access denied' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

// Routes

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'student'
    });
    
    await user.save();
    
    // Create session
    req.session.userId = user._id;
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    req.session.userId = user._id;
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role
  });
});

// Student Routes
app.get('/api/student/courses', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id }).populate('teacher', 'firstName lastName');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/student/assignments', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id });
    const courseIds = courses.map(course => course._id);
    const assignments = await Assignment.find({ course: { $in: courseIds } }).populate('course', 'name code');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/student/grades', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.user._id })
      .populate('assignment', 'title maxPoints')
      .populate('course', 'name code');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Teacher Routes
app.get('/api/teacher/courses', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id }).populate('students', 'firstName lastName email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/teacher/courses', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const course = new Course({
      name,
      code,
      description,
      teacher: req.user._id
    });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/teacher/assignments', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { title, description, course, dueDate, maxPoints } = req.body;
    const assignment = new Assignment({
      title,
      description,
      course,
      dueDate,
      maxPoints
    });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/teacher/grades', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { student, assignment, course, points, feedback } = req.body;
    const grade = new Grade({
      student,
      assignment,
      course,
      points,
      feedback
    });
    await grade.save();
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalCourses = await Course.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    
    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalAssignments
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Initialize default admin user
const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        username: 'admin',
        email: 'admin@school.edu',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin user created - Email: admin@school.edu, Password: admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the student dashboard`);
  initializeAdmin();
});