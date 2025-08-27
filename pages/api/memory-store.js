/**
 * 记忆存储API - 独立于聊天流程的记忆存储服务
 * 用于解决Vercel serverless环境的超时限制
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
    const fs = await import('fs');
    const path = await import('path');

    const memuApiKey = process.env.MEMU_API_KEY;
    const memuBaseUrl = (process.env.MEMU_API_BASE_URL || 'https://api.memu.so').replace(/\/$/, '');

    if (!memuApiKey) {
      console.warn('[记忆存储API] 未配置 MEMU_API_KEY');
      return res.status(200).json({
        success: false,
        error: 'MemU API密钥未配置'
      });
    }

    const { history, userMessage, assistantMessage, userId, agentId = 'blog_assistant' } = req.body;

    const getUserInfo = () => {
      try {
        const configPath = path.join(process.cwd(), 'data', 'userConfig.json');
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          userId: parsed.email || parsed.name || userId || 'blog-user',
          userName: parsed.name || 'User',
        };
      } catch (e) {
        console.warn('[记忆存储API] 读取用户信息失败，使用默认标识', e?.message);
        return {
          userId: userId || 'blog-user',
          userName: 'User'
        };
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

    const { userId: finalUserId, userName } = getUserInfo();
    const conversationText = buildConversationText(history, userMessage, assistantMessage);

    if (!conversationText.trim()) {
      return res.status(400).json({
        success: false,
        error: '对话内容不能为空'
      });
    }

    const payload = {
      conversation_text: conversationText,
      user_id: finalUserId,
      user_name: userName,
      agent_id: agentId,
      agent_name: 'Blog Assistant',
      session_date: new Date().toISOString(),
    };

    const url = `${memuBaseUrl}/api/v1/memory/memorize`;

    console.log(`[记忆存储API] 开始存储记忆，用户: ${finalUserId}`);

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
      console.error('[记忆存储API] 记忆存储失败:', resp.status, text);
      return res.status(200).json({
        success: false,
        error: `记忆存储失败 (${resp.status})`,
        details: text
      });
    }

    const data = await resp.json();
    const taskId = data?.task_id || data?.taskId || 'unknown';

    console.log(`[记忆存储API] 记忆存储成功，任务ID: ${taskId}`);

    return res.status(200).json({
      success: true,
      taskId,
      message: '记忆存储成功'
    });

  } catch (error) {
    console.error('[记忆存储API] 存储异常:', error);
    return res.status(500).json({
      success: false,
      error: '记忆存储服务异常',
      details: error.message
    });
  }
}
