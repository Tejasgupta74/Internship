FROM node:22-alpine

WORKDIR /app

# Copy entire project
COPY . .

# Install and build
RUN cd backend && npm install && npm run build

EXPOSE 5000

# Start backend server
CMD ["node", "backend/server.js"]
