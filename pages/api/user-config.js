import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'userConfig.json');

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

// 默认用户配置
const defaultConfig = {
  name: 'Designer-Awei',
  email: '1974379701@qq.com',
  phone: '11111111111',
  location: '浙江杭州',
  skills: 'Solidworks、KeyShot、Cursor',
  occupation: '设计师',
  profileImage: null,
  bio: '热爱设计和技术，喜欢分享知识和经验。在这个博客上，我会分享我的设计心得和技术见解。',
  socialLinks: [
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Cursor', url: 'https://cursor.sh' },
    { name: 'Trea', url: 'https://trea.com' }
  ],
  themeColor: 'blue' // 默认主题颜色
};

// 检查环境是否为Vercel生产环境
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production';
}

// 内存中的用户配置（用于Vercel环境）
let memoryConfig = { ...defaultConfig };

// 获取用户配置
function getUserConfig() {
  // 在Vercel生产环境中使用内存存储
  if (isVercelProduction()) {
    return memoryConfig;
  }
  
  if (!ensureConfigDir()) {
    console.error('无法确保数据目录存在');
    return defaultConfig;
  }
  
  if (!fs.existsSync(CONFIG_FILE)) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (error) {
      console.error('创建默认配置文件失败:', error);
      return defaultConfig;
    }
  }
  
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    // 如果没有主题颜色，添加默认值
    if (!config.themeColor) {
      config.themeColor = 'blue';
      try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      } catch (writeError) {
        console.error('更新配置文件时出错:', writeError);
      }
    }
    
    return config;
  } catch (error) {
    console.error('读取配置文件时出错:', error);
    return defaultConfig;
  }
}

// 更新用户配置
function updateUserConfig(newConfig) {
  // 在Vercel生产环境中使用内存存储
  if (isVercelProduction()) {
    memoryConfig = { ...memoryConfig, ...newConfig };
    return { success: true, config: memoryConfig };
  }
  
  if (!ensureConfigDir()) {
    console.error('无法确保数据目录存在');
    return { success: false, error: '无法确保数据目录存在' };
  }
  
  try {
    const currentConfig = getUserConfig() || defaultConfig;
    const updatedConfig = { ...currentConfig, ...newConfig };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    return { success: true, config: updatedConfig };
  } catch (error) {
    console.error('更新配置文件时出错:', error);
    return { success: false, error: error.message };
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 获取用户配置
      const config = getUserConfig();
      if (config) {
        res.status(200).json(config);
      } else {
        res.status(500).json({ error: '获取用户配置失败' });
      }
    } catch (error) {
      console.error('处理GET请求时出错:', error);
      res.status(500).json({ error: '获取用户配置失败', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // 更新用户配置
      const result = updateUserConfig(req.body);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('处理POST请求时出错:', error);
      res.status(500).json({ success: false, error: '更新用户配置失败', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 