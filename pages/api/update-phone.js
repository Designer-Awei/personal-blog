import fs from 'fs';
import path from 'path';

/**
 * 更新用户电话号码API处理函数
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    // 用户配置文件路径
    const userConfigPath = path.join(process.cwd(), 'data', 'userConfig.json');
    
    // 确保配置目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 读取现有配置
    let userConfig = {
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
      themeColor: 'blue'
    };
    
    if (fs.existsSync(userConfigPath)) {
      const configData = fs.readFileSync(userConfigPath, 'utf8');
      userConfig = JSON.parse(configData);
    }
    
    // 更新电话号码
    userConfig.phone = '11111111111';
    
    // 保存更新后的配置
    fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2));
    
    return res.status(200).json({ 
      message: '电话号码已更新', 
      phone: userConfig.phone 
    });
  } catch (error) {
    console.error('更新电话号码时出错:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
} 