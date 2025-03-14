# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --ignore-scripts

# Copy app source
COPY . .

# Build the project
RUN npm run build

EXPOSE 3000

# Start the MCP server
CMD [ "node", "./build/index.js" ]
