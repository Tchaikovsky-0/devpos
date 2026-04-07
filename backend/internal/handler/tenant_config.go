package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type TenantConfigHandler struct {
	configService *service.TenantConfigService
}

func NewTenantConfigHandler(s *service.TenantConfigService) *TenantConfigHandler {
	return &TenantConfigHandler{configService: s}
}

func (h *TenantConfigHandler) Get(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	config, err := h.configService.Get(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get config")
		return
	}

	response.Success(c, config)
}

func (h *TenantConfigHandler) Update(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.UpdateConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	config, err := h.configService.Update(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to update config")
		return
	}

	response.Success(c, config)
}

func (h *TenantConfigHandler) GetStorage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.configService.GetStorage(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get storage info")
		return
	}

	response.Success(c, info)
}

func (h *TenantConfigHandler) GetDevices(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.configService.GetDevices(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get device info")
		return
	}

	response.Success(c, info)
}

func (h *TenantConfigHandler) GetUsageStatistics(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	period := c.DefaultQuery("period", "month")

	usage, err := h.configService.GetUsageStatistics(tenantID, period)
	if err != nil {
		response.InternalError(c, "failed to get usage statistics")
		return
	}

	response.Success(c, usage)
}

func (h *TenantConfigHandler) GetFeatures(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	features, err := h.configService.GetFeatures(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get features")
		return
	}

	response.Success(c, features)
}

func (h *TenantConfigHandler) UpdateFeatures(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.UpdateFeaturesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	features, err := h.configService.UpdateFeatures(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to update features")
		return
	}

	response.Success(c, features)
}
