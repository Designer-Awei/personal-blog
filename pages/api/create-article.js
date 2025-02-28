import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    const { title, content, excerpt, date, slug, category } = req.body;
    
    if (!title || !content || !slug) {
      return res.status(400).json({ message: '缺少必要的文章信息' });
    }

    // 确保posts目录存在
    const postsDir = path.join(process.cwd(), 'posts');
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // 检查slug是否已存在
    const existingFiles = fs.readdirSync(postsDir);
    const slugExists = existingFiles.some(file => file === `${slug}.md`);
    
    // 如果slug已存在，生成一个唯一的slug
    let uniqueSlug = slug;
    if (slugExists) {
      uniqueSlug = `${slug}-${Date.now()}`;
    }

    // 构建文章的frontmatter
    const frontmatter = {
      title,
      date,
      excerpt: excerpt || title,
      category: category || '未分类'
    };

    // 使用gray-matter格式化文章内容
    const articleContent = matter.stringify(content, frontmatter);
    
    // 保存文件
    const filePath = path.join(postsDir, `${uniqueSlug}.md`);
    fs.writeFileSync(filePath, articleContent, 'utf8');

    return res.status(200).json({ 
      success: true, 
      message: '文章创建成功',
      slug: uniqueSlug
    });
  } catch (error) {
    console.error('创建文章时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 