# Stage 1: Build the client
FROM node:20 AS client-builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .
COPY astro.config.mjs ./
# Build the client
RUN npm run build

# Stage 2: Setup the server
FROM node:20 AS server

# Set the working directory
WORKDIR /server

# Copy server package.json and package-lock.json
COPY server/package.json server/package-lock.json ./

# Install server dependencies
RUN npm install

# Copy the server code
COPY server/ .

# Stage 3: Final stage to combine client and server
FROM node:20

# Set the working directory
WORKDIR /app

# Copy the built client from the client-builder stage
COPY --from=client-builder /app/dist ./dist

# Copy the server from the server stage
COPY --from=server /server ./server
COPY astro.config.mjs ./

# Install dependencies for the final stage
COPY package.json package-lock.json ./
RUN npm install

# Expose the server port for the front-end
EXPOSE 4321

# Expose the server port for the back-end
EXPOSE 8080

# Start both the front-end and back-end servers
CMD ["sh", "-c", "npm run preview --host & node server/server.js"]
