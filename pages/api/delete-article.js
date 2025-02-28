import fs from 'fs';
import path from 'path';
import { getUserConfig, updateUserConfig } from '../../lib/userConfig';

export default async function handler(req, res) {
  // 只允许DELETE请求
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: '只支持DELETE请求' });
  }

  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).json({ message: '缺少文章标识符' });
  }

  try {
    // 文章文件路径
    const filePath = path.join(process.cwd(), 'markdown', `${slug}.md`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    // 从用户交互数据中移除该文章的点赞和收藏记录
    const userConfig = getUserConfig();
    
    // 更新点赞列表
    if (userConfig.liked && userConfig.liked.includes(slug)) {
      userConfig.liked = userConfig.liked.filter(item => item !== slug);
    }
    
    // 更新收藏列表
    if (userConfig.favorited && userConfig.favorited.includes(slug)) {
      userConfig.favorited = userConfig.favorited.filter(item => item !== slug);
    }
    
    // 保存更新后的用户配置
    updateUserConfig(userConfig);
    
    return res.status(200).json({ 
      success: true, 
      message: '文章已成功删除' 
    });
  } catch (error) {
    console.error('删除文章时出错:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误，删除文章失败', 
      error: error.message 
    });
  }
} 