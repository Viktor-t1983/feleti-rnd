FROM node:20-alpine AS builder
WORKDIR /app

# Копируем всё из apps/web в корень /app
COPY apps/web/package*.json ./
COPY apps/web/index.html ./
COPY apps/web/vite.config.ts ./
COPY apps/web/tsconfig*.json ./
COPY apps/web/public ./public
COPY apps/web/src ./src

# Устанавливаем зависимости
RUN npm install --ignore-scripts

# Build переменные
ARG VITE_API_URL=
ARG VITE_CALC_ENGINE_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CALC_ENGINE_URL=$VITE_CALC_ENGINE_URL

# Сборка
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]