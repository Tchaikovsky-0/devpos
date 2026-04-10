# =============================================================================
# 多阶段构建: builder → runner
# =============================================================================

# Stage 1: Build
FROM golang:1.23-alpine AS builder

RUN apk --no-cache add ca-certificates tzdata git

# 设置Go代理 - 使用国内镜像
ENV GOPROXY=https://goproxy.cn,direct
ENV GO111MODULE=on

WORKDIR /build

COPY go.mod go.sum ./
COPY . ./

RUN sed -i '/^replace.*local_stubs/d' go.mod \
    && sed -i 's/gorm.io\/driver\/sqlite v.*//g' go.mod \
    && sed -i '/^$/N;/^\n$/d' go.mod \
    && go mod tidy \
    && go mod download

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server

# Stage 2: Minimal runtime
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /build/server .

RUN mkdir -p tmp uploads && chown appuser:appgroup tmp uploads

ENV STORAGE_PATH=/app/uploads

USER appuser

EXPOSE 8094

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD pidof server > /dev/null || exit 1

CMD ["./server"]
