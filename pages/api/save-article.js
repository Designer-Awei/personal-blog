import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    const { slug, title, content, excerpt, date, category, coverImage } = req.body;
    
    if (!slug || !title || !content) {
      return res.status(400).json({ message: '缺少必要的文章信息' });
    }
    
    // 修改为正确的文章目录
    const postsDirectory = path.join(process.cwd(), 'posts');
    const filePath = path.join(postsDirectory, `${slug}.md`);
    
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
    
    // 使用gray-matter格式化内容
    const fileContent = matter.stringify(content, frontmatter);
    
    // 写入文件
    fs.writeFileSync(filePath, fileContent);
    
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