FROM node:20-alpine AS build
WORKDIR /app
COPY package.json /app/package.json
COPY tsconfig.json /app/tsconfig.json
COPY vite.config.ts /app/vite.config.ts
COPY index.html /app/index.html
COPY assets /app/assets
COPY src /app/src
RUN npm install
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
