import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout';
import NewArticleForm from '../components/NewArticleForm';
import { toast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { isLocalEnvironment } from '../lib/utils';

export default function NewArticle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocalEnv, setIsLocalEnv] = useState(false);
  const router = useRouter();

  // 检测是否在本地环境中
  useEffect(() => {
    const isLocal = isLocalEnvironment();
    setIsLocalEnv(isLocal);
    
    // 如果不是本地环境，重定向到首页
    if (!isLocal) {
      toast({
        title: "访问受限",
        description: "创建文章功能仅在本地环境可用",
        variant: "destructive"
      });
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (articleData) => {
    // 如果不是本地环境，禁止提交
    if (!isLocalEnv) {
      toast({
        title: "功能暂不可用",
        description: "创建文章功能仅在本地环境可用，请在本地开发环境中使用此功能。",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("new-article页面接收到的数据:", articleData);
      
      // 确保slug存在
      if (!articleData.slug) {
        // 如果没有slug，尝试从标题生成
        // 修改逻辑以处理汉字
        if (/^[a-zA-Z0-9\s]+$/.test(articleData.title)) {
          articleData.slug = articleData.title
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '-');
        } else {
          // 对于包含汉字的标题，使用时间戳
          const timestamp = new Date().getTime();
          articleData.slug = `article-${timestamp}`;
        }
        
        // 如果仍然无法生成slug，使用时间戳作为后备方案
        if (!articleData.slug) {
          articleData.slug = `article-${new Date().getTime()}`;
        }
        
        console.log("在new-article页面生成的slug:", articleData.slug);
      }
      
      const response = await fetch('/api/create-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "文章创建成功",
          description: "正在跳转到文章页面",
          variant: "default"
        });
        
        // 如果是Vercel环境，需要特殊处理
        if (data.isVercel) {
          // 在Vercel环境中，我们可能需要将文章内容保存到localStorage或其他客户端存储
          // 这里我们简单地将文章内容保存到localStorage
          try {
            const articles = JSON.parse(localStorage.getItem('articles') || '[]');
            articles.push({
              slug: data.slug,
              content: data.content,
              date: new Date().toISOString()
            });
            localStorage.setItem('articles', JSON.stringify(articles));
          } catch (storageError) {
            console.error('保存文章到本地存储失败:', storageError);
          }
        }
        
        // 跳转到新创建的文章页面
        setTimeout(() => {
          router.push(`/posts/${data.slug}`);
        }, 1500);
      } else {
        console.error('创建文章失败:', data);
        toast({
          title: "创建失败",
          description: data.message || "服务器错误，请稍后再试",
          variant: "destructive"
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('创建文章时出错:', error);
      toast({
        title: "创建失败",
        description: "创建文章失败，请重试",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // 如果在Vercel环境中，显示功能不可用的提示
  if (isVercelEnv) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-4">
            <Button 
              variant="ghost" 
              className="flex items-center gap-1"
              onClick={() => router.push('/')}
            >
              <ArrowLeft size={16} />
              <span>返回首页</span>
            </Button>
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" size={24} />
                功能暂不可用
              </CardTitle>
              <CardDescription>
                在Vercel环境中暂不支持新增文章功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                由于Vercel的无服务器环境限制，目前不支持在此环境中创建新文章。我们正在开发使用数据库的解决方案，敬请期待。
              </p>
              <p>
                如需使用此功能，请在本地开发环境中运行应用。
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">创建新文章</h1>
        <NewArticleForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </Layout>
  );
} 