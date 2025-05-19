# Use Node.js 18 base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Make yt-dlp and ffmpeg executable
RUN chmod +x yt-dlp ffmpeg

# Expose app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
