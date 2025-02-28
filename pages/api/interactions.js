import { toggleLike, toggleFavorite, getUserInteractions } from '../../lib/userConfig';

export default async function handler(req, res) {
  // GET请求 - 获取互动数据
  if (req.method === 'GET') {
    const interactions = getUserInteractions();
    return res.status(200).json(interactions);
  }
  
  // POST请求 - 更新互动状态
  if (req.method === 'POST') {
    const { action, slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ message: '缺少文章标识符' });
    }
    
    if (action === 'like') {
      const result = toggleLike(slug);
      return res.status(200).json(result);
    }
    
    if (action === 'favorite') {
      const result = toggleFavorite(slug);
      return res.status(200).json(result);
    }
    
    return res.status(400).json({ message: '不支持的操作类型' });
  }
  
  // 不支持的方法
  return res.status(405).json({ message: '不支持的请求方法' });
} 