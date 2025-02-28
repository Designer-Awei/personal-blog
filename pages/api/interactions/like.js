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
  // 获取点赞列表
  if (req.method === 'GET') {
    const interactions = getUserInteractions();
    res.status(200).json({ like: interactions.like || [] });
  } 
  // 添加点赞
  else if (req.method === 'POST') {
    const { slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const interactions = getUserInteractions();
    
    // 确保like数组存在
    if (!interactions.like) interactions.like = [];
    
    // 检查是否已经点赞
    if (!interactions.like.includes(slug)) {
      interactions.like.push(slug);
      
      if (updateInteractions(interactions)) {
        res.status(200).json({ success: true, message: '点赞成功' });
      } else {
        res.status(500).json({ error: '更新点赞状态失败' });
      }
    } else {
      res.status(200).json({ success: true, message: '已经点赞过了' });
    }
  } 
  // 取消点赞
  else if (req.method === 'DELETE') {
    const { slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const interactions = getUserInteractions();
    
    // 确保like数组存在
    if (!interactions.like) interactions.like = [];
    
    const index = interactions.like.indexOf(slug);
    
    if (index !== -1) {
      interactions.like.splice(index, 1);
      
      if (updateInteractions(interactions)) {
        res.status(200).json({ success: true, message: '取消点赞成功' });
      } else {
        res.status(500).json({ error: '更新点赞状态失败' });
      }
    } else {
      res.status(200).json({ success: true, message: '未找到点赞记录' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 