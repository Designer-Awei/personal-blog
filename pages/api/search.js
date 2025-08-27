/**
 * 基于Serper API的Web搜索功能
 * 支持时间查询、时区计算和通用搜索
 * 直接使用fetch调用Serper API，无需第三方包
 *
 * @param {object} req - HTTP请求对象
 * @param {object} res - HTTP响应对象
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: '查询内容不能为空' });
    }

    const trimmedQuery = query.trim();
    console.log(`[搜索API] 开始处理搜索请求: "${trimmedQuery}"`);

    // 检查Serper API密钥
    const serperApiKey = process.env.SERPER_API_KEY;
    if (!serperApiKey) {
      console.error('[搜索API] 未配置SERPER_API_KEY');
      return res.status(500).json({
        success: false,
        error: '搜索服务配置错误，请联系管理员'
      });
    }

    // 分析查询类型
    const queryAnalysis = analyzeQueryType(trimmedQuery);

    let results;

    switch (queryAnalysis.type) {
      case 'current_time':
        results = handleCurrentTimeQuery();
        break;
      case 'timezone_time':
        results = handleTimezoneQuery(queryAnalysis.city);
        break;
      case 'general':
      default:
        results = await handleGeneralSearch(trimmedQuery, serperApiKey);
        break;
    }

    console.log(`[搜索API] 搜索完成，返回结果类型: ${queryAnalysis.type}`);

    return res.status(200).json({
      success: true,
      query: trimmedQuery,
      type: queryAnalysis.type,
      results: results
    });

  } catch (error) {
    console.error('[搜索API] 处理失败:', error);
    return res.status(500).json({
      success: false,
      error: '搜索服务暂时不可用',
      message: error.message
    });
  }
}

/**
 * 分析查询类型
 */
function analyzeQueryType(query) {
  const lowerQuery = query.toLowerCase();

  // 当前时间查询
  const currentTimeKeywords = [
    '现在几点了', '几点了', '现在时间', '当前时间', '系统时间',
    '现在几点', '北京时间', '现在北京时间', '本地时间'
  ];

  if (currentTimeKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return { type: 'current_time' };
  }

  // 时区时间查询 - 提取城市名称
  const timezonePatterns = [
    /(.+?)时间是几点/, /(.+?)现在几点/, /(.+?)的当前时间/,
    /(.+?)当地时间/, /(.+?)时区时间/, /(.+?)几点/
  ];

  for (const pattern of timezonePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const city = match[1].trim();
      // 排除当前时间的关键字
      if (!currentTimeKeywords.some(keyword => city.includes(keyword))) {
        return { type: 'timezone_time', city };
      }
    }
  }

  return { type: 'general' };
}

/**
 * 处理当前时间查询
 */
function handleCurrentTimeQuery() {
  const now = new Date();
  const beijingTime = now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long'
  });

  const date = now.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return `北京时间：${beijingTime}\n日期：${date}\n\n注：以上时间基于系统时钟，可能存在轻微误差。如需精确时间，请使用专业授时服务。`;
}

/**
 * 处理时区时间查询
 */
