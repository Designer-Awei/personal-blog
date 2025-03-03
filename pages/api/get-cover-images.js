import fs from 'fs';
import path from 'path';

/**
 * 获取封面图片列表API
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
    
    // 构建图片URL列表
    const images = imageFiles.map(file => ({
      name: file,
      url: `/images/covers/${file}`
    }));
    
    // 返回图片列表
    return res.status(200).json({ images });
  } catch (error) {
    console.error('获取封面图片列表时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 