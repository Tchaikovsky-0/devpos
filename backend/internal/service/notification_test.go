package service

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"xunjianbao-backend/internal/model"
)

// ---------- SendWebhook ----------

func TestSendWebhook_Success(t *testing.T) {
	var receivedBody map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("expected Content-Type application/json, got %s", r.Header.Get("Content-Type"))
		}
		json.NewDecoder(r.Body).Decode(&receivedBody)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	svc := NewNotificationService()

	payload := map[string]string{"title": "Test Alert", "level": "CRIT"}
	err := svc.SendWebhook(server.URL, payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if receivedBody["title"] != "Test Alert" {
		t.Errorf("expected title 'Test Alert', got %v", receivedBody["title"])
	}
}

func TestSendWebhook_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	svc := NewNotificationService()
	err := svc.SendWebhook(server.URL, map[string]string{"test": "data"})
	if err == nil {
		t.Fatal("expected error for 500 response, got nil")
	}
}

func TestSendWebhook_InvalidURL(t *testing.T) {
	svc := NewNotificationService()
	err := svc.SendWebhook("http://localhost:1/nonexistent", "payload")
	if err == nil {
		t.Fatal("expected error for unreachable URL, got nil")
	}
}

// ---------- Dispatch ----------

func TestDispatch_Webhook(t *testing.T) {
	var received bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received = true
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	svc := NewNotificationService()

	action := model.AlertRuleAction{
		Type:   "webhook",
		Target: server.URL,
	}
	alert := &model.Alert{
		Level:   "CRIT",
		Type:    "fire",
		Title:   "Fire Detected",
		Message: "Smoke in building A",
	}

	err := svc.Dispatch(action, alert)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !received {
		t.Error("webhook endpoint was not called")
	}
}

func TestDispatch_DingTalk(t *testing.T) {
	var receivedBody map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewDecoder(r.Body).Decode(&receivedBody)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	svc := NewNotificationService()

	action := model.AlertRuleAction{
		Type:   "dingtalk",
		Target: server.URL,
	}
	alert := &model.Alert{
		Level:   "WARN",
		Type:    "intrusion",
		Title:   "Intrusion Detected",
		Message: "Unauthorized person",
	}

	err := svc.Dispatch(action, alert)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if receivedBody["msgtype"] != "markdown" {
		t.Errorf("expected msgtype 'markdown', got %v", receivedBody["msgtype"])
	}
}

func TestDispatch_UnsupportedType(t *testing.T) {
	svc := NewNotificationService()

	action := model.AlertRuleAction{
		Type:   "sms",
		Target: "13800138000",
	}
	alert := &model.Alert{
		Level: "INFO",
		Title: "Test",
	}

	err := svc.Dispatch(action, alert)
	if err == nil {
		t.Fatal("expected error for unsupported notification type, got nil")
	}
}
