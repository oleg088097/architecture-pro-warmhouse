FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/main.js"]


