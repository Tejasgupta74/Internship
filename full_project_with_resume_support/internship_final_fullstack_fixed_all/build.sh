#!/bin/bash
set -e

echo "Building Internship Tracker..."

# Navigate to backend
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Install and build frontend
echo "Building frontend..."
npm run build

echo "Build completed successfully!"
