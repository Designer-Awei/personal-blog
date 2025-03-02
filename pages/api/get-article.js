/**
 * API路由，用于获取文章内容
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export default async function handler(req, res) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只允许GET请求' });
  }

  try {
    const { slug } = req.query;

    // 如果没有提供slug，返回错误
    if (!slug) {
      console.error('API: 缺少文章slug参数');
      return res.status(400).json({ message: '缺少文章slug参数' });
    }

    console.log('API: 请求获取文章，slug:', slug);

    // 动态导入fs、path和gray-matter模块
    const fs = await import('fs');
    const path = await import('path');
    const matter = await import('gray-matter').then(mod => mod.default || mod);

    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(process.cwd(), 'content', `${slug}.md`),
      path.join(process.cwd(), '.next/server/content', `${slug}.md`),
      path.join(process.cwd(), '.next/content', `${slug}.md`),
      path.join(process.cwd(), '../content', `${slug}.md`),
      path.join(process.cwd(), '../../content', `${slug}.md`),
      // 添加更多可能的路径
      path.join('/var/task/content', `${slug}.md`),
      path.join('/var/task/.next/server/content', `${slug}.md`),
      path.join('/var/task/.next/content', `${slug}.md`)
    ];
    
    // 输出当前工作目录和环境信息，帮助调试
    console.log('API: 当前工作目录:', process.cwd());
    console.log('API: NODE_ENV:', process.env.NODE_ENV);
    
    // 尝试列出content目录内容
    try {
      const contentDir = path.join(process.cwd(), 'content');
      if (fs.existsSync(contentDir)) {
        const files = fs.readdirSync(contentDir);
        console.log('API: content目录内容:', files);
      } else {
        console.log('API: content目录不存在');
      }
    } catch (err) {
      console.log('API: 无法列出content目录内容:', err.message);
    }
    
    let fileContents = null;
    let filePath = null;
    
    // 尝试从各个可能的路径读取文件
    for (const possiblePath of possiblePaths) {
      try {
        console.log('API: 尝试读取文件:', possiblePath);
        if (fs.existsSync(possiblePath)) {
          fileContents = fs.readFileSync(possiblePath, 'utf8');
          filePath = possiblePath;
          console.log('API: 成功从路径读取文件:', possiblePath);
          break;
        }
      } catch (err) {
        console.log('API: 无法从路径读取文件:', possiblePath, err.message);
      }
    }
    
    // 如果所有路径都失败，尝试从硬编码的内容中获取
    if (!fileContents) {
      console.log('API: 所有路径都无法找到文件，尝试使用硬编码内容');
      
      // 这里可以添加一些硬编码的文章内容，作为最后的备选方案
      const hardcodedContent = getHardcodedContent(slug);
      
      if (hardcodedContent) {
        console.log('API: 使用硬编码内容');
        return res.status(200).json(hardcodedContent);
      }
      
      console.error('API: 所有路径都无法找到文件，且没有硬编码内容:', slug);
      return res.status(404).json({ message: '文章不存在' });
    }

    console.log('API: 成功读取文件内容，长度:', fileContents.length);

    // 解析文章内容
    const { data, content } = matter(fileContents);
    console.log('API: 解析的文章元数据:', data);

    // 确保日期格式正确
    let formattedDate;
    try {
      formattedDate = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
    } catch (dateError) {
      console.error('API: 日期格式化错误:', dateError);
      formattedDate = new Date().toISOString();
    }

    // 返回文章数据
    return res.status(200).json({
      slug,
      title: data.title || slug,
      date: formattedDate,
      excerpt: data.excerpt || '',
      category: data.category || '未分类',
      coverImage: data.coverImage || null,
      content: content
    });
  } catch (error) {
    console.error('API: 获取文章数据时出错:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 获取硬编码的文章内容
 * @param {string} slug - 文章的slug
 * @returns {Object|null} - 文章数据或null
 */
