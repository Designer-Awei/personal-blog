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

    // 检测是否需要联网搜索
    const detectSearchNeed = (query, visionResult = null) => {
      // 如果有视觉分析结果，不需要搜索（已经有图片信息）
      if (visionResult) {
        return false;
      }

      // 排除简单的时间查询 - 这些应该直接返回系统时间
      const simpleTimeQueries = [
        '现在几点了', '几点了', '现在时间', '当前时间', '系统时间',
        '现在是几点', '现在几点', '北京时间', '现在北京时间'
      ];

      if (simpleTimeQueries.some(timeQuery => query.includes(timeQuery))) {
        return false; // 简单时间查询不需要搜索
      }

      // 关键词检测 - 需要实时信息的查询
      const searchKeywords = [
        // 事件相关
        '新闻', '资讯', '报道', '头条', '热点', '时事', '突发',
        // 数据相关
        '价格', '汇率', '股价', '排名', '销量', '数据', '统计',
        // 天气相关（排除已经在search.js中处理）
        // 时间相关（排除已经在search.js中处理）
        // 实时信息
        '直播', '在线', '状态', '情况', '进展', '动态',
        // 复杂时间查询
        '今天', '昨天', '明天', '最近', '最新', '刚刚', '目前'
      ];

      // 问题类型检测 - 需要搜索的问题
      const questionPatterns = [
        /什么时候.*/, /何时.*/, /在哪里.*/, /地点.*/,
        /多少.*/, /几号.*/, /日期.*/,
        /怎么做.*/, /如何.*/, /步骤.*/, /方法.*/,
        /为什么.*/, /原因.*/, /怎么样.*/,
        /最新.*/, /最近.*/, /当前.*/,
        /谁是.*/, /是什么.*/, /什么是.*/
      ];

      // 检查关键词
      const hasSearchKeyword = searchKeywords.some(keyword => query.includes(keyword));

      // 检查问题模式
      const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(query));

      // 长度检查 - 太短的问题可能不需要搜索
      const isLongEnough = query.length > 3;

      // 时间检查 - 如果包含具体年份或日期，可能需要搜索
      const hasTimeReference = /\d{4}年|\d{1,2}月|\d{1,2}日|\d{1,2}:\d{2}/.test(query);

      // 返回是否需要搜索
      return (hasSearchKeyword || hasQuestionPattern || hasTimeReference) && isLongEnough;
    };

    // 检测是否需要记忆系统
    const detectMemoryNeed = (query, visionResult = null) => {
      // 如果有视觉分析结果，可能需要记忆（用户可能在问图片相关的问题）
      if (visionResult) {
        return true;
      }

      // 关键词检测 - 需要记忆的查询类型
      const memoryKeywords = [
        // 个人相关
        '我', '我的', '我是', '我叫', '我的名字', '我的工作', '我的职业',
        '我的学校', '我的专业', '我的经历', '我的爱好', '我喜欢', '我不喜欢',
        // 设置偏好
        '设置', '偏好', '配置', '选项', '默认', '首选',
        // 学习内容
        '学习', '教程', '课程', '笔记', '复习', '练习',
        // 决策相关
        '建议', '推荐', '选择', '决定', '方案', '计划',
        // 上下文依赖
        '之前', '刚才', '上次', '上一次', '之前说过', '刚才提过',
        // 关系建立
        '认识', '了解', '熟悉', '知道', '记得',
        // 个人事务
        '日程', '安排', '任务', '提醒', '待办', '清单'
      ];

      // 问题类型检测 - 需要记忆的问题
      const memoryPatterns = [
        // 关于用户的提问
        /我是谁.*/, /我是什么.*/, /我叫什么.*/, /我的名字.*/,
        /我从事.*/, /我的工作.*/, /我在哪里.*/,
        // 关于偏好的提问
        /我喜欢.*/, /我不喜欢.*/, /我的偏好.*/,
        // 关于历史的提问
        /我之前.*/, /我上次.*/, /我刚才.*/, /之前说过.*/,
        // 关于学习的提问
        /我学过.*/, /我学会.*/, /我掌握.*/,
        // 关于记忆的提问
        /记得.*/, /还记得.*/, /忘记.*/, /想起来.*/,
        // 图片相关提问
        /这是什么.*/, /那是什么.*/
      ];

      // 检查关键词
      const hasMemoryKeyword = memoryKeywords.some(keyword => query.includes(keyword));

      // 检查问题模式
      const hasMemoryPattern = memoryPatterns.some(pattern => pattern.test(query));

      // 长度检查 - 太短的问题可能不需要记忆（放宽限制）
      const isLongEnough = query.length > 3;

      // 对话延续性检查 - 如果包含代词，可能需要上下文
      const hasPersonalPronouns = /\b(我|你|他|她|它|我们|你们|他们|她们)\b/.test(query);

      // 特殊情况：简单的问候和日常查询不需要记忆
      const simpleQueries = [
        '你好', '您好', 'hello', 'hi', '早上好', '晚上好',
        '谢谢', '感谢', '再见', '拜拜', '晚安',
        '现在几点了', '几点了', '现在时间', '当前时间',
        '天气怎么样', '今天天气', '明天天气'
      ];

      const isSimpleQuery = simpleQueries.some(simpleQuery => query.includes(simpleQuery));

      if (isSimpleQuery) {
        return false; // 简单查询不需要记忆
      }

      // 图片相关查询通常需要记忆（即使较短）
      const isImageRelated = /\b(图片|照片|图像|图|picture|image)\b/.test(query);

      // 返回是否需要记忆
      return (hasMemoryKeyword || hasMemoryPattern || hasPersonalPronouns || isImageRelated) && isLongEnough;
    };

    // 移除了内联的记忆操作函数，现在使用独立的API
    let { message, history = [], model = 'THUDM/chatglm3-6b', uploadedImage = null, visionResult = null, step = 'direct' } = req.body;

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
    console.log(`[聊天请求] 上传图片: ${imageBase64 ? '是' : '否'}`);

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
1. 保持回复简洁明了，结构清晰
2. 如果不确定答案，请直接告知用户
3. 对于时间查询（如"现在几点了"、"纽约时间"等），系统会自动提供准确的时间信息
4. 如果问题需要实时信息，系统会自动进行网络搜索并提供结果
5. 如果用户上传了图片，请仔细分析图片内容并给出相关的回答
6. 对于复杂问题，优先使用记忆信息和搜索结果来提供准确回答
7. 重要：如果提供了网络搜索结果，请在回答中自然地引用相关信息，并保持markdown格式的超链接（如[来源](URL)），让用户可以直接点击跳转
8. 回答要基于搜索结果，但不要简单复制粘贴，要进行适当的整理和总结`;

    // 根据步骤处理不同的逻辑
    if (step === 'text-generation' && visionResult) {
      // 第二步：基于视觉分析结果进行文本生成
      console.log('[步骤2] 基于视觉分析结果进行文本生成');
      enhancedMessage = `${message}\n\n基于图片分析：${visionResult}`;
    } else if (imageBase64) {
      // 第一步：视觉分析（如果有图片且不是第二步）
      console.log('[视觉模型] 检测到图片，启用视觉模型');
      model = VISION_MODELS.primary; // 默认使用主视觉模型

      // 构建视觉模型的消息格式
      enhancedMessage = message || '请分析这张图片';
      console.log('[视觉模型] 已切换到:', model);
    }

    // 在LLM回复前先判断是否需要记忆和联网
    console.log('\n[预处理] 开始分析查询需求...');

    // 判断是否需要记忆系统
    const shouldUseMemory = detectMemoryNeed(message, visionResult);
    console.log(`[预处理] 记忆需求判断: ${shouldUseMemory ? '需要记忆' : '无需记忆'}`);

    // 判断是否需要联网搜索
    const shouldUseSearch = detectSearchNeed(message, visionResult);
    console.log(`[预处理] 搜索需求判断: ${shouldUseSearch ? '需要搜索' : '无需搜索'}`);

    // 根据判断结果执行相应操作

    // 1. 记忆检索（如果需要）
    let memoryContext = '';
    if (shouldUseMemory && memuApiKey) {
      try {
        console.log('[记忆系统] 开始检索相关记忆...');

        // 调用独立的记忆检索API
        const memoryResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/memory-retrieve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            agentId: 'blog_assistant'
          }),
        });

        if (memoryResponse.ok) {
          const memoryData = await memoryResponse.json();

          if (memoryData.success && memoryData.memories && memoryData.memories.length > 0) {
            const memories = memoryData.memories;
            memoryContext = memories.join('\n');
            systemPrompt = `${systemPrompt}\n\nMEMORY CONTEXT (from MemU):\n${memoryContext}\n\n使用以上记忆信息进行个性化、连续性的回答；若与用户最新信息冲突，以最新信息为准。`;
            console.log(`[记忆系统] 记忆检索命中，条数=${memories.length} 长度=${memoryContext.length}`);

            // 输出完整上下文（限制长度避免日志过长）
            const fullCtx = memories.join('\n');
            const logged = fullCtx.length > 5000 ? (fullCtx.slice(0, 5000) + '\n...[truncated]') : fullCtx;
            console.log('[记忆系统] 记忆上下文(完整):\n' + logged);
          } else {
            console.log('[记忆系统] 未检索到相关记忆');
          }
        } else {
          console.warn('[记忆系统] 记忆检索API调用失败:', memoryResponse.status);
        }
      } catch (e) {
        console.warn('[记忆系统] 记忆检索异常:', e?.message || e);
      }
    } else {
      const reason = !shouldUseMemory ? '查询无需记忆' : '未配置MEMU_API_KEY';
      console.log(`[记忆系统] 跳过记忆检索：${reason}`);
    }

    // 2. 联网搜索（如果需要）
    if (shouldUseSearch) {
      try {
        console.log('[搜索系统] 开始联网搜索...');

        const searchResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: message
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();

          if (searchData.success && searchData.results) {
            console.log(`[搜索系统] 搜索结果内容:`, searchData.results);
            console.log(`[搜索系统] 搜索结果长度:`, searchData.results.length);

            // 严格校验有效性
            const resultsText = (searchData.results || '').trim();
            const hasFailedMarker = resultsText.includes('SEARCH_FAILED');
            const hasUrl = /https?:\/\//i.test(resultsText);
            const hasSourceLine = /来源:\s*https?:\/\//i.test(resultsText) || /来源:/i.test(resultsText) || /\[来源\]\(https?:\/\/[^\)]+\)/i.test(resultsText);
            const isSufficientLength = resultsText.length >= 80;

            const isValidResult = !hasFailedMarker && (
              hasUrl || hasSourceLine || isSufficientLength
            );

            if (isValidResult) {
              systemPrompt = `${systemPrompt}\n\n=== 网络搜索结果 ===\n${resultsText}\n=== 搜索结果结束 ===\n\n请基于以上搜索结果回答用户的问题。重要要求：\n1. **完整呈现**: 尽可能完整地呈现所有相关检索结果，形成一个全面的回答\n2. **逐一引用**: 为每一个引用的信息都附上相应的markdown格式超链接\n3. **结构化呈现**: 使用列表或编号形式分别呈现不同来源的信息\n4. **格式保持**: 严格保持markdown格式，确保超链接可以直接点击跳转\n5. **信息整合**: 将来自不同来源的信息有机整合，形成连贯的回答\n6. **来源标注**: 每个引用都要明确标注来源，如"根据[来源名称](URL)的报道..."\n7. 如果某些搜索结果重复或不相关，可以适当筛选，但要确保主要信息来源的完整性\n\n**引用示例**：\n- 根据[AI眼镜，下一代移动智能终端？](https://wearable.ofweek.com/)的报道，AI眼镜正成为新的智能终端\n- 参考[硬件搭上AI，字节美团相中万亿新赛道](https://www.chinaventure.com.cn/)的分析，AI硬件市场前景广阔\n\n请确保你的回答包含多个相关来源的引用，形成一个信息全面且有据可依的回答。`;
              console.log(`[搜索系统] 搜索完成，判定为有效结果`);
            } else {
              systemPrompt = `${systemPrompt}\n\n网络搜索已执行，但未获得可用的搜索结果。请基于你的知识回答用户的问题。`;
              console.log('[搜索系统] 搜索结果信息不足，使用知识兜底');
            }
          } else {
            console.log('[搜索系统] 搜索失败或无结果');
            systemPrompt = `${systemPrompt}\n\n网络搜索失败。请基于你的知识回答用户的问题。`;
          }
        } else {
          console.warn('[搜索系统] 搜索API调用失败:', searchResponse.status);
          systemPrompt = `${systemPrompt}\n\n网络搜索暂时不可用。请基于你的知识回答用户的问题。`;
        }
      } catch (e) {
        console.warn('[搜索系统] 搜索异常:', e?.message || e);
        systemPrompt = `${systemPrompt}\n\n网络搜索遇到技术问题。请基于你的知识回答用户的问题。`;
      }
    } else {
      console.log('[搜索系统] 该查询无需联网搜索');
    }

    console.log('\n[步骤4] 准备发送最终请求...');
    console.log(`[模式] 最终回复模式: ${replyMode}`);

    // 构建消息历史，包括当前消息
    let messages = [];

    // 根据步骤构建不同的消息格式
    if (step === 'text-generation') {
      // 第二步：基于视觉分析结果的文本生成
      console.log('[步骤2] 构建文本生成消息格式');

      messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: enhancedMessage }
      ];
    } else if (imageBase64) {
      // 第一步：视觉分析
      console.log('[视觉模型] 构建视觉分析消息格式');

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
      // 记录LLM完整回复内容到日志
      console.log('\n<<<LLM_FULL_REPLY_START>>>');
      console.log(fullText);
      console.log('<<<LLM_FULL_REPLY_END>>>\n');

      // 在响应结束后，根据预处理判断结果决定是否异步存储记忆
      // 注意：不阻塞客户端 SSE
      const originalUserMessage = message; // 请求体中的原始用户消息
      const finalAssistantMessage = fullText; // 模型完整回复

      // 只有在预处理时判断需要记忆且有有效回复时才存储
      if (shouldUseMemory && memuApiKey && finalAssistantMessage.trim()) {
        Promise.resolve().then(async () => {
          try {
            console.log('[记忆系统] 开始异步存储对话（根据预处理判断）...');

            const storeResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/memory-store`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                history: history,
                userMessage: originalUserMessage,
                assistantMessage: finalAssistantMessage,
                agentId: 'blog_assistant'
              }),
            });

            if (storeResponse.ok) {
              const storeData = await storeResponse.json();
              if (storeData.success) {
                console.log('[记忆系统] 对话存储成功:', storeData.taskId || '完成');
              } else {
                console.warn('[记忆系统] 对话存储失败:', storeData.error);
              }
            } else {
              console.warn('[记忆系统] 记忆存储API调用失败:', storeResponse.status);
            }
          } catch (error) {
            console.error('[记忆系统] 异步存储异常:', error?.message || error);
          }
        });
      } else {
        const reasons = [];
        if (!shouldUseMemory) reasons.push('预处理判断无需记忆');
        if (!memuApiKey) reasons.push('未配置密钥');
        if (!finalAssistantMessage.trim()) reasons.push('无回复内容');
        console.log(`[记忆系统] 跳过对话存储（${reasons.join('、')}）`);
      }
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