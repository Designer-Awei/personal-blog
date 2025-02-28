import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

// 禁用默认的bodyParser，以便我们可以使用formidable解析表单数据
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 解析表单数据
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
    });

    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('解析表单数据时出错:', err);
          res.status(500).json({ message: '上传失败', error: err.message });
          return resolve();
        }

        const file = files.image;
        if (!file) {
          res.status(400).json({ message: '没有找到图片文件' });
          return resolve();
        }

        // 生成唯一的文件名
        const timestamp = Date.now();
        const originalFilename = file.originalFilename || 'image.jpg';
        const fileExtension = path.extname(originalFilename);
        const newFilename = `image-${timestamp}${fileExtension}`;
        
        // 移动文件到最终位置
        const finalPath = path.join(uploadDir, newFilename);
        fs.renameSync(file.filepath, finalPath);
        
        // 返回图片URL
        const imageUrl = `/uploads/${newFilename}`;
        res.status(200).json({ 
          message: '上传成功', 
          imageUrl 
        });
        
        return resolve();
      });
    });
  } catch (error) {
    console.error('上传图片时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 