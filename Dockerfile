# Step 1: Base image (Updated to Node 20)
FROM node:20-alpine AS base

# Step 2: Set working directory
WORKDIR /app

# Step 3: Install dependencies
COPY package*.json ./
RUN npm ci

# Step 4: Copy application source code
COPY . .

# Step 5: Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Step 6: Expose port & start application
EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]