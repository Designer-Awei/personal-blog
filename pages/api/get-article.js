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
      path.join(process.cwd(), '../../content', `${slug}.md`)
    ];
    
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
    
    // 如果所有路径都失败，则返回404
    if (!fileContents) {
      console.error('API: 所有路径都无法找到文件:', slug);
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