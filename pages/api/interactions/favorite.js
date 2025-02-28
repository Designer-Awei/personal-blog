import fs from 'fs';
import path from 'path';

const INTERACTIONS_FILE = path.join(process.cwd(), 'data', 'interactions.json');

// 确保配置目录存在
function ensureConfigDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 获取用户互动数据
function getUserInteractions() {
  ensureConfigDir();
  
  if (!fs.existsSync(INTERACTIONS_FILE)) {
    // 默认互动数据
    const defaultInteractions = {
      like: [],
      favorite: []
    };
    
    fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(defaultInteractions, null, 2));
    return defaultInteractions;
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
  ensureConfigDir();
  
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

export default function handler(req, res) {
  // 获取收藏列表
  if (req.method === 'GET') {
    const interactions = getUserInteractions();
    res.status(200).json({ favorite: interactions.favorite || [] });
  } 
  // 添加收藏
  else if (req.method === 'POST') {
    const { slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const interactions = getUserInteractions();
    
    // 确保favorite数组存在
    if (!interactions.favorite) interactions.favorite = [];
    
    // 检查是否已经收藏
    if (!interactions.favorite.includes(slug)) {
      interactions.favorite.push(slug);
      
      if (updateInteractions(interactions)) {
        res.status(200).json({ success: true, message: '收藏成功' });
      } else {
        res.status(500).json({ error: '更新收藏状态失败' });
      }
    } else {
      res.status(200).json({ success: true, message: '已经收藏过了' });
    }
  } 
  // 取消收藏
  else if (req.method === 'DELETE') {
    const { slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const interactions = getUserInteractions();
    
    // 确保favorite数组存在
    if (!interactions.favorite) interactions.favorite = [];
    
    const index = interactions.favorite.indexOf(slug);
    
    if (index !== -1) {
      interactions.favorite.splice(index, 1);
      
      if (updateInteractions(interactions)) {
        res.status(200).json({ success: true, message: '取消收藏成功' });
      } else {
        res.status(500).json({ error: '更新收藏状态失败' });
      }
    } else {
      res.status(200).json({ success: true, message: '未找到收藏记录' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 