import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'userConfig.json');

// 确保配置目录存在
export function ensureConfigDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 获取用户配置
export function getUserConfig() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    // 默认配置
    const defaultConfig = {
      name: 'Designer-Awei',
      email: '1974379701@qq.com',
      location: '浙江杭州',
      skills: 'Solidworks、KeyShot、Cursor',
      profileImage: null,
      bio: '热爱设计和技术，喜欢分享知识和经验。在这个博客上，我会分享我的设计心得和技术见解。',
      socialLinks: [
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Cursor', url: 'https://cursor.sh' },
        { name: 'Trea', url: 'https://trea.com' }
      ]
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('读取配置文件时出错:', error);
    return null;
  }
}

// 更新用户配置
export function updateUserConfig(newConfig) {
  ensureConfigDir();
  
  try {
    const currentConfig = getUserConfig() || {};
    const updatedConfig = { ...currentConfig, ...newConfig };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    return true;
  } catch (error) {
    console.error('更新配置文件时出错:', error);
    return false;
  }
}

// 更新用户头像
export function updateProfileImage(imageUrl) {
  return updateUserConfig({ profileImage: imageUrl });
} 