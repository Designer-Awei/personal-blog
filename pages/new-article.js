import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout';
import NewArticleForm from '../components/NewArticleForm';
import { toast } from '../components/ui/use-toast';

export default function NewArticle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (articleData) => {
    setIsSubmitting(true);
    try {
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
        
        // 跳转到新创建的文章页面
        setTimeout(() => {
          router.push(`/posts/${data.slug}`);
        }, 1500);
      } else {
        toast({
          title: "创建失败",
          description: data.message,
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