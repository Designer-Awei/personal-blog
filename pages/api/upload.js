import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: '没有提供图片数据' });
    }

    // 从base64数据中提取图片数据
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 确保目录存在
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 生成文件名并保存
    const fileName = `profile-${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, buffer);

    // 返回图片URL
    return res.status(200).json({ 
      success: true, 
      imageUrl: `/uploads/${fileName}` 
    });
  } catch (error) {
    console.error('上传图片时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 