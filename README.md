# Cursor API Proxy

将 Cursor IDE 的 AI API（Protobuf/Connect-RPC）转换为 **OpenAI** 和 **Anthropic** 兼容格式的反向代理服务。支持直接接入 **Claude Code**。

Convert Cursor IDE AI API (Protobuf/Connect-RPC) to OpenAI & Anthropic compatible format. Works with **Claude Code** out of the box.

## Features

- **双协议兼容**：同时支持 OpenAI (`/v1/chat/completions`) 和 Anthropic (`/v1/messages`) 格式
- **Claude Code 直连**：通过 `ANTHROPIC_BASE_URL` 直接接入 Claude Code CLI
- **自定义 API Key**：设置简短的 `AUTH_TOKEN`，无需每次传递长 JWT
- 支持流式（SSE）和非流式响应
- 支持 74+ 模型，包括 Claude 4.6、GPT-5.x、Gemini 3.x 等
- 支持 thinking 模式（思维链）
- 可与任何 OpenAI/Anthropic 兼容客户端集成（Claude Code、ChatBox、Open WebUI 等）

## Quick Start

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 `.env`

```env
PORT=3010

# 自定义 API Key（简短好记，替代长 JWT）
AUTH_TOKEN=sk-cursor-proxy

# Cursor Cookie（JWT Token，通过抓包或 npm run login 获取）
CURSOR_COOKIE=eyJhbGciOiJIUzI1NiIs...

# HTTP 代理（可选）
# PROXY_URL=http://127.0.0.1:7890
```

### 3. 启动服务

```bash
npm run start
```

服务运行在 `http://localhost:3010`

## 接入 Claude Code

```bash
ANTHROPIC_BASE_URL=http://localhost:3010 ANTHROPIC_API_KEY=sk-cursor-proxy claude
```

PowerShell：

```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:3010"
$env:ANTHROPIC_API_KEY="sk-cursor-proxy"
claude
```

## 获取 Cursor Cookie

### 方式一：通过登录获取

```bash
npm run login
```

按照提示在浏览器中登录，命令行会显示 Cookie 值。

### 方式二：通过抓包获取

使用 Fiddler 等抓包工具，捕获 Cursor IDE 的 HTTPS 请求，从请求头中提取 `Authorization: Bearer <token>` 中的 JWT Token。

### 方式三：通过 API 获取

```python
import requests

WorkosCursorSessionToken = "your_session_token"  # 从浏览器 Cookie 获取
response = requests.get("http://localhost:3010/cursor/loginDeepControl", headers={
    "authorization": f"Bearer {WorkosCursorSessionToken}"
})
cookie = response.json()["accessToken"]
```

## API 使用

### Anthropic 格式（/v1/messages）

```bash
curl http://localhost:3010/v1/messages \
  -H "x-api-key: sk-cursor-proxy" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### OpenAI 格式（/v1/chat/completions）

```bash
curl http://localhost:3010/v1/chat/completions \
  -H "Authorization: Bearer sk-cursor-proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-4.6-sonnet-medium",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### Python 示例

```python
# Anthropic SDK
from anthropic import Anthropic
client = Anthropic(api_key="sk-cursor-proxy", base_url="http://localhost:3010")
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.content[0].text)

# OpenAI SDK
from openai import OpenAI
client = OpenAI(api_key="sk-cursor-proxy", base_url="http://localhost:3010/v1")
response = client.chat.completions.create(
    model="claude-4.6-sonnet-medium",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)
for chunk in response:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
```

### 可用模型（部分）

| Anthropic 名称 | Cursor 模型 | 说明 |
|---|---|---|
| `claude-opus-4-6` | `claude-4.6-opus-high` | Claude 4.6 Opus |
| `claude-sonnet-4-6` | `claude-4.6-sonnet-medium` | Claude 4.6 Sonnet |
| `claude-haiku-4-5` | `claude-4.5-haiku` | Claude 4.5 Haiku |
| - | `claude-4.6-opus-max-thinking` | Opus 思维链 |
| - | `gpt-5.2` | GPT-5.2 |
| - | `gpt-5-mini` | GPT-5 Mini |
| - | `gemini-3.1-pro` | Gemini 3.1 Pro |
| - | `default` | 默认模型 |

完整列表（74+ 模型）通过 `/v1/models` 接口获取。

## Docker 部署

```bash
docker run -d --name cursor-api-proxy -p 3010:3010 \
  -e AUTH_TOKEN=sk-cursor-proxy \
  -e CURSOR_COOKIE=eyJhbGciOiJIUzI1NiIs... \
  ghcr.io/jiuz-chn/cursor-to-openai:latest
```

## 注意事项

- 请妥善保管 Cursor Cookie，不要泄露给他人
- JWT Token 有效期约 60 天，过期后更新 `.env` 中的 `CURSOR_COOKIE`
- `x-cursor-client-version` 需要与 Cursor IDE 版本一致（当前为 2.5.25）
- 本项目仅供学习研究使用，请遵守 Cursor 使用条款

## 相关修改

基于 [Cursor-To-OpenAI](https://github.com/JiuZ-Chn/Cursor-To-OpenAI) 的主要改动：

- 新增 Anthropic Messages API 兼容端点（`/v1/messages`），支持 Claude Code 直连
- 新增 `AUTH_TOKEN` / `CURSOR_COOKIE` 环境变量，支持自定义 API Key
- 更新 `x-cursor-client-version` 至 `2.5.25`（旧版本被 Cursor API 拒绝）
- 设置 `x-ghost-mode` 为 `false`（适配团队订阅）

## Acknowledgements

- Based on [Cursor-To-OpenAI](https://github.com/JiuZ-Chn/Cursor-To-OpenAI) by JiuZ-Chn
- Originally based on [cursor-api](https://github.com/zhx47/cursor-api) by zhx47
- Integrates commits from [cursor-api](https://github.com/lvguanjun/cursor-api) by lvguanjun
