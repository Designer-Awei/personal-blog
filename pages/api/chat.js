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
    let { message, history = [], model = 'THUDM/chatglm3-6b', isWebEnabled = false } = req.body;
    console.log(`\n[聊天请求] 开始处理新的聊天请求`);
    console.log(`[聊天请求] 联网功能状态: ${isWebEnabled ? '开启' : '关闭'}`);
    console.log(`[聊天请求] 用户消息: ${message}`);
    console.log(`[聊天请求] 使用模型: ${model}`);
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 从环境变量获取SiliconFlow API密钥
    let apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      console.error('[错误] 未配置SiliconFlow API密钥');
      return res.status(500).json({ error: 'API密钥配置错误' });
    }

    let enhancedMessage = message;
    let webSearchResults = '';
    let systemPrompt = '';

    // 如果启用了联网功能，先让LLM判断是否需要搜索
    if (isWebEnabled) {
      try {
        console.log('\n[步骤1] 开始分析用户需求...');
        // 第一步：让LLM分析问题是否需要搜索
        let analysisResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: `你是一个专业的问题分析器。请分析用户问题是否需要搜索互联网获取信息。
规则：
1. 需要搜索的情况：
   - 询问天气、新闻、股票等实时信息
   - 查询特定事实或数据
   - 需要最新信息的问题
2. 特殊处理的情况：
   - 标准时间查询：仅包含"北京时间"、"当前时间"、"现在时间"、"几点了"、"现在几点"等关键词时，返回 isTimeQuery: true
   - 其他时间相关查询：包含"日出"、"日落"、"作息时间"等具体时间查询，返回 needSearch: true, isTimeQuery: false
3. 不需要搜索的情况：
   - 纯主观或观点性问题
   - 基础知识或概念解释
   - 数学运算或逻辑推理
   - 闲聊或问候
4. 返回格式：
   {
     "needSearch": true/false,
     "isTimeQuery": true/false,
     "reason": "简要说明原因",
     "searchKeywords": "如果需要搜索，提供2-5个关键词，用空格分隔，否则留空"
   }
请以JSON格式返回结果。`
              },
              {
                role: 'user',
                content: `分析以下问题是否需要搜索：${message}`
              }
            ],
            temperature: 0.1,
            max_tokens: 150,
            stream: false
          })
        });

        if (!analysisResponse.ok) {
          throw new Error('需求分析失败');
        }

        let analysisData = await analysisResponse.json();
        let analysis = JSON.parse(analysisData.choices[0].message.content.trim());
        console.log(`[步骤1] 分析结果:`, analysis);

        if (analysis.needSearch || analysis.isTimeQuery) {
          if (analysis.isTimeQuery) {
            console.log('\n[步骤2] 检测到时间查询，获取标准时间...');
          } else {
            console.log('\n[步骤2] 开始网页搜索...');
          }
          
          let searchResponse = await fetch(`${req.headers.origin}/api/web-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: analysis.isTimeQuery ? '当前北京时间' : (analysis.searchKeywords || message) })
          });

          if (searchResponse.ok) {
            let { results } = await searchResponse.json();
            webSearchResults = results;
            console.log('[步骤2] 搜索完成，获取到结果');
            console.log(`[步骤2] 搜索结果长度: ${webSearchResults.length} 字符`);
            
            if (webSearchResults && webSearchResults.length > 0) {
              console.log('\n[步骤3] 构建系统提示词...');
              
              if (analysis.isTimeQuery) {
                systemPrompt = `你是一个专业、严谨的AI助手。这是一个时间查询请求：

1. 用户问题：${message}
2. 查询结果：${webSearchResults}

请按照以下要求回答：
1. 直接返回时间信息，保持简洁明确
2. 标注数据来源
3. 如果是系统时间，提醒用户可能存在误差`;
              } else if (webSearchResults.includes('天气')) {
                systemPrompt = `你是一个专业的天气助手。请根据以下信息回答用户的天气查询：

1. 用户问题：${message}
2. 天气数据：${webSearchResults}

回答要求：
1. 直接展示天气信息，包括：
   - 实时温度
   - 天气状况
   - 风力风向
   - 空气质量
   - 湿度
   - 降水概率
   - 紫外线强度
2. 保持数据的准确性，不要添加或修改数据
3. 如果某项数据缺失，直接跳过该项
4. 在回答末尾标注数据来源和更新时间`;
              } else {
                systemPrompt = `你是一个专业、严谨的AI助手。请遵循以下规则分析和回答问题：

1. 用户原始问题：${message}
2. 搜索原因：${analysis.reason}
3. 搜索关键词：${analysis.searchKeywords}
4. 分析要求：
   - 仔细阅读搜索结果，提取与问题相关的信息
   - 将不同来源的信息进行对比和整合
   - 确保信息的时效性和准确性
   - 对于天气、新闻等实时信息，标注具体时间
5. 回答格式：
   - 开头：简明扼要地回答用户问题
   - 主体：展开补充必要的详细信息
   - 结尾：标注"数据来源："并列出所有信息来源和时间
6. 回答要求：
   - 直接回答用户的问题
   - 只使用搜索结果中的真实信息，不要编造
   - 标注所有信息的时间、来源和相关实体
   - 如果信息可能已过时，明确提醒用户
   - 如果搜索结果与问题相关性不高，说明原因
7. 特殊查询处理：
   - 天气查询：优先展示温度、天气状况、湿度、风力等关键信息
   - 新闻查询：注重时效性，标注发布时间
   - 数据查询：重点关注数据的准确性和来源`;
              }

              // 将搜索结果添加到用户消息中
              enhancedMessage = `用户问题: ${message}\n\n搜索结果:\n${webSearchResults}\n\n请按照系统提示词的要求，基于以上搜索结果回答问题。`;
              console.log('[步骤3] 系统提示词和增强消息已准备完成');
            } else {
              console.log('[步骤3] 搜索结果为空，使用基础提示词');
              systemPrompt = `你是一个专业的AI助手。我们尝试搜索"${analysis.searchKeywords}"但未找到相关结果。请：
1. 告知用户搜索未果的情况
2. 分析可能的原因
3. 建议其他可能的搜索关键词
4. 如果可能，基于你已有的知识提供相关信息
注意：请在回答末尾标注"[离线回复]"，提醒用户信息可能不是最新的。`;
              enhancedMessage = message;
            }
          }
        } else {
          console.log('[步骤2] 无需搜索，使用本地知识回答');
          systemPrompt = `你是一个专业的AI助手。这个问题不需要搜索互联网，原因是：${analysis.reason}
请基于你已有的知识回答问题，遵循以下要求：
1. 直接回答用户的问题
2. 如果涉及事实信息，说明这是基于训练数据的认知
3. 在回答末尾标注"[本地回复]"
4. 如果用户追问具体或实时信息，建议使用搜索功能`;
          enhancedMessage = message;
        }
      } catch (error) {
        console.error('\n[错误] 处理过程出错:', error);
        systemPrompt = `你是一个专业的AI助手。在处理请求时遇到了技术问题。请：
1. 告知用户当前无法访问实时信息
2. 基于你已有的知识，尽可能回答问题
3. 在回答末尾标注"[离线回复]"
4. 建议用户稍后再试`;
      }
    } else {
      console.log('[提示] 联网功能未启用，使用基础提示词');
      systemPrompt = `你是一个专业的AI助手。请用中文回答用户问题，遵循以下要求：
1. 保持回复简洁明了
2. 如果不确定答案，请直接告知用户
3. 在回答末尾标注"[离线回复]"
4. 如果问题需要实时信息，建议用户启用联网功能`;
    }
    
    console.log('\n[步骤4] 准备发送最终请求...');
    // 构建消息历史，包括当前消息
    let messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: enhancedMessage }
    ];
    
    // 设置响应头，启用流式输出
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    console.log('[步骤4] 调用SiliconFlow API获取回答...');
    // 调用SiliconFlow API进行最终回答
    let response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.3,
        top_p: 0.8,
        frequency_penalty: 0.1,
        stream: true
      })
    });

    if (!response.ok) {
      let errorData = await response.json();
      console.error('[错误] SiliconFlow API错误:', errorData);
      res.write(`data: ${JSON.stringify({ error: '调用AI服务失败', details: errorData })}\n\n`);
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
        
        // 解码二进制数据
        let chunk = decoder.decode(value, { stream: false });
        buffer += chunk;
        
        // 处理完整的SSE消息
        let messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息
        
        for (let message of messages) {
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