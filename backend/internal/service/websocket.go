package service

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocketMessage 是所有 WebSocket 消息的统一格式
type WebSocketMessage struct {
	Type      string      `json:"type"` // alert, yolo-detection, stream-status, task-update, ping, pong
	Payload   interface{} `json:"payload"`
	Timestamp string      `json:"timestamp"`
}

// WebSocketClient 表示一个已连接的 WebSocket 客户端
type WebSocketClient struct {
	ID       string
	TenantID string
	UserID   string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *WebSocketHub
}

// WebSocketHub 管理所有 WebSocket 客户端连接和消息广播
type WebSocketHub struct {
	clients    map[*WebSocketClient]bool
	broadcast  chan []byte
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	mu         sync.RWMutex
}

// NewWebSocketHub 创建新的 WebSocket Hub
func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{
		clients:    make(map[*WebSocketClient]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *WebSocketClient),
		unregister: make(chan *WebSocketClient),
	}
}

// Run 启动 Hub 的事件循环
func (h *WebSocketHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("[WS] Client connected: %s (tenant: %s, user: %s), total: %d",
				client.ID, client.TenantID, client.UserID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("[WS] Client disconnected: %s, total: %d", client.ID, len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					// 发送缓冲区满，断开客户端
					h.mu.RUnlock()
					h.mu.Lock()
					delete(h.clients, client)
					close(client.Send)
					h.mu.Unlock()
					h.mu.RLock()
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register queues a client connection to be added to the hub.
func (h *WebSocketHub) Register(client *WebSocketClient) {
	h.register <- client
}

// Unregister queues a client connection to be removed from the hub.
func (h *WebSocketHub) Unregister(client *WebSocketClient) {
	h.unregister <- client
}

// BroadcastToAll 向所有客户端广播消息
func (h *WebSocketHub) BroadcastToAll(msgType string, payload interface{}) {
	msg := WebSocketMessage{
		Type:      msgType,
		Payload:   payload,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WS] Failed to marshal broadcast message: %v", err)
		return
	}
	h.broadcast <- data
}

// BroadcastToTenant 向指定租户的客户端广播消息
func (h *WebSocketHub) BroadcastToTenant(tenantID string, msgType string, payload interface{}) {
	msg := WebSocketMessage{
		Type:      msgType,
		Payload:   payload,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WS] Failed to marshal tenant message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.TenantID == tenantID {
			select {
			case client.Send <- data:
			default:
				// 缓冲区满，跳过
			}
		}
	}
}

// GetClientCount 获取当前连接数
func (h *WebSocketHub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// WritePump 将消息从 hub 发送到 WebSocket 连接
func (c *WebSocketClient) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Send
		if !ok {
			// Hub 关闭了通道
			c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}

// ReadPump 从 WebSocket 连接读取消息并发送到 hub
func (c *WebSocketClient) ReadPump() {
	defer func() {
		c.Hub.Unregister(c)
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] Unexpected close for client %s: %v", c.ID, err)
			}
			return
		}

		// 解析客户端消息
		var msg WebSocketMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		// 处理 ping
		if msg.Type == "ping" {
			pong := WebSocketMessage{
				Type:      "pong",
				Payload:   nil,
				Timestamp: time.Now().Format(time.RFC3339),
			}
			data, _ := json.Marshal(pong)
			c.Conn.WriteMessage(websocket.TextMessage, data)
		}
	}
}
