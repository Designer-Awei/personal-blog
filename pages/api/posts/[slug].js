import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

/**
 * 检查环境是否为Vercel生产环境
 * @returns {boolean} 是否为Vercel生产环境
 */
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL === '1';
}

/**
 * 获取文章内容
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
export default async function handler(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).json({ message: '缺少文章标识符' });
  }
  
  try {
    console.log(`API: 尝试获取文章 ${slug}`);
    
    // 在Vercel环境中，尝试从客户端传递的数据中获取文章内容
    if (isVercelProduction() && req.method === 'POST' && req.body && req.body.articleContent) {
      const { articleContent } = req.body;
      
      // 解析文章内容
      const { data, content } = matter(articleContent);
      
      // 将Markdown转换为HTML
      const processedContent = await remark()
        .use(html)
        .process(content);
      const contentHtml = processedContent.toString();
      
      return res.status(200).json({
        slug,
        title: data.title,
        date: data.date,
        excerpt: data.excerpt || '',
        category: data.category || '未分类',
        coverImage: data.coverImage || null,
        content: content, // 返回原始Markdown内容
        contentHtml: contentHtml, // 同时返回HTML内容
        isVercel: true
      });
    }
    
    // 从content目录读取文章
    const contentDir = path.join(process.cwd(), 'content');
    const filePath = path.join(contentDir, `${slug}.md`);
    
    console.log(`API: 尝试从文件读取: ${filePath}`);
    
    // 检查content目录是否存在
    if (!fs.existsSync(contentDir)) {
      console.log(`API: content目录不存在: ${contentDir}`);
      return res.status(404).json({ message: '文章目录不存在' });
    }
    
    // 如果文件不存在，返回404
    if (!fs.existsSync(filePath)) {
      console.log(`API: 文件不存在: ${filePath}`);
      return res.status(404).json({ message: '文章不存在' });
    }
    
    // 读取文件内容
    let fileContents;
    try {
      fileContents = fs.readFileSync(filePath, 'utf8');
      console.log(`API: 成功读取文件: ${filePath}`);
    } catch (readError) {
      console.error(`API: 读取文件失败: ${readError.message}`);
      return res.status(500).json({ message: '读取文件失败', error: readError.message });
    }
    
    // 解析文章内容
    let data, content;
    try {
      const parsed = matter(fileContents);
      data = parsed.data;
      content = parsed.content;
      console.log(`API: 成功解析文章内容，内容长度: ${content.length}`);
    } catch (parseError) {
      console.error(`API: 解析文章内容失败: ${parseError.message}`);
      return res.status(500).json({ message: '解析文章内容失败', error: parseError.message });
    }
    
    // 将Markdown转换为HTML
    let contentHtml;
    try {
      const processedContent = await remark()
        .use(html)
        .process(content);
      contentHtml = processedContent.toString();
      console.log(`API: 成功转换Markdown为HTML`);
    } catch (markdownError) {
      console.error(`API: 转换Markdown失败: ${markdownError.message}`);
      return res.status(500).json({ message: '转换Markdown失败', error: markdownError.message });
    }
    
    console.log(`API: 成功获取文章: ${slug}`);
    
    return res.status(200).json({
      slug,
      title: data.title || slug,
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || '',
      category: data.category || '未分类',
      coverImage: data.coverImage || null,
      content: content, // 返回原始Markdown内容
      contentHtml: contentHtml // 同时返回HTML内容，用于显示
    });
  } catch (error) {
    console.error('API: 获取文章时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 