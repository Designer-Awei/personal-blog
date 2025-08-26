/**
 * 处理聊天请求的API路由
 * 将用户消息发送到SiliconFlow API并返回流式响应
 *
 * @param {object} req - HTTP请求对象
 * @param {object} res - HTTP响应对象
 */

// 配置API路由以支持更大的请求体（用于图片上传）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 增加到10MB以支持图片上传
    },
  },
};

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    const fs = await import('fs');
    const path = await import('path');

    const memuApiKey = process.env.MEMU_API_KEY;
    const memuBaseUrl = (process.env.MEMU_API_BASE_URL || 'https://api.memu.so').replace(/\/$/, '');

    const getUserInfo = () => {
      try {
        const configPath = path.join(process.cwd(), 'data', 'userConfig.json');
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          userId: parsed.email || parsed.name || 'blog-user',
          userName: parsed.name || 'User',
        };
      } catch (e) {
        console.warn('[MemU] 读取用户信息失败，使用默认标识', e?.message);
        return { userId: 'blog-user', userName: 'User' };
      }
    };

    const buildConversationText = (history, userMsg, assistantMsg) => {
      let lines = [];
      if (Array.isArray(history)) {
        for (const m of history) {
          if (!m || !m.role || !m.content) continue;
          if (m.role === 'system') continue;
          const prefix = m.role === 'user' ? 'User' : 'Agent';
          lines.push(`${prefix}: ${m.content}`);
        }
      }
      if (userMsg) lines.push(`User: ${userMsg}`);
      if (assistantMsg) lines.push(`Agent: ${assistantMsg}`);
      return lines.join('\n');
    };

    const sendMemu = async ({ history, userMessage, assistantMessage }) => {
      try {
        if (!memuApiKey) {
          console.warn('[MemU] 未配置 MEMU_API_KEY，跳过记忆上报');
          return;
        }
        const { userId, userName } = getUserInfo();
        const conversationText = buildConversationText(history, userMessage, assistantMessage);
        const payload = {
          conversation_text: conversationText,
          user_id: userId,
          user_name: userName,
          agent_id: 'blog_assistant',
          agent_name: 'Blog Assistant',
          session_date: new Date().toISOString(),
        };
        const url = `${memuBaseUrl}/api/v1/memory/memorize`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memuApiKey}`,
          },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const text = await resp.text();
          console.error('[MemU] 记忆上报失败:', resp.status, text);
          return;
        }
        const data = await resp.json();
        const taskId = data?.task_id || data?.taskId || 'unknown';
        console.log(`[MemU] 记忆上报成功，任务ID: ${taskId}`);
      } catch (err) {
        console.error('[MemU] 记忆上报异常:', err);
      }
    };
    let { message, history = [], model = 'THUDM/chatglm3-6b', uploadedImage = null } = req.body;

    // 直接使用前端传来的base64图片数据
    let imageBase64 = null;
    if (uploadedImage && uploadedImage.startsWith('data:image/')) {
      imageBase64 = uploadedImage;
      console.log('[视觉模型] 使用前端传来的base64图片数据');
    }

    // 视觉模型配置
    const VISION_MODELS = {
      primary: 'THUDM/GLM-4.1V-9B-Thinking',
      fallback: 'Pro/Qwen/Qwen2.5-VL-7B-Instruct'
    };
    console.log(`\n[聊天请求] 开始处理新的聊天请求`);
    console.log(`[聊天请求] 用户消息: ${message}`);
    console.log(`[聊天请求] 使用模型: ${model}`);
    console.log(`[聊天请求] 上传图片: ${uploadedImage ? '是' : '否'}`);

    if (!message && !imageBase64) {
      return res.status(400).json({ error: '消息或图片不能为空' });
    }

    // 从环境变量获取SiliconFlow API密钥
    let apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      console.error('[错误] 未配置SiliconFlow API密钥');
      return res.status(500).json({ error: 'API密钥配置错误' });
    }

    let enhancedMessage = message;
    let systemPrompt = '';
    let replyMode = 'offline-basic'; // 默认回复模式

    console.log('[提示] 使用基础提示词');
    systemPrompt = `你是一个专业的AI助手。请用中文回答用户问题，遵循以下要求：
1. 保持回复简洁明了
2. 如果不确定答案，请直接告知用户
3. 如果问题需要实时信息，建议用户启用联网功能（暂未实现）
4. 如果用户上传了图片，请仔细分析图片内容并给出相关的回答`;

    // 处理上传的图片 - 使用视觉模型
    if (imageBase64) {
      console.log('[视觉模型] 检测到图片，启用视觉模型');
      model = VISION_MODELS.primary; // 默认使用主视觉模型

      // 构建视觉模型的消息格式
      enhancedMessage = message || '请分析这张图片';
      console.log('[视觉模型] 已切换到:', model);
    }
    
    // 在最终回答前：检索 MemU 记忆，作为系统提示的补充上下文
    try {
      if (memuApiKey) {
        const { userId, userName } = getUserInfo();
        const url = `${memuBaseUrl}/api/v1/memory/retrieve/related-memory-items`;

        const attempt = async (label, payload) => {
          console.log(`[MemU] 检索尝试(${label}):`, {
            userId: payload.user_id,
            agentId: payload.agent_id || '(all)',
            topK: payload.top_k,
            minSim: payload.min_similarity,
            query: String(payload.query || '').slice(0, 100)
          });
          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${memuApiKey}`,
            },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) {
            const t = await resp.text().catch(() => '');
            console.warn(`[MemU] (${label}) 检索失败:`, resp.status, t);
            return { items: [], raw: null };
          }
          const data = await resp.json();
          const list = (data.related_memories || data.relatedMemories || []);
          console.log(`[MemU] (${label}) 返回字段:`, {
            keys: Object.keys(data || {}),
            totalFound: data.total_found || data.totalFound,
            listLen: Array.isArray(list) ? list.length : 0,
          });
          const items = list.map((r) => {
            const mem = r.memory || r;
            const content = mem?.content || r?.content || '';
            const category = mem?.category || r?.category || '';
            return `- ${category ? '[' + category + '] ' : ''}${content}`;
          }).filter(Boolean);
          return { items, raw: data };
        };

        // 第一次尝试：限定 agent，常规阈值
        let { items, raw } = await attempt('A:agent+0.35', {
          user_id: userId,
          agent_id: 'blog_assistant',
          query: message,
          top_k: 8,
          min_similarity: 0.35,
        });

        // 回退1：降低阈值，扩大topK
        if (!items.length) {
          ({ items, raw } = await attempt('B:agent+0.10', {
            user_id: userId,
            agent_id: 'blog_assistant',
            query: message,
            top_k: 12,
            min_similarity: 0.10,
          }));
        }

        // 回退2：跨 agent 搜索（不传 agent_id）
        if (!items.length) {
          ({ items, raw } = await attempt('C:all-agents+0.10', {
            user_id: userId,
            query: message,
            top_k: 12,
            min_similarity: 0.10,
          }));
        }

        if (items.length) {
          let ctx = items.join('\n');
          systemPrompt = `${systemPrompt}\n\nMEMORY CONTEXT (from MemU):\n${ctx}\n\n使用以上记忆信息进行个性化、连续性的回答；若与用户最新信息冲突，以最新信息为准。`;
          console.log(`[MemU] 记忆检索命中，最终拼接条数=${items.length} 长度=${ctx.length}`);
          // 额外输出完整上下文（为排查问题保留日志，避免过长导致控制台卡顿，最大 5000 字）
          const fullCtx = items.join('\n');
          const logged = fullCtx.length > 5000 ? (fullCtx.slice(0, 5000) + '\n...[truncated]') : fullCtx;
          console.log('[MemU] 记忆上下文(完整):\n' + logged);
        } else {
          console.log('[MemU] 记忆检索仍为空（经过多轮回退）');
        }
      } else {
        console.log('[MemU] 未配置 MEMU_API_KEY，跳过记忆检索');
      }
    } catch (e) {
      console.warn('[MemU] 记忆检索异常:', e?.message || e);
    }
    
    console.log('\n[步骤4] 准备发送最终请求...');
    console.log(`[模式] 最终回复模式: ${replyMode}`);

    // 构建消息历史，包括当前消息
    let messages = [];

    // 处理视觉模型的消息格式
    if (imageBase64) {
      console.log('[视觉模型] 构建视觉消息格式');

      // 系统消息
      messages.push({ role: 'system', content: systemPrompt });

      // 处理历史消息（跳过包含图片的历史消息，因为流式响应可能不支持复杂格式）
      for (let i = 0; i < history.length; i++) {
        const histMsg = history[i];
        if (histMsg.role === 'user' && histMsg.image) {
          // 对于包含图片的历史消息，只保留文本内容
          messages.push({ role: 'user', content: histMsg.content || '请分析图片' });
        } else {
          messages.push(histMsg);
        }
      }

      // 当前消息 - 使用视觉模型格式
      const userMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: enhancedMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64 // 使用base64数据
            }
          }
        ]
      };
      messages.push(userMessage);

    } else {
      // 普通文本消息格式
      messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: enhancedMessage }
      ];
    }
    
    // 设置响应头，启用流式输出
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    console.log('[步骤4] 调用SiliconFlow API获取回答...');

    // 视觉模型主备切换逻辑
    let response;
    let currentModel = model;
    let useFallback = false;

    try {
      // 第一次尝试：使用主模型
      response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: currentModel,
          messages: messages,
          temperature: 0.3,
          top_p: 0.8,
          frequency_penalty: 0.1,
          stream: true
        })
      });

      // 如果是视觉模型且主模型失败，尝试备用模型
      if (!response.ok && imageBase64 && currentModel === VISION_MODELS.primary) {
        console.log('[视觉模型] 主模型调用失败，尝试备用模型...');
        useFallback = true;
        currentModel = VISION_MODELS.fallback;

        // 重新构建消息（备用模型可能需要不同的格式）
        const fallbackMessages = [
          { role: 'system', content: systemPrompt },
          ...history.map(histMsg => {
            if (histMsg.role === 'user' && histMsg.image) {
              return { role: 'user', content: histMsg.content || '请分析图片' };
            }
            return histMsg;
          }),
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: enhancedMessage
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64 // 使用base64数据
                }
              }
            ]
          }
        ];

        response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: currentModel,
            messages: fallbackMessages,
            temperature: 0.3,
            top_p: 0.8,
            frequency_penalty: 0.1,
            stream: true
          })
        });

        if (response.ok) {
          console.log('[视觉模型] 备用模型调用成功');
        }
      }

      if (!response.ok) {
        let errorData = await response.json();
        console.error(`[错误] SiliconFlow API错误 (模型: ${currentModel}):`, errorData);

        if (useFallback) {
          console.error('[视觉模型] 主备模型都调用失败');
        }

        res.write(`data: ${JSON.stringify({ error: '调用AI服务失败', details: errorData })}\n\n`);
        res.end();
        return;
      }

    } catch (error) {
      console.error('[错误] API请求异常:', error);
      res.write(`data: ${JSON.stringify({ error: '网络请求失败', details: error.message })}\n\n`);
      res.end();
      return;
    }

    console.log('[步骤4] 开始处理流式响应...');
    // 处理流式响应
    let reader = response.body.getReader();
    let decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = ''; // 用于跟踪完整的文本
    
    try {
      while (true) {
        let { done, value } = await reader.read();
        if (done) {
          break;
        }
        
        // 解码二进制数据（stream: true 保留多字节残片，避免中文乱码）
        let chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理完整的SSE消息
        let events = buffer.split('\n\n');
        buffer = events.pop() || ''; // 保留最后一个可能不完整的消息
        
        for (let message of events) {
          if (message.trim() && message.startsWith('data: ') && message !== 'data: [DONE]') {
            try {
              // 提取JSON数据
              let jsonData = message.slice(6).trim(); // 移除 'data: ' 前缀并去除空格
              let data = JSON.parse(jsonData);
              
              // 提取内容增量
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                let content = data.choices[0].delta.content;
                
                // 将增量添加到完整文本
                fullText += content;
                
                // 发送增量到客户端
                res.write(`data: ${JSON.stringify({ content, fullText })}\n\n`);
              }
            } catch (e) {
              console.error('解析流数据出错:', e, message);
            }
          } else if (message.trim() === 'data: [DONE]') {
            // 流结束
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          }
        }
      }
      
      // 刷新解码器缓冲，避免末尾半个多字节字符造成乱码
      const tail = decoder.decode();
      if (tail) buffer += tail;

      // 处理缓冲区中剩余的数据
      if (buffer.trim() && buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
        try {
          let jsonData = buffer.slice(6).trim();
          let data = JSON.parse(jsonData);
          
          if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
            let content = data.choices[0].delta.content;
            
            // 将增量添加到完整文本
            fullText += content;
            
            // 发送增量到客户端
            res.write(`data: ${JSON.stringify({ content, fullText })}\n\n`);
          }
        } catch (e) {
          console.error('解析剩余流数据出错:', e, buffer);
        }
      } else if (buffer.trim() === 'data: [DONE]') {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      
    } catch (error) {
      console.error('读取流数据时出错:', error);
      res.write(`data: ${JSON.stringify({ error: '读取响应流失败', message: error.message })}\n\n`);
    } finally {
      // 在响应结束后，异步上报对话到 MemU
      // 注意：不阻塞客户端 SSE
      const originalUserMessage = message; // 请求体中的原始用户消息
      const finalAssistantMessage = fullText; // 模型完整回复
      Promise.resolve().then(() =>
        sendMemu({ history, userMessage: originalUserMessage, assistantMessage: finalAssistantMessage })
      );
      res.end();
    }
    
  } catch (error) {
    console.error('处理聊天请求时出错:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: '服务器内部错误', 
      message: error.message 
    }));
  }
} 