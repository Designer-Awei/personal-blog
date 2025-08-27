/**
 * 记忆检索API - 独立于聊天流程的记忆检索服务
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
      console.warn('[记忆检索API] 未配置 MEMU_API_KEY');
      return res.status(200).json({
        success: false,
        error: 'MemU API密钥未配置',
        memories: []
      });
    }

    const { message, userId, agentId = 'blog_assistant' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: '查询消息不能为空',
        memories: []
      });
    }

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
        console.warn('[记忆检索API] 读取用户信息失败，使用默认标识', e?.message);
        return {
          userId: userId || 'blog-user',
          userName: 'User'
        };
      }
    };

    const { userId: finalUserId } = getUserInfo();
    const url = `${memuBaseUrl}/api/v1/memory/retrieve/related-memory-items`;

    const attempt = async (label, payload) => {
      console.log(`[记忆检索API] 检索尝试(${label}):`, {
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
        const text = await resp.text().catch(() => '');
        console.warn(`[记忆检索API] (${label}) 检索失败:`, resp.status, text);
        return { items: [], raw: null };
      }

      const data = await resp.json();
      const list = (data.related_memories || data.relatedMemories || []);

      console.log(`[记忆检索API] (${label}) 返回字段:`, {
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

    console.log(`[记忆检索API] 开始检索记忆，查询: "${message.slice(0, 100)}"`);

    // 第一次尝试：限定 agent，常规阈值
    let { items, raw } = await attempt('A:agent+0.35', {
      user_id: finalUserId,
      agent_id: agentId,
      query: message,
      top_k: 8,
      min_similarity: 0.35,
    });

    // 回退1：降低阈值，扩大topK
    if (!items.length) {
      ({ items, raw } = await attempt('B:agent+0.10', {
        user_id: finalUserId,
        agent_id: agentId,
        query: message,
        top_k: 12,
        min_similarity: 0.10,
      }));
    }

    // 回退2：跨 agent 搜索（不传 agent_id）
    if (!items.length) {
      ({ items, raw } = await attempt('C:all-agents+0.10', {
        user_id: finalUserId,
        query: message,
        top_k: 12,
        min_similarity: 0.10,
      }));
    }

    const success = items.length > 0;
    const result = {
      success,
      memories: items,
      count: items.length,
      context: success ? items.join('\n') : '',
      message: success
        ? `成功检索到 ${items.length} 条记忆`
        : '未检索到相关记忆'
    };

    console.log(`[记忆检索API] 检索完成: ${result.message}`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('[记忆检索API] 检索异常:', error);
    return res.status(500).json({
      success: false,
      error: '记忆检索服务异常',
      memories: [],
      details: error.message
    });
  }
}
