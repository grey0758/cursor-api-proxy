# Cursor API Proxy

将 Cursor IDE 的 AI API（Protobuf/Connect-RPC）转换为 OpenAI 兼容格式的反向代理服务。

Convert Cursor IDE AI API (Protobuf/Connect-RPC) to OpenAI-compatible format.

## Features

- OpenAI 兼容的 `/v1/chat/completions` 和 `/v1/models` 接口
- 支持流式（SSE）和非流式响应
- 支持 74+ 模型，包括 Claude 4.6、GPT-5.x、Gemini 3.x 等
- 支持 thinking 模式（思维链）
- 可与任何 OpenAI 兼容客户端集成（ChatBox、Open WebUI、ChatGPT-Next-Web 等）

## Quick Start

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm run start
```

服务运行在 `http://localhost:3010`

### Docker 部署

```bash
docker run -d --name cursor-api-proxy -p 3010:3010 ghcr.io/jiuz-chn/cursor-to-openai:latest
```

## 获取 Cursor Cookie

### 方式一：通过抓包获取

使用 Fiddler 等抓包工具，捕获 Cursor IDE 的 HTTPS 请求，从请求头中提取 `Authorization: Bearer <token>` 中的 JWT Token。

### 方式二：通过登录获取

```bash
npm run login
```

按照提示在浏览器中登录，命令行会显示 Cookie 值。

### 方式三：通过 API 获取

在浏览器中登录 Cursor 账号，从 Application → Cookie 中获取 `WorkosCursorSessionToken`，然后：

```python
import requests

WorkosCursorSessionToken = "your_session_token"
response = requests.get("http://localhost:3010/cursor/loginDeepControl", headers={
    "authorization": f"Bearer {WorkosCursorSessionToken}"
})
cookie = response.json()["accessToken"]
print(cookie)
```

## API 使用

### 获取模型列表

```
GET http://localhost:3010/v1/models
Authorization: Bearer <your-cursor-cookie>
```

### 聊天补全

```
POST http://localhost:3010/v1/chat/completions
Authorization: Bearer <your-cursor-cookie>
Content-Type: application/json

{
  "model": "claude-4.5-sonnet",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

### 可用模型（部分）

| 模型 | 说明 |
|------|------|
| `default` | 默认模型，自动选择 |
| `claude-4.6-sonnet-medium` | Claude 4.6 Sonnet |
| `claude-4.6-opus-high` | Claude 4.6 Opus |
| `claude-4.6-opus-max-thinking` | Claude 4.6 Opus 思维链 |
| `claude-4.5-sonnet` | Claude 4.5 Sonnet |
| `claude-4.5-sonnet-thinking` | Claude 4.5 Sonnet 思维链 |
| `gpt-5.2` | GPT-5.2 |
| `gpt-5-mini` | GPT-5 Mini |
| `gemini-3.1-pro` | Gemini 3.1 Pro |

完整列表通过 `/v1/models` 接口获取。

### Python 示例

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-cursor-cookie",
    base_url="http://localhost:3010/v1"
)

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

### cURL 示例

```bash
curl http://localhost:3010/v1/chat/completions \
  -H "Authorization: Bearer your-cursor-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-4.6-sonnet-medium",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

## 配置

在项目根目录创建 `.env` 文件：

```env
PORT=3010
ROUTE_PREFIX=
PROXY_URL=           # HTTP 代理地址（可选）
```

## 注意事项

- 请妥善保管 Cursor Cookie，不要泄露给他人
- 本项目仅供学习研究使用，请遵守 Cursor 使用条款
- `x-cursor-client-version` 需要与你的 Cursor IDE 版本一致（当前为 2.5.25）

## 相关修改

基于 [Cursor-To-OpenAI](https://github.com/JiuZ-Chn/Cursor-To-OpenAI) 的主要改动：

- 更新 `x-cursor-client-version` 至 `2.5.25`（旧版本被 Cursor API 拒绝）
- 设置 `x-ghost-mode` 为 `false`（适配团队订阅）

## Acknowledgements

- Based on [Cursor-To-OpenAI](https://github.com/JiuZ-Chn/Cursor-To-OpenAI) by JiuZ-Chn
- Originally based on [cursor-api](https://github.com/zhx47/cursor-api) by zhx47
- Integrates commits from [cursor-api](https://github.com/lvguanjun/cursor-api) by lvguanjun
