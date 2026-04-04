package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"xunjianbao-backend/internal/service"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 开发环境允许所有来源，生产环境需要限制
	},
}

type WebSocketHandler struct {
	hub *service.WebSocketHub
}

func NewWebSocketHandler(hub *service.WebSocketHub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

// HandleWebSocket 处理 WebSocket 连接升级
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// 从上下文中获取用户信息（由 AuthMiddleware 设置）
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")
	if tenantID == "" {
		tenantID = "anonymous"
	}
	if userID == "" {
		userID = "anonymous"
	}

	// 升级 HTTP 连接为 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WS] Upgrade failed: %v", err)
		return
	}

	// 创建客户端
	client := &service.WebSocketClient{
		ID:       generateClientID(),
		TenantID: tenantID,
		UserID:   userID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Hub:      h.hub,
	}

	// 注册客户端
	h.hub.Register(client)

	// 启动读写协程
	go client.WritePump()
	go client.ReadPump()
}

// generateClientID 生成客户端 ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[i%len(letters)]
	}
	return string(b)
}

// Register 方法导出，供外部注册客户端
// Hub 的 Register 方法通过 channel 进行
func (h *WebSocketHandler) GetHub() *service.WebSocketHub {
	return h.hub
}
