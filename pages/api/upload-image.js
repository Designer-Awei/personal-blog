import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

// 禁用默认的bodyParser，以便我们可以使用formidable解析表单数据
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * 处理图片上传的API
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 * @returns {Promise} 处理结果
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    // 确保封面图片目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'covers');
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

        // 检查文件是否存在
        const file = files.image;
        if (!file || !file[0]) {
          res.status(400).json({ message: '没有找到图片文件' });
          return resolve();
        }

        try {
          // 获取第一个文件
          const uploadedFile = file[0];
          
          // 生成唯一的文件名
          const timestamp = Date.now();
          const originalFilename = uploadedFile.originalFilename || 'image.jpg';
          const fileExtension = path.extname(originalFilename);
          const newFilename = `cover-${timestamp}${fileExtension}`;
          
          // 移动文件到最终位置
          const finalPath = path.join(uploadDir, newFilename);
          
          // 检查filepath是否存在
          if (!uploadedFile.filepath) {
            throw new Error('文件路径不存在');
          }
          
          // 复制文件而不是重命名，避免跨设备问题
          fs.copyFileSync(uploadedFile.filepath, finalPath);
          
          // 尝试删除临时文件
          try {
            fs.unlinkSync(uploadedFile.filepath);
          } catch (unlinkErr) {
            console.error('删除临时文件失败:', unlinkErr);
            // 继续执行，不中断流程
          }
          
          // 返回图片URL
          const imageUrl = `/images/covers/${newFilename}`;
          res.status(200).json({ 
            message: '上传成功', 
            imageUrl 
          });
        } catch (fileError) {
          console.error('处理文件时出错:', fileError);
          res.status(500).json({ message: '处理文件失败', error: fileError.message });
        }
        
        return resolve();
      });
    });
  } catch (error) {
    console.error('上传图片时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 