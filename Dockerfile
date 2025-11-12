# ---- build stage ----
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

# --- inject build args ke environment ---
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PYTHON_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_PYTHON_API_URL=${NEXT_PUBLIC_PYTHON_API_URL}

COPY . .
RUN npm run build

# ---- production stage ----
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./
EXPOSE 3000

CMD ["npm", "run", "start"]
