import fs from 'fs';
import path from 'path';
import { getUserConfig, updateUserConfig } from '../../../lib/userConfig';

export default async function handler(req, res) {
  const { action } = req.query;
  
  // 只允许 like 和 favorite 操作
  if (action !== 'like' && action !== 'favorite') {
    return res.status(400).json({ message: '不支持的操作' });
  }

  if (req.method === 'GET') {
    try {
      const userConfig = getUserConfig();
      const interactions = userConfig[`${action}d`] || [];
      
      return res.status(200).json({ [action]: interactions });
    } catch (error) {
      console.error(`获取${action}列表时出错:`, error);
      return res.status(500).json({ message: '服务器错误', error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { slug, value } = req.body;
      
      if (!slug) {
        return res.status(400).json({ message: '缺少文章slug参数' });
      }
      
      const userConfig = getUserConfig();
      const interactionKey = `${action}d`;
      
      if (!userConfig[interactionKey]) {
        userConfig[interactionKey] = [];
      }
      
      // 如果value为true，添加到列表；如果为false，从列表中移除
      if (value) {
        if (!userConfig[interactionKey].includes(slug)) {
          userConfig[interactionKey].push(slug);
        }
      } else {
        userConfig[interactionKey] = userConfig[interactionKey].filter(item => item !== slug);
      }
      
      updateUserConfig(userConfig);
      
      return res.status(200).json({ 
        message: `文章${value ? '已' : '取消'}${action === 'like' ? '点赞' : '收藏'}`,
        [interactionKey]: userConfig[interactionKey]
      });
    } catch (error) {
      console.error(`更新${action}状态时出错:`, error);
      return res.status(500).json({ message: '服务器错误', error: error.message });
    }
  } else {
    return res.status(405).json({ message: '只支持GET和POST请求' });
  }
} 