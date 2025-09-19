# Use official Node.js runtime as the base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and npm-lock.json (if exists) to the container
COPY package.json package-lock.json* ./

# Install dependencies using npm
RUN npm install --frozen-lockfile

# Copy only necessary files for production
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run the Next.js application
CMD ["npm", "next", "dev"]
