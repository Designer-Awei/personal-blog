import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Bot, User, Trash, StopCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from '../components/ui/use-toast';
import Layout from '../components/layout';

/**
 * AI聊天室页面组件
 * @returns {JSX.Element} 聊天室页面
 */
export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是你的AI助手，有什么我可以帮助你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  /**
   * 处理消息发送
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 如果正在流式输出，先停止
    if (isStreaming) {
      stopStreaming();
    }

    // 添加用户消息
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    // 创建一个新的空AI消息
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      // 准备发送给API的历史消息（不包括欢迎消息和最新的空消息）
      const messageHistory = messages.slice(1, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // 创建AbortController用于取消请求
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // 发送请求到API
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          history: messageHistory
        }),
        signal
      };
      
      const response = await fetch('/api/chat', fetchOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '发送消息失败');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      // 读取流数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 解码数据
        const chunk = decoder.decode(value, { stream: false });
        buffer += chunk;
        
        // 处理完整的SSE消息
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // 保留最后一个可能不完整的消息
        
        for (const part of parts) {
          if (part.trim() && part.startsWith('data: ')) {
            try {
              const data = JSON.parse(part.slice(6).trim()); // 移除 'data: ' 前缀
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.fullText) {
                // 使用服务器发送的完整文本更新消息
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = data.fullText;
                  return newMessages;
                });
              } else if (data.content && !data.fullText) {
                // 兼容旧版API，如果没有fullText则使用content
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = (lastMessage.content || '') + data.content;
                  return newMessages;
                });
              }
              
              if (data.done) {
                // 流结束
                setIsStreaming(false);
                break;
              }
            } catch (e) {
              console.error('解析流数据出错:', e, part);
            }
          }
        }
      }
      
      // 处理缓冲区中剩余的数据
      if (buffer.trim() && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6).trim());
          
          if (data.fullText) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              lastMessage.content = data.fullText;
              return newMessages;
            });
          } else if (data.content && !data.fullText) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              lastMessage.content = (lastMessage.content || '') + data.content;
              return newMessages;
            });
          }
          
          if (data.done) {
            setIsStreaming(false);
          }
        } catch (e) {
          console.error('解析剩余流数据出错:', e, buffer);
        }
      }
    } catch (error) {
      // 检查是否是用户主动取消
      if (error.name === 'AbortError') {
        console.log('用户取消了请求');
      } else {
        console.error('Error sending message:', error);
        toast({
          title: '发送消息失败',
          description: error.message || '请稍后再试',
          variant: 'destructive',
        });
        
        // 更新最后一条消息为错误消息
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.content = '抱歉，我遇到了一些问题，无法回答您的问题。请稍后再试。';
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
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

  return (
    <Layout>
      <Head>
        <title>AI聊天室 | 个人博客</title>
        <meta name="description" content="与AI助手交流，获取帮助和建议" />
      </Head>

      <div className="container max-w-4xl mx-auto py-6 px-4 animate-fade-in">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">AI聊天室</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearChat}
            className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-100"
            title="清空聊天"
          >
            <Trash size={18} />
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader className="bg-muted/50 pb-2">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-2 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
              <CardTitle className="text-lg">智能助手</CardTitle>
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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                placeholder="输入你的问题..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading && !isStreaming}
                className="flex-1"
              />
              {isStreaming ? (
                <Button 
                  type="button" 
                  onClick={stopStreaming}
                  variant="destructive"
                >
                  <StopCircle size={16} className="mr-2" />
                  停止
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send size={16} className="mr-2" />
                  发送
                </Button>
              )}
            </form>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
} 