#!/bin/bash

echo "🚀 Setting up Student Dashboard - EduPortal"
echo "============================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install MongoDB
install_mongodb() {
    echo "📦 Installing MongoDB..."
    
    # Try different installation methods based on the system
    if command_exists apt-get; then
        # Ubuntu/Debian
        echo "Installing MongoDB on Ubuntu/Debian..."
        
        # Install gnupg if not available
        sudo apt-get update
        sudo apt-get install -y gnupg curl
        
        # Import MongoDB public GPG key
        curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
           sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
        
        # Create list file for MongoDB
        echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
           sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        
        # Update package database
        sudo apt-get update
        
        # Install MongoDB
        sudo apt-get install -y mongodb-org
        
    elif command_exists yum; then
        # CentOS/RHEL
        echo "Installing MongoDB on CentOS/RHEL..."
        
        # Create MongoDB repository file
        sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
        
        # Install MongoDB
        sudo yum install -y mongodb-org
        
    elif command_exists brew; then
        # macOS
        echo "Installing MongoDB on macOS..."
        brew tap mongodb/brew
        brew install mongodb-community
        
    else
        echo "❌ Could not detect package manager. Please install MongoDB manually."
        echo "📖 Visit: https://docs.mongodb.com/manual/installation/"
        return 1
    fi
}

# Function to start MongoDB
start_mongodb() {
    echo "🔄 Starting MongoDB..."
    
    # Create data directory if it doesn't exist
    sudo mkdir -p /data/db
    sudo chown -R $USER:$USER /data/db
    
    if command_exists systemctl; then
        # systemd
        sudo systemctl start mongod
        sudo systemctl enable mongod
        echo "✅ MongoDB started using systemctl"
    elif command_exists service; then
        # System V
        sudo service mongod start
        echo "✅ MongoDB started using service"
    elif command_exists brew; then
        # macOS
        brew services start mongodb/brew/mongodb-community
        echo "✅ MongoDB started using brew services"
    else
        # Manual start
        echo "🔧 Starting MongoDB manually..."
        mkdir -p /tmp/mongodb-data
        mongod --dbpath /tmp/mongodb-data --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongodb.log
        echo "✅ MongoDB started manually"
    fi
}

# Function to install Node.js dependencies
install_dependencies() {
    echo "📦 Installing Node.js dependencies..."
    npm install
}

# Function to start the application
start_application() {
    echo "🚀 Starting Student Dashboard application..."
    echo ""
    echo "🌐 Application will be available at: http://localhost:3000"
    echo "👤 Default admin login: admin@school.edu / admin123"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    npm start
}

# Main setup process
main() {
    echo "🔍 Checking system requirements..."
    
    # Check if Node.js is installed
    if ! command_exists node; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        echo "📖 Visit: https://nodejs.org/"
        exit 1
    fi
    
    echo "✅ Node.js found: $(node --version)"
    
    # Check if npm is installed
    if ! command_exists npm; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    echo "✅ npm found: $(npm --version)"
    
    # Install dependencies
    install_dependencies
    
    # Check if MongoDB is installed
    if ! command_exists mongod; then
        echo "⚠️  MongoDB is not installed."
        read -p "Would you like to install MongoDB? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_mongodb
        else
            echo "⚠️  Continuing without MongoDB. Database features will not work."
            echo "📖 To install MongoDB later, visit: https://docs.mongodb.com/manual/installation/"
        fi
    else
        echo "✅ MongoDB found"
    fi
    
    # Start MongoDB if it's installed
    if command_exists mongod; then
        # Check if MongoDB is already running
        if ! pgrep -x "mongod" > /dev/null; then
            start_mongodb
        else
            echo "✅ MongoDB is already running"
        fi
    fi
    
    # Start the application
    start_application
}

# Run main function
main