import fs from 'fs';
import path from 'path';

/**
 * 列出封面图片API处理函数
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只支持GET请求' });
  }

  try {
    // 封面图片目录路径
    const coverImagesDir = path.join(process.cwd(), 'public', 'images', 'covers');
    
    // 确保目录存在
    if (!fs.existsSync(coverImagesDir)) {
      fs.mkdirSync(coverImagesDir, { recursive: true });
      return res.status(200).json({ images: [] });
    }
    
    // 读取目录中的所有文件
    const files = fs.readdirSync(coverImagesDir);
    
    // 过滤出图片文件（根据扩展名）
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // 构建图片信息数组
    const images = imageFiles.map(file => {
      const filePath = `/images/covers/${file}`;
      return {
        name: file,
        path: filePath,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}${filePath}`
      };
    });
    
    // 按照文件名排序
    images.sort((a, b) => a.name.localeCompare(b.name));
    
    return res.status(200).json({ images });
  } catch (error) {
    console.error('获取封面图片列表时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 