# Dev-mode container only (see infra/docker-compose.yml's `dev` profile) —
# there's no production Nginx/static-serving stage yet since this widget
# isn't embedded on the real portfolio site until Phase 3/4.
FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
