# Build stage for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Backend stage
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --production

# Copy backend files
COPY backend/ ./backend/

# Copy built frontend from build stage
COPY --from=frontend-build /app/dist ./public

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Start backend server
CMD ["node", "backend/server.js"]
