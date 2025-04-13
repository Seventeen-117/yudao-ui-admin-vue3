# Stage 1: Build the application
FROM node:16-alpine as build-stage

# Install pnpm
RUN npm install -g pnpm@8.6.0

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build:prod

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine as production-stage

# Copy the built app to nginx html directory
COPY --from=build-stage /app/dist-prod /usr/share/nginx/html

# Copy nginx configuration template
COPY build/nginx.conf /etc/nginx/templates/default.conf.template

# Set default environment variable for API URL
ENV API_URL=http://localhost:48080

# Expose port 80
EXPOSE 80

# Use entrypoint script to replace environment variables
RUN echo '#!/bin/sh\nenvsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf\nexec "$@"' > /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh

# Start nginx with environment variable substitution
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 