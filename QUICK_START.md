# Cursor-To-OpenAI 快速启动指南

## 🚀 快速开始

### 方法 1：使用启动脚本（推荐）

**启动服务器：**
双击 `start_server.bat`

**停止服务器：**
双击 `stop_server.bat` 或在服务器窗口按 `Ctrl+C`

---

### 方法 2：命令行启动

```bash
# 启动服务器
cd E:\work\Cursor-To-OpenAI
npm start

# 或后台运行
node src/app.js > server.log 2>&1 &
```

---

## ✅ 测试服务器

### 测试 1：检查模型列表

```bash
curl http://localhost:3010/v1/models \
  -H "Authorization: Bearer <你的token>"
```

**预期结果：** 返回 74 个可用模型

---

### 测试 2：测试聊天

```bash
curl -X POST http://localhost:3010/v1/chat/completions \
  -H "Authorization: Bearer <你的token>" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gpt-5.2\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
```

**预期结果：** 返回 AI 回复（需要有效的 Cursor 订阅）

---

### 测试 3：使用 Python 测试

```bash
python simple_test.py
```

---

## 🔧 配置

### 你的 Cursor Token

Token 已提取并保存：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnaXRodWJ8dXNlcl8wMUsxTVQyOE5RTUpGSjdGNlRNR0c2QUVNVyIsInRpbWUiOiIxNzcyNTE1NDI0IiwicmFuZG9tbmVzcyI6ImQwNmNmYjk2LWQ4YWYtNGZiYiIsImV4cCI6MTc3NzY5OTQyNCwiaXNzIjoiaHR0cHM6Ly9hdXRoZW50aWNhdGlvbi5jdXJzb3Iuc2giLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIiwiYXVkIjoiaHR0cHM6Ly9jdXJzb3IuY29tIiwidHlwZSI6InNlc3Npb24ifQ._BotGG4OEEiLBYU7_dPAERSwx_-axpw2jj5CAEpC6r0
```

**过期时间：** 2026年5月

---

### 如果需要新 Token

```bash
npm run login
```

按照提示在浏览器登录，复制返回的 token。

---

## 🔌 在其他应用中使用

### 配置示例（ChatBox / Open WebUI）

- **API Base URL:** `http://localhost:3010/v1`
- **API Key:** 你的 Cursor token（见上方）
- **模型:** 选择任意可用模型（共74个）

### 推荐模型：

**快速响应：**
- `gpt-5-mini`
- `gpt-5.2-fast`
- `claude-4.5-haiku`

**高质量：**
- `gpt-5.2-high`
- `claude-4.5-sonnet`
- `claude-4.6-opus-high`

**代码相关：**
- `gpt-5.3-codex`
- `gpt-5.2-codex-high`

---

## ⚠️ 故障排除

### 问题 1：聊天返回空内容

**原因：** 账号订阅可能已过期或无额度

**解决：**
1. 在 Cursor IDE 中测试 AI 功能
2. 检查账号订阅状态
3. 重新登录获取新 token：`npm run login`

---

### 问题 2：服务器无响应

**检查：**
```bash
# Windows
tasklist | findstr node

# 或测试端口
curl http://localhost:3010/v1/models
```

**解决：**
重启服务器（双击 `start_server.bat`）

---

### 问题 3：端口被占用

**错误信息：** `Error: listen EADDRINUSE: address already in use :::3010`

**解决：**
```bash
# 查找占用端口的进程
netstat -ano | findstr :3010

# 结束进程（替换 PID）
taskkill /F /PID <进程ID>
```

---

## 📊 服务器状态

**当前状态：** ✅ 运行中

**地址：** http://localhost:3010

**可用模型：** 74 个

**日志文件：** `server.log`

---

## 📚 相关文档

- `README.md` - 项目完整文档
- `TEST_RESULTS.md` - 测试报告
- `E:\work\FINAL_PROJECT_SUMMARY.md` - 项目总结

---

## 🎯 下一步

1. ✅ 服务器已运行
2. ⚠️ 验证账号订阅状态
3. ✅ 开始使用！

**一切就绪！享受使用 Cursor API 吧！** 🚀
