import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { isVercelEnvironment } from '../../lib/utils';

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
  if (isVercelEnvironment()) {
    return res.status(403).json({ 
      message: '在Vercel环境中暂不支持编辑文章功能',
      isVercel: true
    });
  }

  try {
    const { slug, title, content, excerpt, date, category, coverImage } = req.body;
    
    if (!slug || !title || !content) {
      return res.status(400).json({ message: '缺少必要的文章信息' });
    }
    
    // 使用正确的文章目录 - content
    const contentDirectory = path.join(process.cwd(), 'content');
    const filePath = path.join(contentDirectory, `${slug}.md`);
    
    // 确保content目录存在
    if (!fs.existsSync(contentDirectory)) {
      fs.mkdirSync(contentDirectory, { recursive: true });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
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
    
    // 使用gray-matter格式化内容，保留原始Markdown格式
    const fileContent = matter.stringify(content, frontmatter);
    
    // 写入文件
    try {
      fs.writeFileSync(filePath, fileContent, 'utf8');
    } catch (writeError) {
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
    return res.status(500).json({ 
      success: false,
      message: '服务器错误', 
      error: error.message 
    });
  }
} 