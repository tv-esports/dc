FROM node:16.11.0

# Set the working directory to /usr
WORKDIR /usr

# Copy package.json to the working directory
COPY package.json ./

# Copy tsconfig.json to the working directory
COPY tsconfig.json ./

# Copy owner.json to the working directory
COPY owner.json ./

# Copy the src directory to the working directory
COPY src ./src

# Copy the .env file to the working directory
COPY .env ./

# List all files and directories in the current directory
RUN ls -a

# Install the project dependencies
RUN npm install

#  Build project
RUN npm run build 

CMD ["npm", "run", "start"]
