#!/usr/bin/env python3
import json

config_path = "/root/.lightclaw/lightclaw.json"

with open(config_path, "r") as f:
    config = json.load(f)

config["models"]["providers"]["moonshot"] = {
    "baseUrl": "https://api.moonshot.cn/v1",
    "apiKey": "sk-kimi-PIZXQz9nNpnYRBl7a0nwT9dmeQ5WiM64w4FJtRTmdTAubgqHc0aWRUlro0lqQwBm",
    "extraModels": [],
    "chatModel": "",
    "isCustom": False,
    "models": [
        {
            "id": "moonshot-v1-8k",
            "name": "Kimi v1 8K",
            "enabled": True,
            "contextWindow": 8192,
            "maxTokens": 4096,
            "reasoning": False,
            "input": ["text"],
            "cost": {"input": 0.012, "output": 0.012, "cacheRead": 0, "cacheWrite": 0}
        },
        {
            "id": "moonshot-v1-32k",
            "name": "Kimi v1 32K",
            "enabled": True,
            "contextWindow": 32768,
            "maxTokens": 8192,
            "reasoning": False,
            "input": ["text"],
            "cost": {"input": 0.024, "output": 0.024, "cacheRead": 0, "cacheWrite": 0}
        },
        {
            "id": "moonshot-v1-128k",
            "name": "Kimi v1 128K",
            "enabled": True,
            "contextWindow": 131072,
            "maxTokens": 16384,
            "reasoning": False,
            "input": ["text"],
            "cost": {"input": 0.06, "output": 0.06, "cacheRead": 0, "cacheWrite": 0}
        }
    ]
}

config["models"]["activeLlm"] = "moonshot-v1-8k"

with open(config_path, "w") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("Kimi configured. Active LLM:", config["models"]["activeLlm"])
