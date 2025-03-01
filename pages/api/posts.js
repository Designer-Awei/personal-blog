import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只支持GET请求' });
  }

  try {
    console.log('API: 获取文章列表');
    const posts = [];
    
    // 从统一的content目录获取文章
    const contentDirectory = path.join(process.cwd(), 'content');
    
    console.log(`API: 文章目录路径: ${contentDirectory}`);
    
    // 确保目录存在
    if (!fs.existsSync(contentDirectory)) {
      console.log('API: content目录不存在，返回空数组');
      return res.status(200).json([]);
    }
    
    const files = fs.readdirSync(contentDirectory);
    console.log(`API: 找到 ${files.length} 个文件`);
    
    files.forEach(filename => {
      if (!filename.endsWith('.md')) return;
      
      const slug = filename.replace('.md', '');
      const markdownWithMeta = fs.readFileSync(
        path.join(contentDirectory, filename),
        'utf-8'
      );
      
      const { data: frontmatter } = matter(markdownWithMeta);
      
      posts.push({
        slug,
        title: frontmatter.title || slug,
        date: frontmatter.date || new Date().toISOString(),
        excerpt: frontmatter.excerpt || '',
        category: frontmatter.category || '未分类',
        coverImage: frontmatter.coverImage || null
      });
    });
    
    // 按日期排序
    const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`API: 返回 ${sortedPosts.length} 篇文章`);
    return res.status(200).json(sortedPosts);
  } catch (error) {
    console.error('API: 获取文章列表时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 