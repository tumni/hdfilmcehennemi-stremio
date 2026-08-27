FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy all source files
COPY . .

# Remove dev/deploy-only files
RUN rm -f upload.js vps.js setup.sh https.sh test.js download.js

# Expose port
EXPOSE 7000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -O- http://localhost:7000/manifest.json || exit 1

CMD ["node", "addon.js"]
