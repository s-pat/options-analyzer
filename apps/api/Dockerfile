# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Download dependencies first (cached layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build a static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -trimpath -o server ./cmd/server

# ── Stage 2: run ────────────────────────────────────────────────────────────
FROM alpine:3.19

# ca-certificates required for HTTPS calls to Yahoo Finance
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/server .

# Document ports (HTTP and gRPC)
EXPOSE 8080 9090

CMD ["./server"]
