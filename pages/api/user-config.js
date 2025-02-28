import { getUserConfig, updateUserConfig, updateProfileImage } from '../../lib/userConfig';

export default async function handler(req, res) {
  // GET请求 - 获取用户配置
  if (req.method === 'GET') {
    const config = getUserConfig();
    
    if (!config) {
      return res.status(500).json({ message: '无法获取用户配置' });
    }
    
    return res.status(200).json(config);
  }
  
  // POST请求 - 更新用户配置
  if (req.method === 'POST') {
    const { profileImage, ...otherConfig } = req.body;
    
    // 如果有头像更新
    if (profileImage) {
      const success = updateProfileImage(profileImage);
      if (!success) {
        return res.status(500).json({ message: '更新头像失败' });
      }
    }
    
    // 如果有其他配置更新
    if (Object.keys(otherConfig).length > 0) {
      const success = updateUserConfig(otherConfig);
      if (!success) {
        return res.status(500).json({ message: '更新配置失败' });
      }
    }
    
    return res.status(200).json({ success: true });
  }
  
  // 不支持的方法
  return res.status(405).json({ message: '不支持的请求方法' });
} 