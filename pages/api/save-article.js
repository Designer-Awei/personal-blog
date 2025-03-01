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
 * 保存文章API处理函数
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
      message: '在Vercel环境中暂不支持编辑文章功能',
      isVercel: true
    });
  }

  try {
    console.log("收到保存文章请求:", req.body);
    const { slug, title, content, excerpt, date, category, coverImage } = req.body;
    
    if (!slug || !title || !content) {
      console.log("缺少必要信息:", { slug, title, content: !!content });
      return res.status(400).json({ message: '缺少必要的文章信息' });
    }
    
    // 使用正确的文章目录 - content
    const contentDirectory = path.join(process.cwd(), 'content');
    const filePath = path.join(contentDirectory, `${slug}.md`);
    
    console.log(`尝试保存文章到: ${filePath}`);
    
    // 确保content目录存在
    if (!fs.existsSync(contentDirectory)) {
      console.log(`创建content目录: ${contentDirectory}`);
      fs.mkdirSync(contentDirectory, { recursive: true });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      return res.status(404).json({ message: '文章不存在' });
    }
    
    // 构建frontmatter
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
    
    // 保留原始Markdown内容，不进行任何处理
    // 使用gray-matter格式化内容，保留原始Markdown格式
    const fileContent = matter.stringify(content, frontmatter);
    
    // 写入文件
    try {
      fs.writeFileSync(filePath, fileContent, 'utf8');
      console.log(`文章保存成功: ${slug}`);
      
      // 读取保存后的文件内容，确认格式正确
      const savedContent = fs.readFileSync(filePath, 'utf8');
      const parsedContent = matter(savedContent);
      console.log(`保存后的文章内容长度: ${parsedContent.content.length}`);
      
    } catch (writeError) {
      console.error(`写入文件失败: ${writeError.message}`);
      return res.status(500).json({ 
        success: false,
        message: '写入文件失败', 
        error: writeError.message 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: '文章保存成功',
      slug
    });
  } catch (error) {
    console.error('保存文章时出错:', error);
    return res.status(500).json({ 
      success: false,
      message: '服务器错误', 
      error: error.message 
    });
  }
} 