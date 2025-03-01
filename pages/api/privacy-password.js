import fs from 'fs';
import path from 'path';

/**
 * 获取密码文件路径
 * @returns {string} 密码文件路径
 */
function getPasswordFilePath() {
  return path.join(process.cwd(), 'privacy-password.json');
}

/**
 * 检查环境是否为Vercel生产环境
 * @returns {boolean} 是否为Vercel生产环境
 */
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL === '1';
}

/**
 * 隐私密码API处理函数
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
export default function handler(req, res) {
  // 获取密码
  if (req.method === 'GET') {
    try {
      // 在Vercel环境中使用默认密码
      if (isVercelProduction()) {
        return res.status(200).json({ password: '123456' });
      }

      const passwordFilePath = getPasswordFilePath();
      
      // 如果密码文件不存在，创建默认密码
      if (!fs.existsSync(passwordFilePath)) {
        fs.writeFileSync(passwordFilePath, JSON.stringify({ password: '123456' }, null, 2));
        return res.status(200).json({ password: '123456' });
      }
      
      // 读取密码文件
      const passwordData = fs.readFileSync(passwordFilePath, 'utf8');
      const { password } = JSON.parse(passwordData);
      
      return res.status(200).json({ password });
    } catch (error) {
      console.error('获取密码时出错:', error);
      return res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }
  
  // 更新密码
  if (req.method === 'POST') {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: '密码不能为空' });
      }
      
      // 在Vercel环境中不允许更新密码
      if (isVercelProduction()) {
        return res.status(403).json({ message: 'Vercel环境不支持更新密码' });
      }
      
      const passwordFilePath = getPasswordFilePath();
      
      // 更新密码文件
      fs.writeFileSync(passwordFilePath, JSON.stringify({ password }, null, 2));
      
      return res.status(200).json({ message: '密码更新成功' });
    } catch (error) {
      console.error('更新密码时出错:', error);
      return res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }
  
  // 不支持的方法
  return res.status(405).json({ message: '不支持的请求方法' });
} 