FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci --omit=dev


# FROM gcr.io/distroless/nodejs22-debian12 AS runner
# WORKDIR /usr/src/app
# COPY --from=builder /app .
COPY . .
EXPOSE 8000
CMD ["node", "index.js"]