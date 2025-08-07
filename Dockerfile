# 프론트
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY job-FE/package*.json ./
RUN npm install

COPY job-FE .

RUN npm run build

# 백앤드
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY job-BE/package*.json ./
RUN npm install

COPY job-BE .

FROM node:20-alpine

WORKDIR /app

COPY --from=backend-builder /app/backend /app

COPY --from=frontend-builder /app/frontend/dist /app/public

EXPOSE 5000

CMD ["npm", "start"]




