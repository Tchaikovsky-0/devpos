package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type SensorHandler struct {
	sensorService *service.SensorService
}

func NewSensorHandler(s *service.SensorService) *SensorHandler {
	return &SensorHandler{sensorService: s}
}

func (h *SensorHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	sensors, total, err := h.sensorService.List(
		tenantID,
		c.Query("type"),
		c.Query("status"),
		p,
	)
	if err != nil {
		response.InternalError(c, "failed to list sensors")
		return
	}

	pagination.PageOK(c, sensors, total, p)
}

func (h *SensorHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	sensor, err := h.sensorService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "sensor not found")
		return
	}

	response.Success(c, sensor)
}

func (h *SensorHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateSensorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	sensor, err := h.sensorService.Create(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create sensor")
		return
	}

	response.Created(c, sensor)
}

func (h *SensorHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateSensorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	sensor, err := h.sensorService.Update(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "sensor not found")
			return
		}
		response.InternalError(c, "failed to update sensor")
		return
	}

	response.Success(c, sensor)
}

func (h *SensorHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.sensorService.Delete(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "sensor not found")
			return
		}
		response.InternalError(c, "failed to delete sensor")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

func (h *SensorHandler) GetData(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	data, total, err := h.sensorService.GetSensorData(tenantID, id, p)
	if err != nil {
		response.InternalError(c, "failed to get sensor data")
		return
	}

	pagination.PageOK(c, data, total, p)
}
