import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只支持GET请求' });
  }

  try {
    const postsDirectory = path.join(process.cwd(), 'posts');
    
    // 确保目录存在
    if (!fs.existsSync(postsDirectory)) {
      return res.status(200).json([]);
    }
    
    const files = fs.readdirSync(postsDirectory);
    
    const posts = files.map(filename => {
      const slug = filename.replace('.md', '');
      const markdownWithMeta = fs.readFileSync(
        path.join(postsDirectory, filename),
        'utf-8'
      );
      
      const { data: frontmatter } = matter(markdownWithMeta);
      
      return {
        slug,
        title: frontmatter.title,
        date: frontmatter.date,
        excerpt: frontmatter.excerpt,
        category: frontmatter.category || '未分类'
      };
    });
    
    // 按日期排序
    const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.status(200).json(sortedPosts);
  } catch (error) {
    console.error('获取文章列表时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 