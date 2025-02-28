import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    const { slug, title, content, excerpt, date } = req.body;
    
    if (!slug || !title || !content) {
      return res.status(400).json({ message: '缺少必要的文章信息' });
    }

    // 构建文章的frontmatter
    const frontmatter = {
      title,
      date,
      excerpt
    };

    // 使用gray-matter格式化文章内容
    const articleContent = matter.stringify(content, frontmatter);
    
    // 保存文件
    const filePath = path.join(process.cwd(), 'markdown', `${slug}.md`);
    fs.writeFileSync(filePath, articleContent, 'utf8');

    return res.status(200).json({ 
      success: true, 
      message: '文章保存成功'
    });
  } catch (error) {
    console.error('保存文章时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 