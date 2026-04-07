# =============================================================================
# 多阶段构建: builder → runner
# =============================================================================

# Stage 1: Build
FROM golang:1.23-alpine AS builder

RUN apk --no-cache add ca-certificates tzdata git

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server

# Stage 2: Minimal runtime
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /build/server .

# 非 root 用户运行
USER appuser

EXPOSE 8094

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:8094/health || exit 1

CMD ["./server"]
