/**
 * 处理聊天请求的API路由
 * 将用户消息发送到SiliconFlow API并返回响应
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
    const { message, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // SiliconFlow API密钥
    const apiKey = 'sk-pvucxrclkupjoavwpbbntvjywamtejjtyuantbuxmnkqorbx';
    
    // 构建消息历史，包括当前消息
    const messages = [
      // 系统消息，定义AI助手的行为
      { 
        role: 'system', 
        content: '你是一个友好、专业的AI助手，擅长回答用户问题并提供有用的信息。请用中文回答问题，保持回复简洁明了。' 
      },
      // 添加历史消息
      ...history,
      // 添加当前用户消息
      { role: 'user', content: message }
    ];
    
    // 调用SiliconFlow API
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SiliconFlow API错误:', errorData);
      return res.status(response.status).json({ 
        error: '调用AI服务失败', 
        details: errorData 
      });
    }

    const data = await response.json();
    
    // 返回AI的回复
    return res.status(200).json({ 
      reply: data.choices[0].message.content 
    });
    
  } catch (error) {
    console.error('处理聊天请求时出错:', error);
    return res.status(500).json({ 
      error: '服务器内部错误', 
      message: error.message 
    });
  }
} 