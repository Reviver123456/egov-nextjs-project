FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent
COPY . .
RUN npm run build
EXPOSE 3010
CMD ["npm", "start"]
