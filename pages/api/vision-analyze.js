/**
 * 视觉分析API - 专门处理图片分析，避免超时
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    const { imageBase64, message } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: '缺少图片数据' });
    }

    // 从环境变量获取SiliconFlow API密钥
    const apiKey = process.env.SILICONFLOW_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'API密钥未配置' });
    }

    console.log('[视觉分析API] 开始处理图片分析...');

    // 调用SiliconFlow视觉模型
    const visionResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'THUDM/GLM-4.1V-9B-Thinking', // 使用视觉模型
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: message || '请详细分析这张图片的内容，包括主要对象、场景、颜色、布局、文字内容、情感表达等信息。请提供全面而准确的分析。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        // 移除max_tokens限制，让模型根据图片复杂度生成合适长度的分析结果
        stream: false // 不使用流式输出，确保快速完成
      })
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error('[视觉分析API] SiliconFlow API错误:', errorData);
      return res.status(visionResponse.status).json({
        success: false,
        message: `视觉分析失败: ${errorData.message || '未知错误'}`
      });
    }

    const visionData = await visionResponse.json();

    if (!visionData.choices || visionData.choices.length === 0) {
      return res.status(500).json({
        success: false,
        message: '视觉分析无返回结果'
      });
    }

    const visionResult = visionData.choices[0].message.content;
    console.log('[视觉分析API] 分析完成，结果长度:', visionResult.length);

    // 返回视觉分析结果
    res.status(200).json({
      success: true,
      visionResult: visionResult,
      usage: visionData.usage
    });

  } catch (error) {
    console.error('[视觉分析API] 处理出错:', error);
    res.status(500).json({
      success: false,
      message: `视觉分析处理失败: ${error.message}`
    });
  }
}
