/**
 * 使用Puppeteer进行网页搜索的API路由
 * 
 * @param {object} req - HTTP请求对象
 * @param {object} res - HTTP响应对象
 */

// 添加时间处理工具函数
function processTimeKeywords(query) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 替换相对时间关键词
  let processedQuery = query;
  
  // 处理"今年"
  if (query.includes('今年')) {
    processedQuery = processedQuery.replace('今年', `${year}年`);
  }
  
  // 处理"本月"
  if (query.includes('本月')) {
    processedQuery = processedQuery.replace('本月', `${year}年${month}月`);
  }
  
  // 处理"这个月"
  if (query.includes('这个月')) {
    processedQuery = processedQuery.replace('这个月', `${year}年${month}月`);
  }

  // 处理"现在"或"实时"，如果涉及查询
  if (query.includes('现在') || query.includes('实时')) {
    processedQuery = processedQuery
      .replace('现在', `${year}年${month}月${day}日`)
      .replace('实时', `${year}年${month}月${day}日`);
  }

  // 处理"今天"
  if (query.includes('今天')) {
    processedQuery = processedQuery.replace('今天', `${year}年${month}月${day}日`);
  }

  return {
    processedQuery,
    currentTime: {
      year,
      month,
      day
    }
  };
}

// 添加网站分析工具函数
function analyzeWebsiteQuery(query) {
  // 检查是否包含完整URL
  const urlRegex = /https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?/;
  const urlMatch = query.match(urlRegex);
  
  // 检查是否包含"官网"或"网站"关键词
  const websiteKeywords = /(.*?)(官网|网站|主页)/.exec(query);
  
  // 提取查询目的（网站用途、功能等）
  const purposes = [
    '是什么', '干什么', '功能', '介绍', '简介', '概括', '总结', '说明',
    '内容', '信息', '详情', '特点', '特色', '服务'
  ];
  const purposeMatch = purposes.find(p => query.includes(p));

  if (urlMatch) {
    // 直接URL访问
    let url = urlMatch[0];
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    return {
      type: 'direct_url',
      url: url,
      purpose: purposeMatch || '概况'
    };
  } else if (websiteKeywords) {
    // 需要先搜索获取官网URL
    return {
      type: 'search_website',
      keyword: websiteKeywords[1].trim(),
      purpose: purposeMatch || '概况'
    };
  }
  
  return null;
}