function getHardcodedContent(slug) {
  // 硬编码所有文章内容，确保即使文件系统不可访问也能显示
  const hardcodedArticles = {
    'hello-world': {
      slug: 'hello-world',
      title: '你好，世界',
      date: new Date('2024-01-01').toISOString(),
      excerpt: '这是一篇示例文章',
      category: '示例',
      coverImage: null,
      content: '# 你好，世界\n\n这是一篇示例文章，用于测试。\n\n## 这是什么？\n\n这是一个备用的硬编码内容，确保即使在文件系统不可访问的情况下也能显示文章。\n\n## 为什么需要这个？\n\n在某些部署环境中，特别是无服务器环境，文件系统可能不可靠或不可访问，这个机制可以确保用户始终能看到内容。'
    },
    'article-1740754012046': {
      slug: 'article-1740754012046',
      title: '中国成功发射可重复使用试验航天器',
      date: new Date('2024-08-20').toISOString(),
      excerpt: '中国酒泉卫星发射中心成功发射一枚可重复使用的试验航天器，标志着中国航天科技在重复使用技术方面取得重大进展。',
      category: '新闻',
      coverImage: null,
      content: '# 中国成功发射可重复使用试验航天器\n\n中国酒泉卫星发射中心成功发射一枚可重复使用的试验航天器，标志着中国航天科技在重复使用技术方面取得重大进展。\n\n## 技术突破\n\n这次发射使用了多项创新技术，包括先进的热防护系统、精确的着陆控制系统以及可重复使用的发动机技术。\n\n## 意义\n\n可重复使用航天器的成功发射将大大降低未来航天任务的成本，提高航天活动的频率，为中国航天事业的发展开辟新的道路。'
    },
    'article-2': {
      slug: 'article-2',
      title: '人工智能在医疗领域的应用',
      date: new Date('2024-07-15').toISOString(),
      excerpt: '人工智能技术正在医疗领域发挥越来越重要的作用，从疾病诊断到药物研发，AI正在改变医疗行业。',
      category: '科技',
      coverImage: null,
      content: '# 人工智能在医疗领域的应用\n\n人工智能技术正在医疗领域发挥越来越重要的作用，从疾病诊断到药物研发，AI正在改变医疗行业。\n\n## 疾病诊断\n\nAI系统能够分析大量医学图像，帮助医生更准确地诊断疾病。例如，在放射学领域，AI可以检测CT和MRI扫描中的异常情况。\n\n## 药物研发\n\n人工智能正在加速药物研发过程，通过分析分子结构和预测药物效果，大大缩短了新药开发的时间。'
    },
    'article-3': {
      slug: 'article-3',
      title: '可持续发展与环境保护',
      date: new Date('2024-06-05').toISOString(),
      excerpt: '随着气候变化的加剧，可持续发展和环境保护变得越来越重要，各国正在采取措施减少碳排放。',
      category: '环境',
      coverImage: null,
      content: '# 可持续发展与环境保护\n\n随着气候变化的加剧，可持续发展和环境保护变得越来越重要，各国正在采取措施减少碳排放。\n\n## 全球行动\n\n《巴黎协定》是全球应对气候变化的重要框架，各国承诺减少温室气体排放，限制全球温度上升。\n\n## 个人贡献\n\n每个人都可以通过减少能源消耗、使用可再生能源、减少浪费等方式为环境保护做出贡献。'
    },
    'article-4': {
      slug: 'article-4',
      title: '数字货币的发展与挑战',
      date: new Date('2024-05-20').toISOString(),
      excerpt: '数字货币正在全球范围内快速发展，各国央行和私人机构都在探索这一领域。',
      category: '金融',
      coverImage: null,
      content: '# 数字货币的发展与挑战\n\n数字货币正在全球范围内快速发展，各国央行和私人机构都在探索这一领域。\n\n## 央行数字货币\n\n多个国家的中央银行正在研发自己的数字货币，中国的数字人民币已经在多个城市进行试点。\n\n## 挑战与风险\n\n数字货币面临的挑战包括安全问题、隐私保护、监管框架等，需要各方共同努力解决。'
    },
    'article-5': {
      slug: 'article-5',
      title: '远程工作的未来趋势',
      date: new Date('2024-04-10').toISOString(),
      excerpt: '疫情加速了远程工作的普及，越来越多的公司正在采用混合工作模式。',
      category: '职场',
      coverImage: null,
      content: '# 远程工作的未来趋势\n\n疫情加速了远程工作的普及，越来越多的公司正在采用混合工作模式。\n\n## 技术支持\n\n视频会议、协作工具和云服务等技术为远程工作提供了强大支持，使团队成员能够无缝协作。\n\n## 工作生活平衡\n\n远程工作为员工提供了更大的灵活性，有助于改善工作生活平衡，提高工作满意度。'
    },
    'article-6': {
      slug: 'article-6',
      title: '5G技术与物联网发展',
      date: new Date('2024-03-15').toISOString(),
      excerpt: '5G技术的商用部署正在推动物联网的快速发展，为智能城市和工业4.0提供支持。',
      category: '科技',
      coverImage: null,
      content: '# 5G技术与物联网发展\n\n5G技术的商用部署正在推动物联网的快速发展，为智能城市和工业4.0提供支持。\n\n## 高速连接\n\n5G网络提供了更高的速度、更低的延迟和更大的容量，使得大规模物联网设备的连接成为可能。\n\n## 应用场景\n\n从智能家居到自动驾驶，从远程医疗到智能制造，5G和物联网正在改变各个行业。'
    },
    'article-7': {
      slug: 'article-7',
      title: '健康饮食与营养科学',
      date: new Date('2024-02-20').toISOString(),
      excerpt: '科学的饮食习惯对健康至关重要，了解营养科学可以帮助我们做出更好的食物选择。',
      category: '健康',
      coverImage: null,
      content: '# 健康饮食与营养科学\n\n科学的饮食习惯对健康至关重要，了解营养科学可以帮助我们做出更好的食物选择。\n\n## 均衡饮食\n\n均衡的饮食应包含适量的蛋白质、碳水化合物、健康脂肪、维生素和矿物质。\n\n## 个性化营养\n\n每个人的身体状况和需求不同，个性化的营养方案可以更好地满足个体健康需求。'
    },
    'article-8': {
      slug: 'article-8',
      title: '太空探索的新时代',
      date: new Date('2024-01-25').toISOString(),
      excerpt: '私人航天公司的崛起和国际合作正在推动太空探索进入新的时代。',
      category: '科学',
      coverImage: null,
      content: '# 太空探索的新时代\n\n私人航天公司的崛起和国际合作正在推动太空探索进入新的时代。\n\n## 商业航天\n\nSpaceX、Blue Origin等私人航天公司正在降低进入太空的成本，推动太空商业化发展。\n\n## 深空探测\n\n人类正在计划重返月球并最终前往火星，开展更深入的太空探索任务。'
    },
    'healthy-lifestyle': {
      slug: 'healthy-lifestyle',
      title: '健康生活方式指南',
      date: new Date('2023-12-10').toISOString(),
      excerpt: '健康的生活方式包括均衡饮食、规律运动和充足睡眠，对预防疾病和提高生活质量至关重要。',
      category: '健康',
      coverImage: null,
      content: '# 健康生活方式指南\n\n健康的生活方式包括均衡饮食、规律运动和充足睡眠，对预防疾病和提高生活质量至关重要。\n\n## 饮食建议\n\n- 增加蔬果摄入\n- 减少加工食品\n- 控制糖和盐的摄入\n- 保持水分充足\n\n## 运动计划\n\n每周至少进行150分钟中等强度的有氧运动，同时进行肌肉强化训练。\n\n## 睡眠质量\n\n保持规律的睡眠时间，成年人每晚应睡7-9小时。'
    },
    'mindfulness-meditation': {
      slug: 'mindfulness-meditation',
      title: '正念冥想的益处与实践',
      date: new Date('2023-11-15').toISOString(),
      excerpt: '正念冥想是一种古老而有效的减压技术，可以帮助改善心理健康和提高专注力。',
      category: '心理健康',
      coverImage: null,
      content: '# 正念冥想的益处与实践\n\n正念冥想是一种古老而有效的减压技术，可以帮助改善心理健康和提高专注力。\n\n## 科学证明的益处\n\n- 减轻压力和焦虑\n- 改善注意力和集中力\n- 增强情绪调节能力\n- 提高睡眠质量\n\n## 基础练习方法\n\n1. 找一个安静的地方，采取舒适的坐姿\n2. 闭上眼睛，关注呼吸\n3. 当注意力wandering时，温和地将其带回呼吸\n4. 每天练习10-20分钟'
    },
    'photography-tips': {
      slug: 'photography-tips',
      title: '摄影技巧：捕捉完美瞬间',
      date: new Date('2023-10-20').toISOString(),
      excerpt: '无论是使用专业相机还是智能手机，掌握一些基本的摄影技巧可以帮助你拍出更好的照片。',
      category: '摄影',
      coverImage: null,
      content: '# 摄影技巧：捕捉完美瞬间\n\n无论是使用专业相机还是智能手机，掌握一些基本的摄影技巧可以帮助你拍出更好的照片。\n\n## 构图原则\n\n- 三分法则：将画面分为九等份，将主体放在交叉点上\n- 引导线：使用自然线条引导观众的视线\n- 框架：使用自然元素为主体创建框架\n\n## 光线运用\n\n光线是摄影的灵魂，学会利用不同时间和角度的光线可以创造出不同的效果。\n\n## 后期处理\n\n适当的后期处理可以提升照片的质量，但要避免过度编辑导致照片不自然。'
    },
    'productivity-tips': {
      slug: 'productivity-tips',
      title: '提高工作效率的实用技巧',
      date: new Date('2023-09-05').toISOString(),
      excerpt: '在当今快节奏的工作环境中，提高效率对于完成任务和减轻压力至关重要。',
      category: '职场',
      coverImage: null,
      content: '# 提高工作效率的实用技巧\n\n在当今快节奏的工作环境中，提高效率对于完成任务和减轻压力至关重要。\n\n## 时间管理\n\n- 使用番茄工作法：25分钟专注工作，然后休息5分钟\n- 优先处理重要且紧急的任务\n- 将大任务分解为小步骤\n\n## 工作环境\n\n创造一个有利于专注的工作环境，减少干扰和噪音。\n\n## 工具利用\n\n利用各种生产力工具和应用程序帮助管理任务、记录想法和协作。'
    },
    'reading-benefits': {
      slug: 'reading-benefits',
      title: '阅读的多重益处',
      date: new Date('2023-08-12').toISOString(),
      excerpt: '阅读不仅是获取知识的途径，还能提高认知能力、减轻压力并促进心理健康。',
      category: '教育',
      coverImage: null,
      content: '# 阅读的多重益处\n\n阅读不仅是获取知识的途径，还能提高认知能力、减轻压力并促进心理健康。\n\n## 认知益处\n\n- 增强词汇量和语言能力\n- 提高专注力和记忆力\n- 发展批判性思维\n\n## 心理益处\n\n- 减轻压力和焦虑\n- 提供逃避现实的途径\n- 增强同理心\n\n## 养成阅读习惯\n\n每天抽出固定时间阅读，从短篇开始，逐渐增加阅读量。'
    },
    'travel-tips': {
      slug: 'travel-tips',
      title: '旅行小贴士：让旅程更加顺畅',
      date: new Date('2023-07-18').toISOString(),
      excerpt: '无论是短途旅行还是长途旅行，一些实用的技巧可以帮助你避免常见问题，让旅程更加愉快。',
      category: '旅行',
      coverImage: null,
      content: '# 旅行小贴士：让旅程更加顺畅\n\n无论是短途旅行还是长途旅行，一些实用的技巧可以帮助你避免常见问题，让旅程更加愉快。\n\n## 行前准备\n\n- 研究目的地的文化、天气和交通\n- 准备必要的文件和复印件\n- 提前预订住宿和主要景点门票\n\n## 打包技巧\n\n- 使用打包清单避免遗漏\n- 选择多功能、易干的衣物\n- 将贵重物品放在随身行李中\n\n## 旅行中的安全\n\n保持警惕，了解当地紧急联系方式，购买旅行保险。'
    },
    'web-development': {
      slug: 'web-development',
      title: 'Web开发趋势与最佳实践',
      date: new Date('2023-06-25').toISOString(),
      excerpt: 'Web开发领域不断发展，了解最新趋势和最佳实践对于创建现代、高效的网站至关重要。',
      category: '技术',
      coverImage: null,
      content: '# Web开发趋势与最佳实践\n\nWeb开发领域不断发展，了解最新趋势和最佳实践对于创建现代、高效的网站至关重要。\n\n## 前端趋势\n\n- 组件化开发：React、Vue等框架的普及\n- 渐进式Web应用（PWA）：提供类似原生应用的体验\n- 无头CMS：内容与展示分离\n\n## 性能优化\n\n- 图片优化和懒加载\n- 代码分割和按需加载\n- 缓存策略\n\n## 安全考虑\n\n实施HTTPS、防止XSS和CSRF攻击、定期更新依赖包。'
    }
  };
  
  return hardcodedArticles[slug] || null;
} 