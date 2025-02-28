import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'userConfig.json');

// 确保配置目录存在
function ensureConfigDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 获取用户配置
function getUserConfig() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    // 默认配置
    const defaultConfig = {
      name: 'Designer-Awei',
      email: '1974379701@qq.com',
      phone: '15057616150',
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
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    // 如果没有主题颜色，添加默认值
    if (!config.themeColor) {
      config.themeColor = 'blue';
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    
    return config;
  } catch (error) {
    console.error('读取配置文件时出错:', error);
    return null;
  }
}

// 更新用户配置
function updateUserConfig(newConfig) {
  ensureConfigDir();
  
  try {
    const currentConfig = getUserConfig() || {};
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
    // 获取用户配置
    const config = getUserConfig();
    if (config) {
      res.status(200).json(config);
    } else {
      res.status(500).json({ error: '获取用户配置失败' });
    }
  } else if (req.method === 'POST') {
    // 更新用户配置
    const result = updateUserConfig(req.body);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 