/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['fs', 'path'],
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      console.log('开发环境配置已加载');
    }
    
    // 确保文件系统模块在服务器端可用
    if (isServer) {
      console.log('服务器端配置已加载');
      
      // 在这里添加自定义处理，确保content目录被包含在构建中
      const CopyPlugin = require('copy-webpack-plugin');
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            { 
              from: 'content', 
              to: 'content',
              noErrorOnMissing: true
            },
            // 确保在.next/server/content目录中也有文件
            { 
              from: 'content', 
              to: '../server/content',
              noErrorOnMissing: true
            },
          ],
        })
      );
    }
    
    return config;
  },
  // 添加静态生成配置
  staticPageGenerationTimeout: 180, // 增加静态页面生成超时时间到180秒
}

console.log('Next.js配置已加载，环境:', process.env.NODE_ENV);

module.exports = nextConfig
