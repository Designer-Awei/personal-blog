/**
 * 处理聊天请求的API路由
 * 将用户消息发送到SiliconFlow API并返回流式响应
 * 
 * @param {object} req - HTTP请求对象
 * @param {object} res - HTTP响应对象
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    const { message, history = [], model = 'THUDM/chatglm3-6b' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 从环境变量获取SiliconFlow API密钥
    const apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      console.error('未配置SiliconFlow API密钥');
      return res.status(500).json({ error: 'API密钥配置错误' });
    }
    
    // 根据模型类型确定系统提示词
    let systemPrompt = '你是一个友好、专业的AI助手。请用中文回答用户问题，保持回复简洁明了，提供有用的信息。';
    
    // 根据不同模型类型设置不同的系统提示词
    if (model.includes('chatglm3')) {
      systemPrompt = '你是一个通用的对话助手，能够回答各种问题并提供帮助。请用中文回答用户的问题。';
    } else if (model.includes('DeepSeek-R1')) {
      systemPrompt = '你是一个强大的通用对话助手，能够回答各种复杂问题。请用中文回答用户的问题，提供详细、准确的信息。';
    } else if (model.includes('Qwen2.5')) {
      systemPrompt = '你是一个先进的对话助手，能够理解复杂的问题并提供全面的回答。请用中文回答用户的问题，保持回复清晰、专业。';
    }
    
    // 构建消息历史，包括当前消息
    const messages = [
      // 系统消息，定义AI助手的行为
      { 
        role: 'system', 
        content: systemPrompt
      },
      // 添加历史消息
      ...history,
      // 添加当前用户消息
      { role: 'user', content: message }
    ];
    
    // 设置响应头，启用流式输出
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    // 调用SiliconFlow API，启用流式输出
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        top_p: 0.7,
        frequency_penalty: 0.1,
        stream: true // 启用流式输出
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SiliconFlow API错误:', errorData);
      res.write(`data: ${JSON.stringify({ error: '调用AI服务失败', details: errorData })}\n\n`);
      res.end();
      return;
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = ''; // 用于跟踪完整的文本
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        
        // 解码二进制数据
        const chunk = decoder.decode(value, { stream: false });
        buffer += chunk;
        
        // 处理完整的SSE消息
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息
        
        for (const message of messages) {
          if (message.trim() && message.startsWith('data: ') && message !== 'data: [DONE]') {
            try {
              // 提取JSON数据
              const jsonData = message.slice(6).trim(); // 移除 'data: ' 前缀并去除空格
              const data = JSON.parse(jsonData);
              
              // 提取内容增量
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                const content = data.choices[0].delta.content;
                
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
      
      // 处理缓冲区中剩余的数据
      if (buffer.trim() && buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
        try {
          const jsonData = buffer.slice(6).trim();
          const data = JSON.parse(jsonData);
          
          if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
            const content = data.choices[0].delta.content;
            
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