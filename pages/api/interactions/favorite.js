import fs from 'fs';
import path from 'path';

const INTERACTIONS_FILE = path.join(process.cwd(), 'data', 'interactions.json');

// 确保配置目录存在
function ensureConfigDir() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('创建数据目录失败:', error);
    return false;
  }
}

// 获取用户互动数据
function getUserInteractions() {
  if (!ensureConfigDir()) {
    console.error('无法确保数据目录存在');
    return { like: [], favorite: [] };
  }
  
  if (!fs.existsSync(INTERACTIONS_FILE)) {
    // 默认互动数据
    const defaultInteractions = {
      like: [],
      favorite: []
    };
    
    try {
      fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(defaultInteractions, null, 2));
      return defaultInteractions;
    } catch (error) {
      console.error('创建默认互动数据文件失败:', error);
      return { like: [], favorite: [] };
    }
  }
  
  try {
    const interactionsData = fs.readFileSync(INTERACTIONS_FILE, 'utf8');
    const interactions = JSON.parse(interactionsData);
    
    // 确保like和favorite数组存在
    if (!interactions.like) interactions.like = [];
    if (!interactions.favorite) interactions.favorite = [];
    
    return interactions;
  } catch (error) {
    console.error('读取互动数据时出错:', error);
    return { like: [], favorite: [] };
  }
}

// 更新互动数据
function updateInteractions(interactions) {
  if (!ensureConfigDir()) {
    console.error('无法确保数据目录存在');
    return false;
  }
  
  try {
    // 确保like和favorite数组存在
    if (!interactions.like) interactions.like = [];
    if (!interactions.favorite) interactions.favorite = [];
    
    fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(interactions, null, 2));
    return true;
  } catch (error) {
    console.error('更新互动数据时出错:', error);
    return false;
  }
}

// 检查环境是否为Vercel生产环境
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production';
}

// 使用内存存储在Vercel环境中
let memoryStore = {
  like: [],
  favorite: []
};

// 获取互动数据（兼容Vercel环境）
function getInteractions() {
  if (isVercelProduction()) {
    return memoryStore;
  } else {
    return getUserInteractions();
  }
}

// 保存互动数据（兼容Vercel环境）
function saveInteractions(interactions) {
  if (isVercelProduction()) {
    memoryStore = { ...interactions };
    return true;
  } else {
    return updateInteractions(interactions);
  }
}

export default function handler(req, res) {
  // 获取收藏列表
  if (req.method === 'GET') {
    try {
      const interactions = getInteractions();
      res.status(200).json({ favorite: interactions.favorite || [] });
    } catch (error) {
      console.error('获取收藏列表时出错:', error);
      res.status(500).json({ error: '获取收藏列表失败', details: error.message });
    }
  } 
  // 添加收藏
  else if (req.method === 'POST') {
    try {
      const { slug } = req.body;
      
      if (!slug) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      
      const interactions = getInteractions();
      
      // 确保favorite数组存在
      if (!interactions.favorite) interactions.favorite = [];
      
      // 检查是否已经收藏
      if (!interactions.favorite.includes(slug)) {
        interactions.favorite.push(slug);
        
        if (saveInteractions(interactions)) {
          res.status(200).json({ success: true, message: '收藏成功' });
        } else {
          res.status(500).json({ error: '更新收藏状态失败' });
        }
      } else {
        res.status(200).json({ success: true, message: '已经收藏过了' });
      }
    } catch (error) {
      console.error('添加收藏时出错:', error);
      res.status(500).json({ error: '添加收藏失败', details: error.message });
    }
  } 
  // 取消收藏
  else if (req.method === 'DELETE') {
    try {
      const { slug } = req.body;
      
      if (!slug) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      
      const interactions = getInteractions();
      
      // 确保favorite数组存在
      if (!interactions.favorite) interactions.favorite = [];
      
      const index = interactions.favorite.indexOf(slug);
      
      if (index !== -1) {
        interactions.favorite.splice(index, 1);
        
        if (saveInteractions(interactions)) {
          res.status(200).json({ success: true, message: '取消收藏成功' });
        } else {
          res.status(500).json({ error: '更新收藏状态失败' });
        }
      } else {
        res.status(200).json({ success: true, message: '未找到收藏记录' });
      }
    } catch (error) {
      console.error('取消收藏时出错:', error);
      res.status(500).json({ error: '取消收藏失败', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 