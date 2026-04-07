package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"time"

	"xunjianbao-backend/internal/model"
)

// NotificationService dispatches alert notifications through multiple channels.
type NotificationService struct {
	httpClient *http.Client
}

// NewNotificationService creates a new NotificationService.
func NewNotificationService() *NotificationService {
	return &NotificationService{
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Dispatch routes a notification to the appropriate channel based on the action type.
func (s *NotificationService) Dispatch(action model.AlertRuleAction, alert *model.Alert) error {
	switch action.Type {
	case "email":
		subject := fmt.Sprintf("[%s] %s", alert.Level, alert.Title)
		return s.SendEmail(action.Target, subject, alert.Message)
	case "webhook":
		return s.SendWebhook(action.Target, alert)
	case "dingtalk":
		msg := s.formatMarkdown(alert)
		return s.SendDingTalk(action.Target, msg)
	case "wechat":
		msg := s.formatMarkdown(alert)
		return s.SendWeCom(action.Target, msg)
	default:
		return fmt.Errorf("unsupported notification type: %s", action.Type)
	}
}

// SendEmail sends an email notification via SMTP.
func (s *NotificationService) SendEmail(to, subject, body string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")

	if host == "" || port == "" {
		return fmt.Errorf("SMTP not configured (SMTP_HOST/SMTP_PORT required)")
	}

	addr := fmt.Sprintf("%s:%s", host, port)
	from := user
	if from == "" {
		from = "noreply@xunjianbao.com"
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body)

	var auth smtp.Auth
	if user != "" && password != "" {
		auth = smtp.PlainAuth("", user, password, host)
	}

	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
}

// SendWebhook sends an HTTP POST with the alert payload as JSON.
func (s *NotificationService) SendWebhook(url string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal webhook payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("create webhook request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}
	return nil
}

// SendDingTalk sends a markdown message to a DingTalk robot webhook.
func (s *NotificationService) SendDingTalk(webhookURL, message string) error {
	payload := map[string]interface{}{
		"msgtype": "markdown",
		"markdown": map[string]string{
			"title": "巡检宝告警通知",
			"text":  message,
		},
	}
	return s.SendWebhook(webhookURL, payload)
}

// SendWeCom sends a markdown message to a WeCom (企业微信) robot webhook.
func (s *NotificationService) SendWeCom(webhookURL, message string) error {
	payload := map[string]interface{}{
		"msgtype": "markdown",
		"markdown": map[string]string{
			"content": message,
		},
	}
	return s.SendWebhook(webhookURL, payload)
}

// formatMarkdown builds a markdown-formatted message for chat robot notifications.
func (s *NotificationService) formatMarkdown(alert *model.Alert) string {
	return fmt.Sprintf(
		"### 巡检宝告警通知\n\n"+
			"- **级别**: %s\n"+
			"- **类型**: %s\n"+
			"- **标题**: %s\n"+
			"- **详情**: %s\n"+
			"- **位置**: %s\n"+
			"- **时间**: %s\n",
		alert.Level,
		alert.Type,
		alert.Title,
		alert.Message,
		alert.Location,
		alert.CreatedAt.Format("2006-01-02 15:04:05"),
	)
}
