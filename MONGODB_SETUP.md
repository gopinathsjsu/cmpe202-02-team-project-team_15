# MongoDB Setup Guide

## 🚀 Quick Solutions

### **Option 1: MongoDB Atlas (Cloud - Recommended)**

1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Create a free account**
3. **Create a new cluster** (choose the free tier)
4. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
5. **Update your environment**:
   - Create `server/.env` file
   - Add: `MONGODB_URI=your_connection_string_here`

### **Option 2: Install MongoDB Locally (Windows)**

1. **Download MongoDB Community Server**:
   - Go to: https://www.mongodb.com/try/download/community
   - Select Windows and download the MSI installer

2. **Install MongoDB**:
   - Run the installer
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service

3. **Start MongoDB**:
   ```bash
   # Start MongoDB service
   net start MongoDB
   
   # Or start manually
   mongod
   ```

4. **Create environment file**:
   - Create `server/.env` file
   - Add: `MONGODB_URI=mongodb://127.0.0.1:27017/campus-market`

### **Option 3: Use Docker (If installed)**

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Create environment file
# Create server/.env with: MONGODB_URI=mongodb://127.0.0.1:27017/campus-market
```

## 🔧 Environment File Setup

Create a file called `server/.env` with the following content:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/campus-market

# JWT Configuration
JWT_SECRET=campus_market_jwt_secret_key_2024_development_only

# Client Configuration
CLIENT_URL=http://localhost:3000
```

## 🎯 Current Status

Your server is already configured to run without MongoDB for development purposes. The database connection error is expected and won't prevent the server from running.

## 🚀 Test Your Application

1. **Start the servers**:
   ```bash
   # Backend (Terminal 1)
   cd server
   npm run dev
   
   # Client (Terminal 2)
   cd client
   npm run dev
   ```

2. **Access the application**:
   - Client: http://localhost:3000
   - Backend API: http://localhost:5000/health

## 📝 Notes

- The server will continue running even without MongoDB
- You can test the client UI without database functionality
- For full functionality, you'll need to set up MongoDB using one of the options above
- MongoDB Atlas is the easiest option for development
