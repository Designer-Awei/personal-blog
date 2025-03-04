/**
 * 更新用户配置的API端点
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允许POST请求' });
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const CONFIG_FILE = path.join(process.cwd(), 'data', 'userConfig.json');
    
    // 确保配置目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 获取请求体中的用户配置
    const newConfig = req.body;
    
    // 验证配置数据
    if (!newConfig) {
      return res.status(400).json({ message: '缺少配置数据' });
    }
    
    // 读取现有配置
    let currentConfig = {};
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      currentConfig = JSON.parse(configData);
    }
    
    // 合并配置
    const updatedConfig = {
      ...currentConfig,
      ...newConfig
    };
    
    // 写入配置文件
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    
    return res.status(200).json({ message: '配置已更新', config: updatedConfig });
  } catch (error) {
    console.error('更新用户配置时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 