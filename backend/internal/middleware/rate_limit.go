package middleware

import (
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// rateBucket 令牌桶
type rateBucket struct {
	tokens     float64
	maxTokens  float64
	refillRate float64 // tokens per second
	lastRefill time.Time
	mu         sync.Mutex
}

func newBucket(maxTokens float64, refillPerMinute float64) *rateBucket {
	return &rateBucket{
		tokens:     maxTokens,
		maxTokens:  maxTokens,
		refillRate: refillPerMinute / 60.0,
		lastRefill: time.Now(),
	}
}

func (b *rateBucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * b.refillRate
	if b.tokens > b.maxTokens {
		b.tokens = b.maxTokens
	}
	b.lastRefill = now

	if b.tokens >= 1 {
		b.tokens--
		return true
	}
	return false
}

// rateLimiterStore 基于 IP 的限流存储
type rateLimiterStore struct {
	buckets sync.Map
	max     float64
	rate    float64
}

func newRateLimiterStore(maxTokens, refillPerMinute float64) *rateLimiterStore {
	store := &rateLimiterStore{
		max:  maxTokens,
		rate: refillPerMinute,
	}
	// 定期清理过期的桶（每 5 分钟）
	go store.cleanup()
	return store
}

func (s *rateLimiterStore) getBucket(ip string) *rateBucket {
	if b, ok := s.buckets.Load(ip); ok {
		return b.(*rateBucket)
	}
	b := newBucket(s.max, s.rate)
	actual, _ := s.buckets.LoadOrStore(ip, b)
	return actual.(*rateBucket)
}

func (s *rateLimiterStore) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		s.buckets.Range(func(key, value interface{}) bool {
			b := value.(*rateBucket)
			b.mu.Lock()
			// 如果超过 10 分钟没有使用，清除桶
			if time.Since(b.lastRefill) > 10*time.Minute {
				s.buckets.Delete(key)
			}
			b.mu.Unlock()
			return true
		})
	}
}

// RateLimit 通用限流中间件
// maxPerMinute: 每分钟最大请求数
func RateLimit(maxPerMinute float64) gin.HandlerFunc {
	store := newRateLimiterStore(maxPerMinute, maxPerMinute)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		bucket := store.getBucket(ip)
		if !bucket.allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    429,
					"message": "too many requests, please try again later",
				},
			})
			return
		}
		c.Next()
	}
}

// LoginRateLimit 登录专用限流（默认每IP每分钟10次）
func LoginRateLimit() gin.HandlerFunc {
	limit := getEnvFloat("RATE_LIMIT_LOGIN", 10)
	return RateLimit(limit)
}

// APIRateLimit 通用API限流（默认每IP每分钟120次）
func APIRateLimit() gin.HandlerFunc {
	limit := getEnvFloat("RATE_LIMIT_API", 120)
	return RateLimit(limit)
}

func getEnvFloat(key string, defaultVal float64) float64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseFloat(v, 64); err == nil {
			return n
		}
	}
	return defaultVal
}
