
# Base image
FROM node:18-alpine

# Working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production
RUN npm install typescript tsx -g

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build (if necessary, though we use tsx in dev, for prod usually tsc is better, but let's stick to tsx for simplicity or build)
# Let's build to JS for better performance
RUN npm run build

# Expose port
EXPOSE 3001

# Environment variables (Documenting, to be set in execution)
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:./prod.db"

# Startup command (using built files)
CMD ["npm", "start"]
