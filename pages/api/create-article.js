import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * 检查环境是否为Vercel生产环境
 * @returns {boolean} 是否为Vercel生产环境
 */
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL === '1';
}

/**
 * 创建文章API处理函数
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  // 检查是否在Vercel环境中
  if (isVercelProduction()) {
    return res.status(403).json({ 
      message: '在Vercel环境中暂不支持新增文章功能',
      isVercel: true
    });
  }

  try {
    console.log("收到创建文章请求:", req.body);
    const { title, content, excerpt, date, slug, category, coverImage } = req.body;
    
    if (!title || !content || !slug) {
      console.log("缺少必要信息:", { title, content, slug });
      return res.status(400).json({ message: '缺少必要的文章信息' });
    }

    // 确保posts目录存在
    const postsDir = path.join(process.cwd(), 'posts');
    
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // 检查slug是否已存在
    let existingFiles = [];
    try {
      existingFiles = fs.readdirSync(postsDir);
    } catch (error) {
      console.error('读取文章目录失败:', error);
      // 继续执行，不阻止创建文章
    }
    
    // 如果slug已存在，生成一个唯一的slug
    let uniqueSlug = slug;
    if (existingFiles.some(file => file === `${slug}.md`)) {
      uniqueSlug = `${slug}-${Date.now()}`;
    }

    // 构建文章的frontmatter
    const frontmatter = {
      title,
      date,
      excerpt: excerpt || title,
      category: category || '未分类'
    };
    
    // 如果有封面图片，添加到frontmatter
    if (coverImage) {
      frontmatter.coverImage = coverImage;
    }

    // 将普通文本内容转换为适合保存的格式
    // 对于普通文本，我们将其包装在一个段落中
    const formattedContent = content.split('\n\n').map(paragraph => paragraph.trim()).filter(Boolean).join('\n\n');
    
    // 使用gray-matter格式化文章内容
    const articleContent = matter.stringify(formattedContent, frontmatter);
    
    // 保存文件
    const filePath = path.join(postsDir, `${uniqueSlug}.md`);
    
    try {
      fs.writeFileSync(filePath, articleContent, 'utf8');
      console.log("文章创建成功:", uniqueSlug);
      
      return res.status(200).json({ 
        success: true, 
        message: '文章创建成功',
        slug: uniqueSlug
      });
    } catch (writeError) {
      console.error('写入文章文件失败:', writeError);
      return res.status(500).json({ 
        message: '写入文章文件失败', 
        error: writeError.message
      });
    }
  } catch (error) {
    console.error('创建文章时出错:', error);
    return res.status(500).json({ 
      message: '服务器错误', 
      error: error.message,
      stack: error.stack
    });
  }
} 