FROM node:22-alpine

WORKDIR /app

# Copy entire project
COPY . .

# Build frontend first
WORKDIR /app/backend
RUN npm install

# Build frontend
RUN npm run build

# Start backend server
EXPOSE 5000
CMD ["npm", "start"]
