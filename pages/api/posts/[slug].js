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
        content: contentHtml,
        isVercel: true
      });
    }
    
    // 常规环境下从文件系统读取
    const postsDir = path.join(process.cwd(), 'posts');
    const filePath = path.join(postsDir, `${slug}.md`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
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
      content: contentHtml
    });
  } catch (error) {
    console.error('获取文章时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 