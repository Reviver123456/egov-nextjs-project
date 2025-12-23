FROM node:18-alpine

WORKDIR /app

# Disable Next.js telemetry in CI/containers
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3019
CMD ["npm","start"]
