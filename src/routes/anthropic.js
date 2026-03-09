const express = require('express');
const router = express.Router();
const { fetch, ProxyAgent, Agent } = require('undici');
const { v4: uuidv4, v5: uuidv5 } = require('uuid');
const config = require('../config/config');
const $root = require('../proto/message.js');
const { generateCursorBody, chunkToUtf8String, generateHashed64Hex, generateCursorChecksum } = require('../utils/utils.js');
const { resolveToken, normalizeCursorToken } = require('../middleware/auth.js');

// Convert Anthropic messages format to internal format
function convertMessages(body) {
  const messages = [];

  // Handle system prompt
  if (body.system) {
    const systemText = typeof body.system === 'string'
      ? body.system
      : body.system.map(s => s.text || '').join('\n');
    messages.push({ role: 'system', content: systemText });
  }

  // Convert messages
  for (const msg of body.messages || []) {
    let content = '';
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      content = msg.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    }
    messages.push({ role: msg.role, content });
  }

  return messages;
}

// Map Anthropic model names to Cursor model names
function mapModel(model) {
  const modelMap = {
    'claude-opus-4-6': 'claude-4.6-opus-high',
    'claude-sonnet-4-6': 'claude-4.6-sonnet-medium',
    'claude-haiku-4-5': 'claude-4.5-haiku',
    'claude-3-5-sonnet-20241022': 'claude-4.5-sonnet',
    'claude-3-5-sonnet-latest': 'claude-4.5-sonnet',
    'claude-3-5-haiku-20241022': 'claude-4.5-haiku',
    'claude-3-opus-20240229': 'claude-4.5-opus-high',
    'claude-sonnet-4-5-20250514': 'claude-4.5-sonnet',
    'claude-opus-4-6-20250610': 'claude-4.6-opus-high',
  };
  return modelMap[model] || model;
}

