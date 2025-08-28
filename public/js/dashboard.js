// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    
    // Initialize dashboard
    init();
    
    async function init() {
        try {
            await loadCurrentUser();
            setupNavigation();
            setupEventListeners();
            loadDashboardData();
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            redirectToLogin();
        }
    }
    
    // Load current user data
    async function loadCurrentUser() {
        try {
            const response = await fetch('/api/me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Authentication failed');
            }
            
            currentUser = await response.json();
            updateUserGreeting();
            showRoleBasedNavigation();
            showRoleBasedDashboard();
        } catch (error) {
            console.error('Error loading user:', error);
            redirectToLogin();
        }
    }
    
    // Update user greeting
    function updateUserGreeting() {
        const userGreeting = document.getElementById('userGreeting');
        userGreeting.textContent = `Welcome, ${currentUser.firstName} ${currentUser.lastName}`;
    }
    
    // Show navigation based on user role
    function showRoleBasedNavigation() {
        // Hide all navigation sections
        document.getElementById('studentNav').classList.add('hidden');
        document.getElementById('teacherNav').classList.add('hidden');
        document.getElementById('adminNav').classList.add('hidden');
        
        // Show navigation for current user role
        const navElement = document.getElementById(`${currentUser.role}Nav`);
        if (navElement) {
            navElement.classList.remove('hidden');
        }
    }
    
    // Show dashboard based on user role
    function showRoleBasedDashboard() {
        // Hide all content sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.add('hidden'));
        
        // Show default section for user role
        const defaultSection = document.getElementById(`${currentUser.role}-overview`);
        if (defaultSection) {
            defaultSection.classList.remove('hidden');
        }
    }
    
    // Setup navigation
    function setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Hide all content sections
                const sections = document.querySelectorAll('.content-section');
                sections.forEach(section => section.classList.add('hidden'));
                
                // Show selected section
                const sectionId = this.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.remove('hidden');
                    loadSectionData(sectionId);
                }
            });
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', logout);
        
        // Dropdown toggle
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Modal event listeners
        setupModalListeners();
        
        // Close notification
        const closeNotification = document.getElementById('closeNotification');
        if (closeNotification) {
            closeNotification.addEventListener('click', function() {
                document.getElementById('notification').classList.add('hidden');
            });
        }
    }
    
    // Setup modal listeners
    function setupModalListeners() {
        // Course modal
        const addCourseBtn = document.getElementById('addCourseBtn');
        const courseModal = document.getElementById('courseModal');
        const courseForm = document.getElementById('courseForm');
        const cancelCourse = document.getElementById('cancelCourse');
        
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', () => {
                courseModal.classList.remove('hidden');
            });
        }
        
        if (cancelCourse) {
            cancelCourse.addEventListener('click', () => {
                courseModal.classList.add('hidden');
                courseForm.reset();
            });
        }
        
        if (courseForm) {
            courseForm.addEventListener('submit', handleCourseSubmission);
        }
        
        // Assignment modal
        const addAssignmentBtn = document.getElementById('addAssignmentBtn');
        const assignmentModal = document.getElementById('assignmentModal');
        const assignmentForm = document.getElementById('assignmentForm');
        const cancelAssignment = document.getElementById('cancelAssignment');
        
        if (addAssignmentBtn) {
            addAssignmentBtn.addEventListener('click', () => {
                loadTeacherCoursesForAssignment();
                assignmentModal.classList.remove('hidden');
            });
        }
        
        if (cancelAssignment) {
            cancelAssignment.addEventListener('click', () => {
                assignmentModal.classList.add('hidden');
                assignmentForm.reset();
            });
        }
        
        if (assignmentForm) {
            assignmentForm.addEventListener('submit', handleAssignmentSubmission);
        }
        
        // Close modal when clicking outside
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        // Close modal buttons
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                modal.classList.add('hidden');
            });
        });
    }
    
    // Load dashboard data based on section
    async function loadSectionData(sectionId) {
        try {
            switch (sectionId) {
                case 'student-overview':
                    await loadStudentOverview();
                    break;
                case 'student-courses':
                    await loadStudentCourses();
                    break;
                case 'student-assignments':
                    await loadStudentAssignments();
                    break;
                case 'student-grades':
                    await loadStudentGrades();
                    break;
                case 'teacher-overview':
                    await loadTeacherOverview();
                    break;
                case 'teacher-courses':
                    await loadTeacherCourses();
                    break;
                case 'teacher-assignments':
                    await loadTeacherAssignments();
                    break;
                case 'teacher-grades':
                    await loadTeacherGrades();
                    break;
                case 'admin-overview':
                    await loadAdminOverview();
                    break;
                case 'admin-users':
                    await loadAdminUsers();
                    break;
                case 'admin-courses':
                    await loadAdminCourses();
                    break;
                case 'admin-reports':
                    await loadAdminReports();
                    break;
            }
        } catch (error) {
            console.error('Error loading section data:', error);
            showNotification('Error loading data', 'error');
        }
    }
    
    // Load initial dashboard data
    async function loadDashboardData() {
        const defaultSection = `${currentUser.role}-overview`;
        await loadSectionData(defaultSection);
    }
    
    // Student functions
    async function loadStudentOverview() {
        try {
            const [courses, assignments, grades] = await Promise.all([
                fetch('/api/student/courses', { credentials: 'include' }).then(r => r.json()),
                fetch('/api/student/assignments', { credentials: 'include' }).then(r => r.json()),
                fetch('/api/student/grades', { credentials: 'include' }).then(r => r.json())
            ]);
            
            // Update stats
            document.getElementById('studentCourseCount').textContent = courses.length;
            document.getElementById('studentAssignmentCount').textContent = assignments.length;
            
            // Calculate GPA
            const gpa = calculateGPA(grades);
            document.getElementById('studentGPA').textContent = gpa.toFixed(1);
            
            // Display recent assignments
            displayRecentAssignments(assignments.slice(0, 5));
            
            // Display upcoming deadlines
            displayUpcomingDeadlines(assignments);
            
        } catch (error) {
            console.error('Error loading student overview:', error);
        }
    }
    
    async function loadStudentCourses() {
        try {
            const courses = await fetch('/api/student/courses', { credentials: 'include' }).then(r => r.json());
            displayCourses(courses, 'coursesList');
        } catch (error) {
            console.error('Error loading student courses:', error);
        }
    }
    
    async function loadStudentAssignments() {
        try {
            const assignments = await fetch('/api/student/assignments', { credentials: 'include' }).then(r => r.json());
            displayAssignmentsTable(assignments, 'assignmentsList');
        } catch (error) {
            console.error('Error loading student assignments:', error);
        }
    }
    
    async function loadStudentGrades() {
        try {
            const grades = await fetch('/api/student/grades', { credentials: 'include' }).then(r => r.json());
            displayGradesTable(grades, 'gradesList');
        } catch (error) {
            console.error('Error loading student grades:', error);
        }
    }
    
    // Teacher functions
    async function loadTeacherOverview() {
        try {
            const courses = await fetch('/api/teacher/courses', { credentials: 'include' }).then(r => r.json());
            
            let totalStudents = 0;
            courses.forEach(course => {
                totalStudents += (course.students || []).length;
            });
            
            document.getElementById('teacherCourseCount').textContent = courses.length;
            document.getElementById('teacherStudentCount').textContent = totalStudents;
            document.getElementById('teacherAssignmentCount').textContent = '0'; // Would need assignments endpoint
            
        } catch (error) {
            console.error('Error loading teacher overview:', error);
        }
    }
    
    async function loadTeacherCourses() {
        try {
            const courses = await fetch('/api/teacher/courses', { credentials: 'include' }).then(r => r.json());
            displayCourses(courses, 'teacherCoursesList');
        } catch (error) {
            console.error('Error loading teacher courses:', error);
        }
    }
    
    async function loadTeacherAssignments() {
        try {
            // This would require a teacher assignments endpoint
            document.getElementById('teacherAssignmentsList').innerHTML = '<p>No assignments created yet.</p>';
        } catch (error) {
            console.error('Error loading teacher assignments:', error);
        }
    }
    
    async function loadTeacherGrades() {
        try {
            // This would require a teacher grades endpoint
            document.getElementById('gradingInterface').innerHTML = '<p>Grade management interface coming soon.</p>';
        } catch (error) {
            console.error('Error loading teacher grades:', error);
        }
    }
    
    // Admin functions
    async function loadAdminOverview() {
        try {
            const stats = await fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json());
            
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('totalStudents').textContent = stats.totalStudents;
            document.getElementById('totalTeachers').textContent = stats.totalTeachers;
            document.getElementById('totalCourses').textContent = stats.totalCourses;
            
        } catch (error) {
            console.error('Error loading admin overview:', error);
        }
    }
    
    async function loadAdminUsers() {
        try {
            const users = await fetch('/api/admin/users', { credentials: 'include' }).then(r => r.json());
            displayUsersTable(users, 'usersList');
        } catch (error) {
            console.error('Error loading admin users:', error);
        }
    }
    
    async function loadAdminCourses() {
        try {
            // This would require an admin courses endpoint
            document.getElementById('allCoursesList').innerHTML = '<p>Course management interface coming soon.</p>';
        } catch (error) {
            console.error('Error loading admin courses:', error);
        }
    }
    
    async function loadAdminReports() {
        // Reports functionality would be implemented here
        console.log('Admin reports loaded');
    }
    
    // Helper functions
    function calculateGPA(grades) {
        if (grades.length === 0) return 0;
        
        let totalPoints = 0;
        let totalMaxPoints = 0;
        
        grades.forEach(grade => {
            totalPoints += grade.points;
            totalMaxPoints += grade.assignment.maxPoints;
        });
        
        return totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 4.0 : 0;
    }
    
    function displayRecentAssignments(assignments) {
        const container = document.getElementById('recentAssignments');
        if (!container) return;
        
        if (assignments.length === 0) {
            container.innerHTML = '<p>No recent assignments.</p>';
            return;
        }
        
        const html = assignments.map(assignment => `
            <div class="assignment-item">
                <h4>${assignment.title}</h4>
                <p><strong>Course:</strong> ${assignment.course.name}</p>
                <p><strong>Due:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    function displayUpcomingDeadlines(assignments) {
        const container = document.getElementById('upcomingDeadlines');
        if (!container) return;
        
        const upcoming = assignments
            .filter(assignment => new Date(assignment.dueDate) > new Date())
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = '<p>No upcoming deadlines.</p>';
            return;
        }
        
        const html = upcoming.map(assignment => `
            <div class="deadline-item">
                <h4>${assignment.title}</h4>
                <p><strong>Course:</strong> ${assignment.course.name}</p>
                <p><strong>Due:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    function displayCourses(courses, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (courses.length === 0) {
            container.innerHTML = '<p>No courses found.</p>';
            return;
        }
        
        const html = courses.map(course => `
            <div class="card">
                <div class="card-header">
                    <h3>${course.name}</h3>
                </div>
                <div class="card-body">
                    <p><strong>Code:</strong> ${course.code}</p>
                    <p><strong>Description:</strong> ${course.description || 'No description available'}</p>
                    ${course.teacher ? `<p><strong>Teacher:</strong> ${course.teacher.firstName} ${course.teacher.lastName}</p>` : ''}
                    ${course.students ? `<p><strong>Students:</strong> ${course.students.length}</p>` : ''}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    function displayAssignmentsTable(assignments, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (assignments.length === 0) {
            container.innerHTML = '<p>No assignments found.</p>';
            return;
        }
        
        const html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Course</th>
                        <th>Due Date</th>
                        <th>Max Points</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${assignments.map(assignment => `
                        <tr>
                            <td>${assignment.title}</td>
                            <td>${assignment.course.name}</td>
                            <td>${new Date(assignment.dueDate).toLocaleDateString()}</td>
                            <td>${assignment.maxPoints}</td>
                            <td>
                                <span class="badge ${new Date(assignment.dueDate) > new Date() ? 'badge-warning' : 'badge-danger'}">
                                    ${new Date(assignment.dueDate) > new Date() ? 'Pending' : 'Overdue'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    function displayGradesTable(grades, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (grades.length === 0) {
            container.innerHTML = '<p>No grades found.</p>';
            return;
        }
        
        const html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Assignment</th>
                        <th>Course</th>
                        <th>Points</th>
                        <th>Max Points</th>
                        <th>Percentage</th>
                        <th>Feedback</th>
                    </tr>
                </thead>
                <tbody>
                    ${grades.map(grade => {
                        const percentage = ((grade.points / grade.assignment.maxPoints) * 100).toFixed(1);
                        return `
                            <tr>
                                <td>${grade.assignment.title}</td>
                                <td>${grade.course.name}</td>
                                <td>${grade.points}</td>
                                <td>${grade.assignment.maxPoints}</td>
                                <td>
                                    <span class="badge ${percentage >= 90 ? 'badge-success' : percentage >= 70 ? 'badge-warning' : 'badge-danger'}">
                                        ${percentage}%
                                    </span>
                                </td>
                                <td>${grade.feedback || 'No feedback'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    function displayUsersTable(users, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (users.length === 0) {
            container.innerHTML = '<p>No users found.</p>';
            return;
        }
        
        const html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.firstName} ${user.lastName}</td>
                            <td>${user.email}</td>
                            <td>${user.username}</td>
                            <td>
                                <span class="badge ${
                                    user.role === 'admin' ? 'badge-danger' : 
                                    user.role === 'teacher' ? 'badge-warning' : 'badge-info'
                                }">
                                    ${user.role}
                                </span>
                            </td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    // Form handlers
    async function handleCourseSubmission(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('courseName').value,
            code: document.getElementById('courseCode').value,
            description: document.getElementById('courseDescription').value
        };
        
        try {
            const response = await fetch('/api/teacher/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showNotification('Course created successfully!', 'success');
                document.getElementById('courseModal').classList.add('hidden');
                document.getElementById('courseForm').reset();
                loadTeacherCourses(); // Reload courses
            } else {
                const data = await response.json();
                showNotification(data.error || 'Error creating course', 'error');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            showNotification('Network error. Please try again.', 'error');
        }
    }
    
    async function handleAssignmentSubmission(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('assignmentTitle').value,
            course: document.getElementById('assignmentCourse').value,
            description: document.getElementById('assignmentDescription').value,
            dueDate: document.getElementById('assignmentDueDate').value,
            maxPoints: parseInt(document.getElementById('assignmentMaxPoints').value)
        };
        
        try {
            const response = await fetch('/api/teacher/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showNotification('Assignment created successfully!', 'success');
                document.getElementById('assignmentModal').classList.add('hidden');
                document.getElementById('assignmentForm').reset();
                loadTeacherAssignments(); // Reload assignments
            } else {
                const data = await response.json();
                showNotification(data.error || 'Error creating assignment', 'error');
            }
        } catch (error) {
            console.error('Error creating assignment:', error);
            showNotification('Network error. Please try again.', 'error');
        }
    }
    
    async function loadTeacherCoursesForAssignment() {
        try {
            const courses = await fetch('/api/teacher/courses', { credentials: 'include' }).then(r => r.json());
            const select = document.getElementById('assignmentCourse');
            
            select.innerHTML = '<option value="">Select Course</option>';
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.code} - ${course.name}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading teacher courses:', error);
        }
    }
    
    // Logout function
    async function logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.href = '/';
            } else {
                showNotification('Error logging out', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Network error during logout', 'error');
        }
    }
    
    // Redirect to login
    function redirectToLogin() {
        window.location.href = '/';
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 5000);
        }
    }
});