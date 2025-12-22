FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Next dev
ENV PORT=3019
EXPOSE 3019

CMD ["npm", "run", "dev", "--", "-p", "3019"]
