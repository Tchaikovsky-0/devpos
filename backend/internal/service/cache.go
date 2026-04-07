package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"xunjianbao-backend/pkg/redis"
)

// Cache TTL constants
const (
	TTLDashboardStats      = 60 * time.Second  // 1 minute
	TTLTenantConfig       = 5 * time.Minute   // 5 minutes
	TTLMediaStorage       = 2 * time.Minute   // 2 minutes
	TTLMissionStatistics  = 30 * time.Second   // 30 seconds
)

type CacheService struct {
	client *redis.Client
}

func NewCacheService() *CacheService {
	return &CacheService{client: redis.Get()}
}

// =============================================================================
// Key helpers
// =============================================================================

func (s *CacheService) dashboardKey(tenantID string) string {
	return fmt.Sprintf("tenant:%s:dashboard:stats", tenantID)
}

func (s *CacheService) tenantConfigKey(tenantID string) string {
	return fmt.Sprintf("tenant:%s:config", tenantID)
}

func (s *CacheService) mediaStorageKey(tenantID string) string {
	return fmt.Sprintf("tenant:%s:media:storage", tenantID)
}

func (s *CacheService) missionStatsKey(tenantID string) string {
	return fmt.Sprintf("tenant:%s:openclaw:mission:stats", tenantID)
}

func (s *CacheService) tenantPattern(tenantID string) string {
	return fmt.Sprintf("tenant:%s:*", tenantID)
}

// =============================================================================
// Generic cache operations
// =============================================================================

// GetJSON retrieves a cached value and unmarshals it into v.
// Returns (found, error).
func (s *CacheService) GetJSON(ctx context.Context, key string, v interface{}) (bool, error) {
	if s.client == nil || !s.client.IsEnabled() {
		return false, nil
	}
	data, err := s.client.Get(ctx, key)
	if err != nil {
		return false, nil
	}
	if err := json.Unmarshal(data, v); err != nil {
		return false, err
	}
	return true, nil
}

// SetJSON marshals v as JSON and stores it with the given TTL.
func (s *CacheService) SetJSON(ctx context.Context, key string, v interface{}, ttl time.Duration) error {
	if s.client == nil || !s.client.IsEnabled() {
		return nil
	}
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return s.client.Set(ctx, key, data, ttl)
}

// InvalidateTenant removes all cache entries for a tenant.
func (s *CacheService) InvalidateTenant(ctx context.Context, tenantID string) error {
	if s.client == nil || !s.client.IsEnabled() {
		return nil
	}
	return s.client.DeletePattern(ctx, s.tenantPattern(tenantID))
}

// =============================================================================
// Domain-specific cache methods
// =============================================================================

// GetDashboardStats retrieves cached dashboard stats for a tenant.
func (s *CacheService) GetDashboardStats(ctx context.Context, tenantID string) (map[string]interface{}, bool, error) {
	var stats map[string]interface{}
	found, err := s.GetJSON(ctx, s.dashboardKey(tenantID), &stats)
	return stats, found, err
}

// SetDashboardStats caches dashboard stats for a tenant.
func (s *CacheService) SetDashboardStats(ctx context.Context, tenantID string, stats map[string]interface{}) error {
	return s.SetJSON(ctx, s.dashboardKey(tenantID), stats, TTLDashboardStats)
}

// GetTenantConfig retrieves cached tenant config.
func (s *CacheService) GetTenantConfig(ctx context.Context, tenantID string) (map[string]interface{}, bool, error) {
	var cfg map[string]interface{}
	found, err := s.GetJSON(ctx, s.tenantConfigKey(tenantID), &cfg)
	return cfg, found, err
}

// SetTenantConfig caches tenant config.
func (s *CacheService) SetTenantConfig(ctx context.Context, tenantID string, cfg map[string]interface{}) error {
	return s.SetJSON(ctx, s.tenantConfigKey(tenantID), cfg, TTLTenantConfig)
}

// SetTenantConfigFull marshals the full TenantConfig struct as JSON and caches it.
func (s *CacheService) SetTenantConfigFull(ctx context.Context, tenantID string, cfg interface{}) error {
	return s.SetJSON(ctx, s.tenantConfigKey(tenantID), cfg, TTLTenantConfig)
}

// GetMediaStorage retrieves cached media storage info.
func (s *CacheService) GetMediaStorage(ctx context.Context, tenantID string) (map[string]interface{}, bool, error) {
	var info map[string]interface{}
	found, err := s.GetJSON(ctx, s.mediaStorageKey(tenantID), &info)
	return info, found, err
}

// SetMediaStorage caches media storage info.
func (s *CacheService) SetMediaStorage(ctx context.Context, tenantID string, info map[string]interface{}) error {
	return s.SetJSON(ctx, s.mediaStorageKey(tenantID), info, TTLMediaStorage)
}

// GetMissionStatistics retrieves cached mission statistics.
func (s *CacheService) GetMissionStatistics(ctx context.Context, tenantID string) (map[string]interface{}, bool, error) {
	var stats map[string]interface{}
	found, err := s.GetJSON(ctx, s.missionStatsKey(tenantID), &stats)
	return stats, found, err
}

// SetMissionStatistics caches mission statistics.
func (s *CacheService) SetMissionStatistics(ctx context.Context, tenantID string, stats map[string]interface{}) error {
	return s.SetJSON(ctx, s.missionStatsKey(tenantID), stats, TTLMissionStatistics)
}
