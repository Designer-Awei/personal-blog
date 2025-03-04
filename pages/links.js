import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Layout from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';

/**
 * 更多链接页面组件
 * @returns {React.ReactElement} 更多链接页面
 */
export default function LinksPage({ userConfig }) {
  const [mounted, setMounted] = useState(false);

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-4 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-1">
              <ArrowLeft size={16} />
              <span>返回首页</span>
            </Button>
          </Link>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">索引合集</CardTitle>
            <CardDescription>这里收集了我所有的社交媒体和推荐网站链接</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userConfig.socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-medium">{link.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full" title={link.url}>
                      {link.url}
                    </p>
                  </div>
                  <ExternalLink size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                </motion.a>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              这些是我经常使用和推荐的网站，希望对您有所帮助
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </Layout>
  );
}

/**
 * 获取服务器端属性
 * @returns {Promise<Object>} 包含用户配置的props对象
 */
export async function getServerSideProps() {
  // 导入服务器端模块
  const fs = require('fs');
  const path = require('path');
  
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
    themeColor: 'blue'
  };
  
  try {
    // 确保配置目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const CONFIG_FILE = path.join(process.cwd(), 'data', 'userConfig.json');
    
    // 如果配置文件不存在，创建默认配置
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return { props: { userConfig: defaultConfig } };
    }
    
    // 读取配置文件
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const userConfig = JSON.parse(configData);
    
    return { props: { userConfig } };
  } catch (error) {
    console.error('获取用户配置时出错:', error);
    return { props: { userConfig: defaultConfig } };
  }
} 