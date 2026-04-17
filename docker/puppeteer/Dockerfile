FROM node:20-alpine

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    zip

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files and install
COPY docker/puppeteer/package.json ./
RUN npm install --omit=dev

# Copy service source
COPY docker/puppeteer/index.js ./

# Create exports directory
RUN mkdir -p /data/exports

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pptruser -u 1001 -G nodejs && \
    chown -R pptruser:nodejs /app /data

USER pptruser

EXPOSE 4000

CMD ["node", "index.js"]