function handleTimezoneQuery(city) {
  console.log(`[搜索API] 处理时区查询: ${city}`);

  // 城市时区映射
  const timezoneMap = {
    // 亚洲主要城市
    '纽约': 'America/New_York',
    '伦敦': 'Europe/London',
    '东京': 'Asia/Tokyo',
    '巴黎': 'Europe/Paris',
    '柏林': 'Europe/Berlin',
    '莫斯科': 'Europe/Moscow',
    '迪拜': 'Asia/Dubai',
    '新加坡': 'Asia/Singapore',
    '首尔': 'Asia/Seoul',
    '上海': 'Asia/Shanghai',
    '深圳': 'Asia/Shanghai',
    '广州': 'Asia/Shanghai',
    '杭州': 'Asia/Shanghai',
    '南京': 'Asia/Shanghai',
    '苏州': 'Asia/Shanghai',
    '香港': 'Asia/Hong_Kong',
    '台北': 'Asia/Taipei',
    '曼谷': 'Asia/Bangkok',
    '吉隆坡': 'Asia/Kuala_Lumpur',
    '雅加达': 'Asia/Jakarta',
    '孟买': 'Asia/Kolkata',
    '新德里': 'Asia/Kolkata',
    // 欧洲
    '罗马': 'Europe/Rome',
    '马德里': 'Europe/Madrid',
    '阿姆斯特丹': 'Europe/Amsterdam',
    '布鲁塞尔': 'Europe/Brussels',
    // 美洲
    '洛杉矶': 'America/Los_Angeles',
    '芝加哥': 'America/Chicago',
    '温哥华': 'America/Vancouver',
    '多伦多': 'America/Toronto',
    '墨西哥城': 'America/Mexico_City',
    '圣保罗': 'America/Sao_Paulo',
    '里约': 'America/Sao_Paulo',
    '布宜诺斯艾利斯': 'America/Argentina/Buenos_Aires',
    // 大洋洲
    '悉尼': 'Australia/Sydney',
    '墨尔本': 'Australia/Melbourne',
    '奥克兰': 'Pacific/Auckland',
    // 非洲
    '开罗': 'Africa/Cairo',
    '约翰内斯堡': 'Africa/Johannesburg',
    '拉各斯': 'Africa/Lagos'
  };

  // 查找匹配的时区
  let targetTimezone = null;
  let matchedCity = null;

  for (const [cityName, timezone] of Object.entries(timezoneMap)) {
    if (city.includes(cityName) || cityName.includes(city)) {
      targetTimezone = timezone;
      matchedCity = cityName;
      break;
    }
  }

  if (!targetTimezone) {
    return `抱歉，未能识别城市"${city}"的时区信息。目前支持的主要城市包括：纽约、伦敦、東京、巴黎、上海、香港、新加坡、悉尼等。如需添加更多城市，请提供具体城市名称。`;
  }

  // 获取当前时间
  const now = new Date();

  // 获取北京时间作为基准
  const beijingTime = now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // 获取目标城市时间
  const targetTime = now.toLocaleString('zh-CN', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long'
  });

  // 计算时差
  const beijingOffset = 8; // 北京时间UTC+8
  const targetOffset = getTimezoneOffset(targetTimezone);
  const timeDiff = targetOffset - beijingOffset;

  const diffText = timeDiff > 0 ? `快${timeDiff}小时` : timeDiff < 0 ? `慢${Math.abs(timeDiff)}小时` : '与北京时间相同';

  return `${matchedCity}时间：${targetTime}\n北京时间：${beijingTime}\n时差：${matchedCity}${diffText}\n\n注：以上时间基于系统时钟计算，可能存在轻微误差。`;
}

/**
 * 获取时区偏移量（小时）
 */
function getTimezoneOffset(timezone) {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return Math.round((targetDate - utcDate) / (1000 * 60 * 60));
}

/**
 * 处理通用搜索
 */
async function handleGeneralSearch(query, serperApiKey) {
  console.log(`[搜索API] 执行通用搜索: "${query}"`);

  try {
    // 调用Serper API
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        gl: 'cn', // 地理位置：中国
        hl: 'zh-cn', // 语言：中文
        num: 8 // 返回更多结果数量，提高完整性
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serper API请求失败: ${response.status} ${response.statusText}. 响应: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[搜索API] Serper API返回结果数量: ${data.organic ? data.organic.length : 0}`);

    if (!data.organic || data.organic.length === 0) {
      return `关于"${query}"的搜索未找到相关结果。可能是因为该主题较为专业或搜索词过于具体，建议尝试其他关键词或更通用的表述。`;
    }

    // 格式化搜索结果 - 优化格式便于LLM理解和引用
    const results = data.organic.slice(0, 8).map((result, index) => {
      const shortTitle = result.title ? result.title.substring(0, 50) + (result.title.length > 50 ? '...' : '') : '无标题';
      let formatted = `### 来源 ${index + 1}: ${shortTitle}\n`;
      formatted += `**完整标题**: ${result.title || '无标题'}\n`;

      if (result.snippet) {
        formatted += `**关键信息**: ${result.snippet}\n`;
      }

      if (result.link) {
        formatted += `**引用方式**: [查看原文](${result.link}) 或 根据[${shortTitle}](${result.link})的报道`;
      }

      return formatted;
    }).join('\n\n---\n\n');

    return results;

  } catch (error) {
    console.error('[搜索API] Serper API调用失败:', error);
    return `搜索"${query}"时遇到技术问题，请稍后再试。错误详情：${error.message}`;
  }
}