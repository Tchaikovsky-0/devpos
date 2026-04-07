package redis

import (
	"context"
	"log"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb     *redis.Client
	enabled bool
	mu      sync.RWMutex
}

var defaultClient *Client
var initOnce sync.Once

// Init initializes the global Redis client.
// If Redis is unavailable, it logs a warning and continues with caching disabled.
func Init(redisURL string) *Client {
	initOnce.Do(func() {
		defaultClient = newClient(redisURL)
	})
	return defaultClient
}

// Get returns the global Redis client.
func Get() *Client {
	return defaultClient
}

func newClient(redisURL string) *Client {
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	parsed, err := url.Parse(redisURL)
	if err != nil {
		log.Printf("[cache] invalid Redis URL %s: %v, caching disabled", redisURL, err)
		return &Client{enabled: false}
	}

	host := parsed.Host
	if host == "" {
		host = "localhost:6379"
	}

	var password string
	if parsed.User != nil {
		password, _ = parsed.User.Password()
	}

	db := 0
	if parsed.Path != "" && parsed.Path != "/" {
		dbName := strings.TrimPrefix(parsed.Path, "/")
		if n, _ := parseRedisDB(dbName); n >= 0 {
			db = n
		}
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:         host,
		Password:     password,
		DB:           db,
		DialTimeout:  3 * time.Second,
		ReadTimeout:  2 * time.Second,
		WriteTimeout:  2 * time.Second,
		PoolSize:     10,
		MinIdleConns: 2,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("[cache] Redis unavailable at %s: %v, caching disabled", host, err)
		rdb.Close()
		return &Client{enabled: false}
	}

	log.Printf("[cache] Redis connected at %s (db=%d)", host, db)
	return &Client{
		rdb:     rdb,
		enabled: true,
	}
}

// IsEnabled returns true if Redis is connected and caching is active.
func (c *Client) IsEnabled() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.enabled
}

// Get retrieves a cached value. Returns nil if caching is disabled or key not found.
func (c *Client) Get(ctx context.Context, key string) ([]byte, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.enabled || c.rdb == nil {
		return nil, redis.Nil
	}
	return c.rdb.Get(ctx, key).Bytes()
}

// Set stores a value with the given TTL. No-op if caching is disabled.
func (c *Client) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.enabled || c.rdb == nil {
		return nil
	}
	return c.rdb.Set(ctx, key, value, ttl).Err()
}

// Delete removes a key. No-op if caching is disabled.
func (c *Client) Delete(ctx context.Context, keys ...string) error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.enabled || c.rdb == nil {
		return nil
	}
	return c.rdb.Del(ctx, keys...).Err()
}

// DeletePattern removes all keys matching the pattern. No-op if caching is disabled.
func (c *Client) DeletePattern(ctx context.Context, pattern string) error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.enabled || c.rdb == nil {
		return nil
	}
	iter := c.rdb.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := c.rdb.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}

// Close closes the Redis connection.
func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.rdb != nil {
		c.enabled = false
		return c.rdb.Close()
	}
	return nil
}

func parseRedisDB(s string) (int, error) {
	var n int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		} else {
			return -1, nil
		}
	}
	return n, nil
}
