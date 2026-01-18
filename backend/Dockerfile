
# Base image
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache openssl

# Working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Remove devDependencies to keep image small
RUN npm prune --production

# Expose port
EXPOSE 3001

# Environment variables (Documenting, to be set in execution)
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/prod.db"

# Startup command (using built files)
CMD ["npm", "start"]
