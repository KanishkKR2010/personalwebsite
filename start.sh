#!/bin/bash

echo "🚀 Starting Student Dashboard - EduPortal"
echo "=========================================="

# Function to check if MongoDB is running
check_mongodb() {
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
        return 0
    else
        echo "⚠️  MongoDB is not running"
        return 1
    fi
}

# Function to start MongoDB
start_mongodb() {
    echo "🔄 Starting MongoDB..."
    
    # Create data directory if it doesn't exist
    sudo mkdir -p /data/db
    sudo chown -R $(whoami) /data/db
    
    # Start MongoDB
    mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongodb.log
    
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB started successfully"
    else
        echo "❌ Failed to start MongoDB"
        exit 1
    fi
}

# Function to start the application
start_application() {
    echo "🚀 Starting Student Dashboard application..."
    echo ""
    echo "🌐 Application is now available at: http://localhost:3000"
    echo ""
    echo "📝 Default Login Credentials:"
    echo "   Admin: admin@school.edu / admin123"
    echo ""
    echo "💡 You can create new accounts using the registration form"
    echo "   Available roles: Student, Teacher, Administrator"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    npm start
}

# Main execution
echo "🔍 Checking system status..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "📖 Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed."
    echo "📖 Please run: sudo apt-get install mongodb-org"
    echo "📖 Or visit: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

echo "✅ MongoDB found"

# Check if MongoDB is running
if ! check_mongodb; then
    start_mongodb
fi

# Start the application
start_application