import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Bot, User, Trash, StopCircle, Cpu, Trash2, Globe } from 'lucide-react';
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
  const [selectedModelId, setSelectedModelId] = useState(AI_MODELS[0].id);
  const [currentModelId, setCurrentModelId] = useState(AI_MODELS[0].id); // 跟踪当前实际使用的模型
  const [isWebEnabled, setIsWebEnabled] = useState(false); // 联网功能状态
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
   * 处理模型变更
   * @param {string} modelId - 选择的模型ID
   */
  const handleModelChange = (modelId) => {
    // 如果正在生成，先停止
    if (isStreaming) {
      stopStreaming();
    }
    
    setSelectedModelId(modelId);
    setCurrentModelId(modelId); // 更新当前使用的模型
    
    // 根据模型类型更新欢迎消息
    const selectedModelInfo = AI_MODELS.find(model => model.id === modelId);
    if (selectedModelInfo) {
      let welcomeMessage = `你好！我是${selectedModelInfo.name}，`;
      
      switch (selectedModelInfo.type) {
        case 'text':
          welcomeMessage += '我可以回答你的问题和进行文本对话。';
          break;
        case 'document':
          welcomeMessage += '我可以帮助你分析和理解文档内容。';
          break;
        case 'image':
          welcomeMessage += '我可以根据你的描述生成图片。';
          break;
        case 'agent':
          welcomeMessage += '我是一个高级Agent，可以执行复杂的任务和推理。';
          break;
        default:
          welcomeMessage += '有什么我可以帮助你的吗？';
      }
      
      // 更新欢迎消息
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
      
      // 显示提示
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
    if (!input.trim() || (isLoading && !isStreaming)) return;

    // 添加用户消息
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // 滚动到底部
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // 设置加载状态
    setIsLoading(true);
    setIsStreaming(false);
    
    // 创建AbortController用于取消请求
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // 获取当前选择的模型
    const selectedModel = AI_MODELS.find(m => m.id === selectedModelId);
    // 更新当前使用的模型ID
    setCurrentModelId(selectedModelId);
    
    // 发送请求到API
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input,
        history: messages,
        model: selectedModelId,
        isWebEnabled: isWebEnabled // 添加联网状态
      }),
      signal: controller.signal,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // 设置流式输出状态
      setIsStreaming(true);
      
      // 添加一个空的助手消息，用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      // 创建一个读取流的函数
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
          
          // 更新最后一条消息，提示用户
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
              if (!newMessages[newMessages.length - 1].content) {
                newMessages[newMessages.length - 1].content = '抱歉，响应超时。请重试或检查网络连接。';
              }
            }
            return newMessages;
          });
          
          setIsLoading(false);
        }
      }, 30000); // 30秒超时
      
      // 读取流数据的函数
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
            
            // 解码数据
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            // 处理每一行数据
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.content) {
                    // 更新助手消息
                    assistantMessage += data.content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages.length > 0) {
                        newMessages[newMessages.length - 1].content = assistantMessage;
                      }
                      return newMessages;
                    });
                    
                    // 滚动到底部
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
          
          // 只有在仍然处于流式状态时才更新UI
          if (isStreaming) {
            setIsStreaming(false);
            setIsLoading(false);
            
            // 更新最后一条消息，提示错误
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
      
      // 开始读取流
      readStream();
    })
    .catch(error => {
      console.error('请求出错:', error);
      setIsLoading(false);
      setIsStreaming(false);
      
      // 添加错误消息
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `抱歉，请求失败: ${error.message}。请检查网络连接或稍后重试。` 
      }]);
      
      toast({
        title: "请求失败",
        description: error.message,
        variant: "destructive"
      });
    });
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
   * 切换联网功能状态
   */
  const toggleWebEnabled = () => {
    setIsWebEnabled(prev => !prev);
  };

  return (
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
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              {isLoading && !isStreaming && (
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
              <Button 
                type="button" 
                onClick={toggleWebEnabled}
                variant={isWebEnabled ? "default" : "outline"}
                className={`shrink-0 h-[40px] w-[40px] self-end rounded-md flex items-center justify-center p-0 ${!isWebEnabled ? 'text-gray-500 border-gray-300' : ''}`}
                title={isWebEnabled ? "已开启联网" : "点击开启联网"}
              >
                <Globe size={16} />
              </Button>
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
                  disabled={isLoading || !input.trim()}
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
  );
} 