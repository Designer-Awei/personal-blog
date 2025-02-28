import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === 'GET') {
    try {
      const markdownDir = path.join(process.cwd(), 'markdown');
      const filePath = path.join(markdownDir, `${slug}.md`);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: '文章不存在' });
      }
      
      const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(markdownWithMeta);
      
      return res.status(200).json({
        slug,
        frontmatter,
        content
      });
    } catch (error) {
      console.error('获取文章时出错:', error);
      return res.status(500).json({ message: '服务器错误', error: error.message });
    }
  } else {
    return res.status(405).json({ message: '只支持GET请求' });
  }
} 