// 添加网站内容爬取函数
async function crawlWebsite(page, url, purpose) {
  try {
    console.log(`[网页搜索] 正在访问网站: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });

    // 等待页面主要内容加载
    await page.waitForSelector('body');
    
    // 提取网站基本信息
    const websiteInfo = await page.evaluate(() => {
      const getMetaContent = (name) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
      };

      // 提取主要文本内容
      const getMainContent = () => {
        // 移除脚本、样式等
        const elementsToRemove = ['script', 'style', 'iframe', 'noscript'];
        elementsToRemove.forEach(tag => {
          document.querySelectorAll(tag).forEach(el => el.remove());
        });

        // 获取主要内容区域
        const mainContent = document.querySelector('main, article, #content, .content, #main, .main') || document.body;
        
        // 获取所有可见文本
        const textNodes = [];
        const walk = document.createTreeWalker(mainContent, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walk.nextNode()) {
          const text = node.textContent.trim();
          if (text && node.parentElement.offsetParent !== null) {
            textNodes.push(text);
          }
        }
        
        return textNodes.join(' ').replace(/\s+/g, ' ').trim();
      };

      return {
        title: document.title,
        description: getMetaContent('description') || getMetaContent('og:description'),
        keywords: getMetaContent('keywords'),
        mainContent: getMainContent(),
        url: window.location.href
      };
    });

    return {
      success: true,
      data: websiteInfo
    };
  } catch (error) {
    console.error('[错误] 网站访问失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 添加官网URL搜索函数
async function findOfficialWebsite(page, keyword) {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword + ' 官网')}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#b_results');

    const officialUrl = await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('#b_results .b_algo'));
      // 优先查找带有"官网"、"官方网站"等关键词的结果
      const official = results.find(result => {
        const title = result.querySelector('h2')?.textContent || '';
        const snippet = result.querySelector('.b_caption p')?.textContent || '';
        return (title + snippet).includes('官网') || 
               (title + snippet).includes('官方网站') ||
               (title + snippet).includes('官方主页');
      });
      
      if (official) {
        return official.querySelector('h2 a')?.href;
      }
      // 如果没找到明确的官网标识，返回第一个结果
      return results[0]?.querySelector('h2 a')?.href;
    });

    return officialUrl;
  } catch (error) {
    console.error('[错误] 搜索官网失败:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  let browser = null;
  try {
    let { query } = req.body;
    console.log(`\n[网页搜索] 开始处理搜索请求`);
    
    // 处理相对时间关键词
    const { processedQuery, currentTime } = processTimeKeywords(query);
    console.log(`[网页搜索] 原始查询: ${query}`);
    console.log(`[网页搜索] 处理后查询: ${processedQuery}`);
    
    // 分析是否是网站相关查询
    const websiteAnalysis = analyzeWebsiteQuery(processedQuery);
    
    if (websiteAnalysis) {
      console.log('[网页搜索] 检测到网站相关查询');
      let puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setDefaultNavigationTimeout(20000);
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

      let websiteUrl;
      if (websiteAnalysis.type === 'direct_url') {
        websiteUrl = websiteAnalysis.url;
      } else {
        websiteUrl = await findOfficialWebsite(page, websiteAnalysis.keyword);
      }

      if (websiteUrl) {
        const crawlResult = await crawlWebsite(page, websiteUrl, websiteAnalysis.purpose);
        if (crawlResult.success) {
          return res.status(200).json({
            results: `网站信息概要：\n\n` +
                    `📍 网站标题：${crawlResult.data.title}\n` +
                    `🔍 网站描述：${crawlResult.data.description || '无描述'}\n` +
                    `🏷️ 关键词：${crawlResult.data.keywords || '无关键词'}\n` +
                    `📝 主要内容：${crawlResult.data.mainContent.substring(0, 1000)}...\n\n` +
                    `🔗 网址：${crawlResult.data.url}\n` +
                    `⏰ 抓取时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
          });
        } else {
          return res.status(200).json({
            results: `抱歉，无法访问该网站。\n原因：${crawlResult.error}\n建议：\n1. 检查网址是否正确\n2. 稍后再试\n3. 尝试使用其他浏览器直接访问`
          });
        }
      } else {
        return res.status(200).json({
          results: '抱歉，未能找到相关网站。请检查网址或关键词是否正确。'
        });
      }
    }

    // 更新查询内容
    query = processedQuery;

    // 检查是否是标准时间查询
    let standardTimeKeywords = ['北京时间', '当前时间', '现在时间', '系统时间', '几点了', '现在几点'];
    let isStandardTimeQuery = standardTimeKeywords.some(keyword => query && query.includes(keyword));
    
    // 检查是否是其他时间相关查询（日出、日落、作息时间等）
    let otherTimeKeywords = ['日出', '日落', '升起', '落下', '作息', '上班时间', '下班时间'];
    let isOtherTimeQuery = otherTimeKeywords.some(keyword => query && query.includes(keyword));
    
    if (isStandardTimeQuery) {
      console.log('[网页搜索] 检测到标准时间查询，使用time.is获取标准时间');
      let puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      let page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setDefaultNavigationTimeout(15000);
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

      try {
        // 访问time.is获取准确时间
        await page.goto('https://time.is/Beijing', { waitUntil: 'networkidle0' });
        await page.waitForSelector('#clock', { timeout: 10000 });
        
        // 等待时间加载
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 获取时间信息
        let timeInfo = await page.evaluate(() => {
          let clock = document.querySelector('#clock');
          let date = document.querySelector('#dd');
          return {
            time: clock ? clock.textContent : '',
            date: date ? date.textContent : '',
            source: 'time.is/Beijing'
          };
        });

        console.log('[网页搜索] 成功获取标准时间');
        return res.status(200).json({
          results: `北京标准时间：${timeInfo.date} ${timeInfo.time}\n来源：${timeInfo.source}`
        });
      } catch (error) {
        console.error('[错误] 获取标准时间失败:', error);
        // 如果获取失败，使用系统时间作为备选
        let now = new Date();
        let timeString = now.toLocaleString('zh-CN', { 
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        return res.status(200).json({
          results: `北京时间：${timeString}\n来源：系统时间（由于无法访问标准时间服务器，使用本地时间）`
        });
      }
    } else if (isOtherTimeQuery || (query && query.includes('时间') && !isStandardTimeQuery)) {
      // 对于其他时间相关查询，使用必应搜索
      console.log('[网页搜索] 检测到时间相关查询，使用必应搜索');
      let puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      let page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setDefaultNavigationTimeout(15000);
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

      let searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('#b_results');

      let results = await page.evaluate(() => {
        let items = Array.from(document.querySelectorAll('#b_results .b_algo'));
        return items.slice(0, 3).map(item => {
          let title = item.querySelector('h2')?.textContent || '';
          let snippet = item.querySelector('.b_caption p')?.textContent || '';
          let url = item.querySelector('h2 a')?.href || '';
          return { title, snippet, url };
        });
      });

      let formattedResults = results.map((result, index) => 
        `${index + 1}. ${result.title}\n${result.snippet}\n来源: ${result.url}`
      ).join('\n\n');

      return res.status(200).json({ results: formattedResults });
    }

    // 非时间查询的情况下，检查查询是否为空
    if (!query) {
      console.error('[错误] 搜索查询不能为空');
      return res.status(400).json({ error: '搜索查询不能为空' });
    }

    // 非时间查询的常规搜索逻辑
    console.log('[网页搜索] 正在初始化Puppeteer...');
    let puppeteer = require('puppeteer');
    
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });
    console.log('[网页搜索] Puppeteer浏览器已启动');

    // 创建新页面
    console.log('[网页搜索] 创建新页面...');
    let page = await browser.newPage();
    
    // 设置页面视口
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 设置超时
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(15000);

    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 检查是否是天气查询
    let weatherKeywords = ['天气', '今天', '今日', '现在', '实时'];
    let isWeatherQuery = weatherKeywords.some(keyword => query.includes(keyword));

    let searchUrl;
    if (isWeatherQuery) {
      try {
        // 提取城市名称，使用处理后的查询
        let city = processedQuery.split(/[今天|今日|现在|实时|天气]/)[0];
        
        // 使用必应搜索获取天气信息
        console.log('[网页搜索] 使用必应搜索获取天气信息，城市:', city);
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(city + '天气')}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle0' });
        await page.waitForSelector('#b_results', { timeout: 10000 });

        let results = await page.evaluate(() => {
          // 尝试从必应搜索结果中提取天气信息
          let weatherCard = document.querySelector('.b_antiTopBleed, .b_scard');
          if (weatherCard) {
            let temp = weatherCard.querySelector('.wtr_currTemp')?.textContent || '';
            let condition = weatherCard.querySelector('.wtr_condition')?.textContent || '';
            let humidity = weatherCard.querySelector('[aria-label*="湿度"]')?.textContent || '';
            let wind = weatherCard.querySelector('[aria-label*="风"]')?.textContent || '';
            let precipitation = weatherCard.querySelector('[aria-label*="降水"]')?.textContent || '';
            
            let updateTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            
            return [{
              title: '实时天气信息',
              snippet: `实时温度：${temp}\n` +
                      `天气状况：${condition}\n` +
                      `${humidity ? `相对湿度：${humidity}\n` : ''}` +
                      `${wind ? `风力风向：${wind}\n` : ''}` +
                      `${precipitation ? `降水情况：${precipitation}\n` : ''}\n` +
                      `数据来源：必应天气\n` +
                      `更新时间：${updateTime}`,
              url: window.location.href
            }];
          }
          
          // 如果找不到天气卡片，返回一般搜索结果
          return Array.from(document.querySelectorAll('#b_results .b_algo')).slice(0, 3).map(item => ({
            title: item.querySelector('h2')?.textContent || '',
            snippet: item.querySelector('.b_caption p')?.textContent || '',
            url: item.querySelector('h2 a')?.href || ''
          }));
        });

        if (results && results.length > 0) {
          return res.status(200).json({ results: results[0].snippet });
        }
        
        throw new Error('无法获取天气信息');
        
      } catch (error) {
        console.error('[错误] 获取天气数据失败:', error);
        return res.status(200).json({ 
          results: '抱歉，暂时无法获取天气信息。建议：\n' +
                  '1. 访问天气网站（weather.com.cn）\n' +
                  '2. 使用手机天气APP\n' +
                  '3. 稍后再试\n\n' +
                  '技术原因：' + error.message
        });
      }
    } else {
      // 非天气查询时使用处理后的查询
      searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(processedQuery)}`;
    }

    console.log('[网页搜索] 正在访问搜索页面...');
    try {
      await page.goto(searchUrl, {
        waitUntil: 'networkidle0'
      });
      
      console.log('[网页搜索] 等待搜索结果加载...');
      if (isWeatherQuery) {
        await page.waitForSelector('.t .tem, .sk .tem', { timeout: 10000 });
      } else {
        await page.waitForSelector('#b_results');
      }
      
      // 使用Promise和setTimeout替代waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[网页搜索] 提取搜索结果...');
      // 提取搜索结果
      let searchResults = await page.evaluate((isWeatherQuery) => {
        let results = [];
        
        if (isWeatherQuery) {
          // 获取天气信息
          let weatherInfo = {
            title: '实时天气信息',
            snippet: '',
            url: window.location.href
          };

          // 获取实时温度
          let tempElement = document.querySelector('.t .tem span, .sk .tem');
          if (tempElement) {
            weatherInfo.snippet += `实时温度：${tempElement.textContent.trim()}℃\n`;
          }

          // 获取天气状况
          let weatherElement = document.querySelector('.t .wea, .sk .wea');
          if (weatherElement) {
            weatherInfo.snippet += `天气状况：${weatherElement.textContent.trim()}\n`;
          }

          // 获取风力风向
          let windElement = document.querySelector('.t .win span, .sk .win span');
          if (windElement) {
            weatherInfo.snippet += `风力风向：${windElement.textContent.trim()}\n`;
          }

          // 获取相对湿度
          let humidityElement = document.querySelector('.t .zs h, .sk .zs h');
          if (humidityElement) {
            weatherInfo.snippet += `相对湿度：${humidityElement.textContent.trim()}\n`;
          }

          // 获取空气质量
          let aqiElement = document.querySelector('.t .zs span, .sk .zs span');
          if (aqiElement) {
            weatherInfo.snippet += `空气质量：${aqiElement.textContent.trim()}\n`;
          }

          // 获取降水概率
          let rainElement = document.querySelector('.t .zs em, .sk .zs em');
          if (rainElement) {
            weatherInfo.snippet += `降水概率：${rainElement.textContent.trim()}\n`;
          }

          // 获取紫外线指数
          let uvElement = document.querySelector('.lv .li1 em, .li1 span');
          if (uvElement) {
            weatherInfo.snippet += `紫外线强度：${uvElement.textContent.trim()}\n`;
          }

          let updateTime = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false
          });
          weatherInfo.snippet += `\n数据来源：中国天气网\n更新时间：${updateTime}`;
          results.push(weatherInfo);
        } else {
          // 如果没有找到天气卡片或不是天气查询，获取普通搜索结果
          let items = document.querySelectorAll('#b_results .b_algo');
          items.forEach((item) => {
            let titleElement = item.querySelector('h2 a');
            let snippetElement = item.querySelector('.b_caption p');
            let dateElement = item.querySelector('.news_dt');
            
            if (titleElement && snippetElement) {
              let result = {
                title: titleElement.innerText.trim(),
                url: titleElement.href,
                snippet: snippetElement.innerText.trim()
              };
              
              if (dateElement) {
                result.date = dateElement.innerText.trim();
              }
              
              results.push(result);
            }
          });
        }
        
        return results.slice(0, 5);
      }, isWeatherQuery);

      console.log(`[网页搜索] 找到 ${searchResults.length} 条搜索结果`);
      
      // 格式化搜索结果
      let formattedResults = '';
      if (isWeatherQuery && searchResults.length > 0) {
        formattedResults = searchResults[0].snippet;
      } else {
        formattedResults = searchResults.map((result, index) => {
          let formattedResult = `${index + 1}. ${result.title}\n`;
          if (result.date) {
            formattedResult += `发布时间: ${result.date}\n`;
          }
          formattedResult += `${result.snippet}\n来源: ${result.url}\n`;
          return formattedResult;
        }).join('\n');
      }

      // 如果没有找到任何结果
      if (searchResults.length === 0) {
        console.log('[网页搜索] 未找到相关结果');
        if (isWeatherQuery) {
          res.status(200).json({ 
            results: '抱歉，暂时无法获取天气信息。建议：\n1. 请确认城市名称是否正确\n2. 访问中国天气网 weather.com.cn\n3. 使用手机上的天气预报应用'
          });
        } else {
          res.status(200).json({ 
            results: '未找到相关搜索结果。这可能是因为：\n1. 搜索词过于具体或罕见\n2. 网络连接问题\n3. 搜索引擎限制'
          });
        }
      } else {
        console.log('[网页搜索] 搜索完成，返回结果');
        res.status(200).json({ results: formattedResults });
      }
      
    } catch (error) {
      console.error('[错误] 页面操作出错:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
    
  } catch (error) {
    console.error('[错误] 网页搜索失败:', error);
    res.status(500).json({ 
      error: '搜索失败', 
      message: error.message 
    });
  } finally {
    if (browser) {
      console.log('[网页搜索] 关闭浏览器...');
      await browser.close();
      console.log('[网页搜索] 浏览器已关闭');
    }
  }
} 