router.post('/messages', async (req, res) => {
  try {
    const authToken = normalizeCursorToken(resolveToken(req));
    if (!authToken) {
      return res.status(401).json({
        type: 'error',
        error: { type: 'authentication_error', message: 'Missing API key' }
      });
    }

    const body = req.body;
    const messages = convertMessages(body);
    const model = mapModel(body.model || 'claude-sonnet-4-6');
    const stream = body.stream || false;

    if (!messages.length) {
      return res.status(400).json({
        type: 'error',
        error: { type: 'invalid_request_error', message: 'Messages array is required' }
      });
    }

    const cursorChecksum = req.headers['x-cursor-checksum']
      ?? generateCursorChecksum(authToken.trim());
    const sessionid = uuidv5(authToken, uuidv5.DNS);
    const clientKey = generateHashed64Hex(authToken);
    const cursorClientVersion = "2.5.25";
    const cursorConfigVersion = uuidv4();

    const cursorBody = generateCursorBody(messages, model);
    const dispatcher = config.proxy.enabled
      ? new ProxyAgent(config.proxy.url, { allowH2: true })
      : new Agent({ allowH2: true });

    const response = await fetch('https://api2.cursor.sh/aiserver.v1.ChatService/StreamUnifiedChatWithTools', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${authToken}`,
        'connect-accept-encoding': 'gzip',
        'connect-content-encoding': 'gzip',
        'connect-protocol-version': '1',
        'content-type': 'application/connect+proto',
        'user-agent': 'connect-es/1.6.1',
        'x-amzn-trace-id': `Root=${uuidv4()}`,
        'x-client-key': clientKey,
        'x-cursor-checksum': cursorChecksum,
        'x-cursor-client-version': cursorClientVersion,
        'x-cursor-config-version': cursorConfigVersion,
        'x-cursor-timezone': 'Asia/Shanghai',
        'x-ghost-mode': 'false',
        'x-request-id': uuidv4(),
        'x-session-id': sessionid,
        'Host': 'api2.cursor.sh'
      },
      body: cursorBody,
      dispatcher: dispatcher,
      timeout: {
        connect: 5000,
        read: 120000
      }
    });

    if (response.status !== 200) {
      return res.status(response.status).json({
        type: 'error',
        error: { type: 'api_error', message: response.statusText }
      });
    }

    const msgId = `msg_${uuidv4().replace(/-/g, '').substring(0, 20)}`;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // message_start
      res.write(`event: message_start\ndata: ${JSON.stringify({
        type: 'message_start',
        message: {
          id: msgId,
          type: 'message',
          role: 'assistant',
          content: [],
          model: body.model || 'claude-sonnet-4-6',
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 }
        }
      })}\n\n`);

      // content_block_start for text
      let textBlockStarted = false;
      let thinkingBlockStarted = false;
      let blockIndex = 0;

      try {
        for await (const chunk of response.body) {
          const { thinking, text } = chunkToUtf8String(chunk);

          // Handle thinking content
          if (thinking.length > 0) {
            if (!thinkingBlockStarted) {
              res.write(`event: content_block_start\ndata: ${JSON.stringify({
                type: 'content_block_start',
                index: blockIndex,
                content_block: { type: 'thinking', thinking: '' }
              })}\n\n`);
              thinkingBlockStarted = true;
            }
            res.write(`event: content_block_delta\ndata: ${JSON.stringify({
              type: 'content_block_delta',
              index: blockIndex,
              delta: { type: 'thinking_delta', thinking: thinking }
            })}\n\n`);
          }

          // Transition from thinking to text
          if (text.length > 0 && thinkingBlockStarted && !textBlockStarted) {
            res.write(`event: content_block_stop\ndata: ${JSON.stringify({
              type: 'content_block_stop',
              index: blockIndex
            })}\n\n`);
            blockIndex++;
          }

          // Handle text content
          if (text.length > 0) {
            if (!textBlockStarted) {
              res.write(`event: content_block_start\ndata: ${JSON.stringify({
                type: 'content_block_start',
                index: blockIndex,
                content_block: { type: 'text', text: '' }
              })}\n\n`);
              textBlockStarted = true;
            }
            res.write(`event: content_block_delta\ndata: ${JSON.stringify({
              type: 'content_block_delta',
              index: blockIndex,
              delta: { type: 'text_delta', text: text }
            })}\n\n`);
          }
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
      }

      // Close any open blocks
      if (thinkingBlockStarted && !textBlockStarted) {
        res.write(`event: content_block_stop\ndata: ${JSON.stringify({
          type: 'content_block_stop',
          index: blockIndex
        })}\n\n`);
      }
      if (textBlockStarted) {
        res.write(`event: content_block_stop\ndata: ${JSON.stringify({
          type: 'content_block_stop',
          index: blockIndex
        })}\n\n`);
      }

      // If no blocks were started, send an empty text block
      if (!textBlockStarted && !thinkingBlockStarted) {
        res.write(`event: content_block_start\ndata: ${JSON.stringify({
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' }
        })}\n\n`);
        res.write(`event: content_block_stop\ndata: ${JSON.stringify({
          type: 'content_block_stop',
          index: 0
        })}\n\n`);
      }

      // message_delta
      res.write(`event: message_delta\ndata: ${JSON.stringify({
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: 0 }
      })}\n\n`);

      // message_stop
      res.write(`event: message_stop\ndata: ${JSON.stringify({
        type: 'message_stop'
      })}\n\n`);

      res.end();

    } else {
      // Non-streaming response
      let fullText = '';
      let fullThinking = '';

      try {
        for await (const chunk of response.body) {
          const { thinking, text } = chunkToUtf8String(chunk);
          fullThinking += thinking;
          fullText += text;
        }
      } catch (error) {
        console.error('Non-stream error:', error);
        if (error.name === 'TimeoutError') {
          return res.status(408).json({
            type: 'error',
            error: { type: 'api_error', message: 'Request timeout' }
          });
        }
        throw error;
      }

      const content = [];
      if (fullThinking) {
        content.push({ type: 'thinking', thinking: fullThinking });
      }
      content.push({ type: 'text', text: fullText });

      return res.json({
        id: msgId,
        type: 'message',
        role: 'assistant',
        content: content,
        model: body.model || 'claude-sonnet-4-6',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0
        }
      });
    }
  } catch (error) {
    console.error('Anthropic endpoint error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        type: 'error',
        error: { type: 'api_error', message: 'Internal server error' }
      });
    }
  }
});

module.exports = router;
