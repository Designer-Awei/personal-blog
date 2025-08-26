import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Bot, User, Trash, StopCircle, Cpu, Trash2, Upload, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from '../components/ui/use-toast';
import Layout from '../components/layout';
import { marked } from 'marked';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../components/ui/dialog';

// 配置marked选项，增强Markdown渲染效果
marked.setOptions({
  breaks: true, // 启用换行符转换为<br>
  gfm: true,    // 启用GitHub风格的Markdown
  headerIds: true, // 为标题添加ID
  mangle: false // 不转义HTML标签中的内容
});

/**
 * 可用的AI模型列表
 */
const AI_MODELS = [
  { id: 'THUDM/GLM-4-9B-0414', name: 'GLM-4-9B-0414 (通用对话)', type: 'text' },
  { id: 'Qwen/Qwen3-8B', name: 'Qwen3-8B (通用对话)', type: 'text' },
  { id: 'THUDM/GLM-4.1V-9B-Thinking', name: 'GLM-4.1V-9B-Thinking (思考模型)', type: 'text' },
  { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B-Instruct (通用对话)', type: 'text' },
  { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', name: 'DeepSeek-R1-Distill-Qwen-7B (通用对话)', type: 'text' },
  { id: 'THUDM/chatglm3-6b', name: 'ChatGLM3-6B (通用对话)', type: 'text' },
];

/**
 * AI聊天室页面组件
 * @returns {JSX.Element} 聊天室页面
 */
export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是AI助手，有什么我可以帮助你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('THUDM/GLM-4-9B-0414');
  const [currentModelId, setCurrentModelId] = useState('THUDM/GLM-4-9B-0414'); // 跟踪当前实际使用的模型
  const [uploadedImage, setUploadedImage] = useState(null); // 上传的图片文件
  const [imagePreview, setImagePreview] = useState(null); // 图片预览URL
  const [imagePreviewModal, setImagePreviewModal] = useState(null); // 图片预览模态框的图片URL
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false); // 图片预览模态框是否打开
  const [isImageLoading, setIsImageLoading] = useState(false); // 图片预览加载状态
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false); // 视觉分析状态
  const [visionResult, setVisionResult] = useState(null); // 视觉分析结果
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isImagePreviewOpen) {
        closeImagePreview();
      }
    };

    if (isImagePreviewOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isImagePreviewOpen]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * 停止流式输出
   */
  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 更新状态
    setIsStreaming(false);
    setIsLoading(false);
    
    // 添加中断提示到最后一条消息
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        // 如果消息为空，添加中断提示；如果已有内容，添加中断后缀
        if (!newMessages[newMessages.length - 1].content) {
          newMessages[newMessages.length - 1].content = '（生成已中断）';
        } else if (!newMessages[newMessages.length - 1].content.includes('（生成已中断）')) {
          newMessages[newMessages.length - 1].content += ' （生成已中断）';
        }
      }
      return newMessages;
    });
    
    // 显示提示
    toast({
      title: "生成已中断",
      description: "AI响应生成已被用户中断",
      variant: "default"
    });
  };

  /**
   * 处理图片聊天（分步骤：视觉分析 -> 文本生成）
   * @param {string} message - 用户消息
   * @param {string} image - 图片base64数据
   * @param {Array} history - 聊天历史
   * @param {string} modelId - 模型ID
   * @param {AbortController} controller - 中止控制器
   */
  const handleImageChat = async (message, image, history, modelId, controller) => {
    try {
      // 第一步：视觉分析
      setIsVisionAnalyzing(true);

      console.log('[前端] 开始视觉分析...');
      const visionResponse = await fetch('/api/vision-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: image,
          message: message || '请分析这张图片'
        }),
        signal: controller.signal,
      });

      if (!visionResponse.ok) {
        throw new Error(`视觉分析失败: ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      if (!visionData.success) {
        throw new Error(visionData.message || '视觉分析失败');
      }

      console.log('[前端] 视觉分析完成，开始文本生成...');
      setIsVisionAnalyzing(false);
      setVisionResult(visionData.visionResult);

      // 第二步：基于视觉分析结果进行文本生成
      await handleTextGeneration(message, visionData.visionResult, history, modelId, controller);

    } catch (error) {
      console.error('[前端] 图片聊天出错:', error);
      setIsVisionAnalyzing(false);
      setIsLoading(false);
      setIsStreaming(false);

      // 添加错误消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `抱歉，图片分析失败: ${error.message}。请重试或检查网络连接。`
      }]);

      toast({
        title: "图片分析失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  /**
   * 处理文本生成（基于视觉分析结果）
   * @param {string} message - 用户消息
   * @param {string} visionResult - 视觉分析结果
   * @param {Array} history - 聊天历史
   * @param {string} modelId - 模型ID
   * @param {AbortController} controller - 中止控制器
   */
  const handleTextGeneration = async (message, visionResult, history, modelId, controller) => {
    try {
      // 添加一个空的助手消息，用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsStreaming(true);

      const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          message: message,
          history: history,
          model: modelId,
          visionResult: visionResult,
          step: 'text-generation'
      }),
      signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      // 设置超时处理
      const timeoutId = setTimeout(() => {
        if (isStreaming) {
          stopStreaming();
          toast({
            title: "连接超时",
            description: "AI响应超时，请重试或检查网络连接",
            variant: "destructive"
          });
        }
      }, 30000); // 30秒超时

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              clearTimeout(timeoutId);
              setIsStreaming(false);
              setIsLoading(false);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.content) {
                    assistantMessage += data.content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages.length > 0) {
                        newMessages[newMessages.length - 1].content = assistantMessage;
                      }
                      return newMessages;
                    });

                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }

                  if (data.done) {
                    clearTimeout(timeoutId);
                    setIsStreaming(false);
                    setIsLoading(false);
                  }

                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error('解析数据出错:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('读取流出错:', error);
          clearTimeout(timeoutId);

          if (isStreaming) {
            setIsStreaming(false);
            setIsLoading(false);

          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
              if (!newMessages[newMessages.length - 1].content) {
                  newMessages[newMessages.length - 1].content = `抱歉，出现了错误: ${error.message}`;
              }
            }
            return newMessages;
          });
          
            toast({
              title: "发生错误",
              description: error.message,
              variant: "destructive"
            });
          }
        }
      };

      await readStream();

    } catch (error) {
      console.error('文本生成请求出错:', error);
          setIsLoading(false);
      setIsStreaming(false);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `抱歉，请求失败: ${error.message}。请检查网络连接或稍后重试。`
      }]);

      toast({
        title: "请求失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  /**
   * 处理普通文本聊天
   * @param {string} message - 用户消息
   * @param {Array} history - 聊天历史
   * @param {string} modelId - 模型ID
   * @param {AbortController} controller - 中止控制器
   */
  const handleTextChat = async (message, history, modelId, controller) => {
    try {
      // 添加一个空的助手消息，用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsStreaming(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: history,
          model: modelId
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // 设置超时处理
      const timeoutId = setTimeout(() => {
        if (isStreaming) {
          stopStreaming();
          toast({
            title: "连接超时",
            description: "AI响应超时，请重试或检查网络连接",
            variant: "destructive"
          });
        }
      }, 30000);

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              clearTimeout(timeoutId);
              setIsStreaming(false);
              setIsLoading(false);
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.content) {
                    assistantMessage += data.content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages.length > 0) {
                        newMessages[newMessages.length - 1].content = assistantMessage;
                      }
                      return newMessages;
                    });
                    
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
                  
                  if (data.done) {
                    clearTimeout(timeoutId);
                    setIsStreaming(false);
                    setIsLoading(false);
                  }
                  
                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error('解析数据出错:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('读取流出错:', error);
          clearTimeout(timeoutId);
          
          if (isStreaming) {
            setIsStreaming(false);
            setIsLoading(false);
            
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                if (!newMessages[newMessages.length - 1].content) {
                  newMessages[newMessages.length - 1].content = `抱歉，出现了错误: ${error.message}`;
                }
              }
              return newMessages;
            });
            
            toast({
              title: "发生错误",
              description: error.message,
              variant: "destructive"
            });
          }
        }
      };
      
      await readStream();

    } catch (error) {
      console.error('文本聊天请求出错:', error);
      setIsLoading(false);
      setIsStreaming(false);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `抱歉，请求失败: ${error.message}。请检查网络连接或稍后重试。` 
      }]);
      
      toast({
        title: "请求失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  /**
   * 处理模型变更
   * @param {string} modelId - 选择的模型ID
   */
  const handleModelChange = (modelId) => {
    // 如果正在生成，先停止
    if (isStreaming) {
      stopStreaming();
    }

    // 保存当前的输入内容和图片
    const currentInput = input;
    const currentUploadedImage = uploadedImage;
    const currentImagePreview = imagePreview;

    setSelectedModelId(modelId);
    setCurrentModelId(modelId); // 更新当前使用的模型

    // 恢复输入内容和图片
    setInput(currentInput);
    setUploadedImage(currentUploadedImage);
    setImagePreview(currentImagePreview);

    // 根据模型类型显示提示，但不重置对话历史
    const selectedModelInfo = AI_MODELS.find(model => model.id === modelId);
    if (selectedModelInfo) {
      // 显示切换提示
      toast({
        title: "模型已切换",
        description: `已切换到 ${selectedModelInfo.name}`,
        variant: "default"
      });
    }
  };

  /**
   * 处理表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedImage) || (isLoading && !isStreaming)) return;

    // 验证图片大小（base64数据）
    if (uploadedImage && uploadedImage.length > 5 * 1024 * 1024) {
      toast({
        title: "图片过大",
        description: "压缩后的图片仍然过大，请选择更小的图片",
        variant: "destructive"
      });
      return;
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: input,
      image: uploadedImage // 使用base64数据
    };
    setMessages((prev) => [...prev, userMessage]);

    // 清除输入和图片
    const currentInput = input;
    const currentImage = uploadedImage;
    setInput('');
    setUploadedImage(null);
    setImagePreview(null);

    // 滚动到底部
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // 设置加载状态
    setIsLoading(true);
    setIsStreaming(false);
    setVisionResult(null);

    // 创建AbortController用于取消请求
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 检查是否有图片，如果有则分步骤处理
    if (currentImage) {
      // 分步骤处理：先视觉分析，再文本生成
      handleImageChat(currentInput, currentImage, messages, selectedModelId, controller);
    } else {
      // 普通文本对话
      handleTextChat(currentInput, messages, selectedModelId, controller);
    }
  };

  // 处理键盘事件，支持Ctrl+Enter换行
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      setInput(prev => prev + '\n');
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * 清空聊天记录
   */
  const clearChat = () => {
    // 如果正在流式输出，先停止
    if (isStreaming) {
      stopStreaming();
    }
    
    setMessages([
      { role: 'assistant', content: '聊天记录已清空。有什么我可以帮助你的吗？' }
    ]);

    // 清除上传的图片
    setUploadedImage(null);
    setImagePreview(null);
  };

  /**
   * 获取模型的简短显示名称
   * @param {string} modelId - 模型ID
   * @returns {string} 简短的模型名称
   */
  const getModelDisplayName = (modelId) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) return '输入消息...';
    
    // 从模型名称中提取简短名称
    const fullName = model.name.split(' ')[0]; // 取第一部分，去掉括号里的描述
    
    // 处理不同类型的模型名称格式
    if (fullName.includes('ChatGLM')) {
      return 'ChatGLM3-6B';
    } else if (fullName.includes('DeepSeek')) {
      return 'DeepSeek-R1';
    } else if (fullName.includes('Qwen')) {
      return 'Qwen2.5-7B';
    }
    
    // 如果是其他模型，尝试提取前两个部分
    const parts = fullName.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    
    return fullName;
  };

  /**
   * 处理文件上传
   * @param {Event} e - 文件选择事件
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // 检查文件大小（限制为10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "文件过大",
          description: "请选择小于10MB的图片文件",
          variant: "destructive"
        });
        return;
      }

      try {
        // 显示预览
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        // 直接压缩图片并转换为base64（SiliconFlow视觉模型需要base64格式）
        const reader = new FileReader();
        reader.onload = async (e) => {
          const img = new Image();
          img.onload = () => {
            // 创建canvas进行压缩
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 计算压缩后的尺寸（最大宽度800px，保持比例）
            let { width, height } = img;
            const maxWidth = 800;
            const maxHeight = 600;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // 绘制并压缩
            ctx.drawImage(img, 0, 0, width, height);

            // 转换为base64（质量0.8）
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setUploadedImage(compressedBase64); // 存储压缩后的base64数据

            // 图片已压缩并准备完成（不显示通知）
          };

          img.src = e.target.result;
        };
        reader.readAsDataURL(file);

      } catch (error) {
        console.error('图片处理失败:', error);
        toast({
          title: "图片处理失败",
          description: "无法处理该图片，请尝试其他图片",
          variant: "destructive"
        });

        // 清理预览
        setImagePreview(null);
        setUploadedImage(null);
      }
    } else if (file) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive"
      });
    }
  };

  /**
   * 移除上传的图片
   */
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    // 图片已移除（不显示通知）
  };

  /**
   * 打开图片预览模态框
   * @param {string} imageUrl - 图片URL
   */
  const openImagePreview = (imageUrl) => {
    setIsImageLoading(true);
    setImagePreviewModal(imageUrl);
    setIsImagePreviewOpen(true);
  };

  /**
   * 关闭图片预览模态框
   */
  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setImagePreviewModal(null);
    setIsImageLoading(false);
  };

  /**
   * 图片加载完成处理
   */
  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  return (
    <>
      {/* 图片预览模态框 */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none sm:max-w-[90vw] sm:max-h-[90vh]">
          <DialogTitle className="sr-only">图片预览</DialogTitle>
          <DialogDescription className="sr-only">
            点击图片或关闭按钮退出预览
          </DialogDescription>
          <div className="relative flex items-center justify-center min-h-[50vh] max-h-[95vh] w-full">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex space-x-1">
                  <div className="h-4 w-4 bg-white/30 rounded-full animate-bounce"></div>
                  <div className="h-4 w-4 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-4 w-4 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            {imagePreviewModal && (
              <img
                src={imagePreviewModal}
                alt="图片预览"
                className={`max-w-full max-h-full object-contain rounded-lg select-none transition-opacity duration-300 ${
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={closeImagePreview}
                onLoad={handleImageLoad}
                onError={() => setIsImageLoading(false)}
                style={{ touchAction: 'none' }}
              />
            )}
            <Button
              type="button"
              onClick={closeImagePreview}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-12 w-12 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white touch-manipulation sm:h-10 sm:w-10 shadow-lg"
            >
              <X size={24} className="sm:w-5 sm:h-5" />
            </Button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm px-4 text-center">
              点击图片或关闭按钮退出预览
            </div>
          </div>
        </DialogContent>
      </Dialog>

    <Layout>
      <Head>
        <title>AI聊天室 | 个人博客</title>
        <meta name="description" content="与AI助手交流，获取帮助和建议" />
      </Head>

      <div className="container max-w-5xl mx-auto py-6 px-4 animate-fade-in">
        {/* 顶部导航栏 - 仅在大屏幕显示 */}
        <div className="hidden md:flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">AI聊天室</h1>
          <div className="flex items-center ml-auto">
            <div className="mr-4 flex items-center">
              <Cpu size={18} className="mr-2 text-primary" />
              <Select value={selectedModelId} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="选择AI模型" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={clearChat}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
              title="清空聊天"
            >
              <Trash size={18} className="mr-1" />
              清空聊天
            </Button>
          </div>
        </div>

        {/* 移动端标题 - 仅在小屏幕显示 */}
        <div className="flex md:hidden items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/')}
              className="mr-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-bold">AI聊天室</h1>
          </div>
        </div>

        <Card className="border-2 pl-0 ml-0">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center">
                {/* 移除机器人图标，替换标题为Robot */}
                <CardTitle className="text-lg whitespace-nowrap">Robot</CardTitle>
              </div>
              
              {/* 在小屏幕显示模型选择和清空按钮，大屏幕隐藏 */}
              <div className="flex md:hidden items-center gap-1 ml-auto">
                <Select value={selectedModelId} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-xs">
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearChat}
                  className="h-8 text-xs ml-1"
                  title="清空聊天"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[80%]">
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 mt-1 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot size={16} className="text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <div className="space-y-2">
                          {message.image && (
                            <img
                              src={message.image}
                              alt="用户上传的图片"
                              className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity touch-manipulation sm:max-w-[250px] sm:max-h-[250px]"
                              onClick={() => openImagePreview(message.image)}
                              style={{ touchAction: 'manipulation' }}
                            />
                          )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ) : (
                        <div 
                          className="text-sm prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                        />
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 mt-1 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* 视觉分析状态显示 */}
              {isVisionAnalyzing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-blue-500" />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg px-4 py-2 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm text-blue-700 dark:text-blue-300">正在分析图片...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 普通加载状态 */}
              {isLoading && !isStreaming && !isVisionAnalyzing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <Separator />

          {/* 图片预览区域 */}
          {imagePreview && (
            <div className="px-4 py-2 border-b">
              <div className="flex items-start gap-2">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="预览图片"
                    className="max-w-[100px] max-h-[100px] rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity touch-manipulation"
                    onClick={() => openImagePreview(imagePreview)}
                    style={{ touchAction: 'manipulation' }}
                  />
                  <Button
                    type="button"
                    onClick={removeImage}
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  >
                    <X size={12} />
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    图片已准备就绪
                  </p>
                  <p className="text-xs text-gray-500">
                    点击图片预览或发送即可使用视觉模型分析
                  </p>
                </div>
              </div>
            </div>
          )}

          <CardFooter className="p-4">
            <form onSubmit={handleSubmit} className="flex w-full gap-2 relative">
              <Textarea
                placeholder={getModelDisplayName(selectedModelId)}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading && !isStreaming}
                className="flex-1 min-h-[40px] z-20 overflow-x-hidden text-ellipsis"
                maxRows={3}
                style={{
                  height: input ? 'auto' : '40px',
                  alignSelf: 'flex-end'
                }}
              />

              {/* 文件上传按钮 */}
              <div className="shrink-0 self-end">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
              />
              <Button 
                type="button" 
                  variant="outline"
                  onClick={() => document.getElementById('image-upload').click()}
                  className={`h-[40px] w-[40px] rounded-md flex items-center justify-center p-0 ${uploadedImage ? 'bg-primary text-primary-foreground' : 'text-gray-500 border-gray-300'}`}
                  title={uploadedImage ? "已选择图片" : "上传图片"}
                >
                  <Upload size={16} />
              </Button>
              </div>

              {isStreaming ? (
                <Button 
                  type="button" 
                  onClick={stopStreaming}
                  variant="destructive"
                  className="shrink-0 h-[40px] self-end"
                >
                  <StopCircle size={16} className="mr-2" />
                  停止
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isLoading || isVisionAnalyzing || (!input.trim() && !uploadedImage)}
                  className="shrink-0 h-[40px] w-[40px] self-end rounded-md flex items-center justify-center p-0"
                >
                  <Send size={16} />
                </Button>
              )}
            </form>
          </CardFooter>
        </Card>
      </div>
    </Layout>
    </>
  );
} 