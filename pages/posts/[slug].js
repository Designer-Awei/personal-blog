import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import ArticleEditor from '../../components/ArticleEditor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Edit, ArrowLeft, Heart, Bookmark, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from '../../components/ui/use-toast';

export default function Post({ post }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const router = useRouter();
    
    // 如果页面正在加载或没有文章数据，显示加载状态
    if (router.isFallback || !post) {
        return (
            <Layout>
                <div className="container mx-auto py-8">
                    <div className="flex justify-center items-center h-64">
                        <p className="text-lg text-gray-500 dark:text-gray-400">正在加载文章...</p>
                    </div>
                </div>
            </Layout>
        );
    }
    
    const { title, date, content, slug } = post;

    // 获取文章的点赞和收藏状态
    useEffect(() => {
        const fetchInteractions = async () => {
            try {
                // 获取点赞状态
                const likeRes = await fetch(`/api/interactions/like`);
                const likeData = await likeRes.json();
                
                // 获取收藏状态
                const favoriteRes = await fetch(`/api/interactions/favorite`);
                const favoriteData = await favoriteRes.json();
                
                setLiked(likeData.like && likeData.like.includes(slug));
                setFavorited(favoriteData.favorite && favoriteData.favorite.includes(slug));
            } catch (error) {
                console.error('获取交互状态时出错:', error);
            }
        };
        
        fetchInteractions();
    }, [slug]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveArticle = async (updatedArticle) => {
        setIsSaving(true);
        try {
            console.log('准备保存文章:', { 
                slug, 
                title: updatedArticle.title,
                contentLength: updatedArticle.content?.length || 0
            });
            
            const response = await fetch('/api/save-article', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug,
                    title: updatedArticle.title,
                    content: updatedArticle.content,
                    excerpt: updatedArticle.excerpt,
                    date: updatedArticle.date,
                    category: updatedArticle.category,
                    coverImage: updatedArticle.coverImage
                }),
            });

            console.log('保存文章响应状态:', response.status);
            const data = await response.json();
            console.log('保存文章响应数据:', data);
            
            if (data.success) {
                toast({
                    title: "保存成功",
                    description: "文章已成功保存",
                    variant: "default"
                });
                // 刷新页面以显示更新后的内容
                router.reload();
            } else {
                toast({
                    title: "保存失败",
                    description: data.message || "未知错误",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('保存文章时出错:', error);
            toast({
                title: "保存失败",
                description: "保存文章失败，请重试",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    // 处理点赞
    const handleLike = async () => {
        try {
            const method = liked ? 'DELETE' : 'POST';
            
            const response = await fetch(`/api/interactions/like`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ slug }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setLiked(!liked);
                toast({
                    title: !liked ? "已点赞" : "已取消点赞",
                    description: data.message,
                    variant: "default"
                });
            } else {
                toast({
                    title: "操作失败",
                    description: data.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            toast({
                title: "操作失败",
                description: "点赞操作失败，请重试",
                variant: "destructive"
            });
        }
    };

    // 处理收藏
    const handleFavorite = async () => {
        try {
            const method = favorited ? 'DELETE' : 'POST';
            
            const response = await fetch(`/api/interactions/favorite`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ slug }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setFavorited(!favorited);
                toast({
                    title: !favorited ? "已收藏" : "已取消收藏",
                    description: data.message,
                    variant: "default"
                });
            } else {
                toast({
                    title: "操作失败",
                    description: data.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            toast({
                title: "操作失败",
                description: "收藏操作失败，请重试",
                variant: "destructive"
            });
        }
    };

    // 处理分享
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: post.excerpt,
                    url: window.location.href,
                });
            } else {
                // 复制链接到剪贴板
                await navigator.clipboard.writeText(window.location.href);
                toast({
                    title: "链接已复制",
                    description: "文章链接已复制到剪贴板",
                    variant: "default"
                });
            }
        } catch (error) {
            console.error('分享失败:', error);
            toast({
                title: "分享失败",
                description: "无法分享文章，请重试",
                variant: "destructive"
            });
        }
    };

    if (isEditing) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <ArticleEditor
                        article={{
                            title: title,
                            content: post.content,
                            excerpt: post.excerpt,
                            date: date,
                            category: post.category,
                            coverImage: post.coverImage
                        }}
                        onSave={handleSaveArticle}
                        onCancel={handleCancelEdit}
                    />
                </div>
            </Layout>
        );
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
                    <Link href="/" passHref legacyBehavior>
                        <a>
                            <Button variant="ghost" className="flex items-center gap-1">
                                <ArrowLeft size={16} />
                                <span>返回首页</span>
                            </Button>
                        </a>
                    </Link>
                    <Button onClick={handleEdit} className="flex items-center gap-1">
                        <Edit size={16} />
                        <span>编辑文章</span>
                    </Button>
                </div>

                <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card className="shadow-md card-hover-effect">
                        <CardHeader>
                            <CardTitle className="text-3xl">{title}</CardTitle>
                            <p className="text-gray-500 dark:text-gray-400">
                                {new Date(date).toLocaleDateString('zh-CN')}
                            </p>
                        </CardHeader>
                        
                        {post.coverImage && (
                            <div className="px-6 pb-4">
                                <img 
                                    src={post.coverImage} 
                                    alt={title}
                                    className="w-full h-auto rounded-lg object-cover max-h-[400px]"
                                />
                            </div>
                        )}
                        
                        <CardContent>
                            <div 
                                className="prose dark:prose-invert max-w-none animate-fade-in article-content"
                                dangerouslySetInnerHTML={{ __html: post.contentHtml || marked(post.content) }}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-4">
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleLike}
                                    className={`p-2 rounded-full ${liked ? 'bg-red-100 dark:bg-red-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                >
                                    <Heart 
                                        size={20} 
                                        className={liked ? 'text-red-500 fill-red-500' : 'text-gray-500 dark:text-gray-400'} 
                                    />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleFavorite}
                                    className={`p-2 rounded-full ${favorited ? 'bg-yellow-100 dark:bg-yellow-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                >
                                    <Bookmark 
                                        size={20} 
                                        className={favorited ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 dark:text-gray-400'} 
                                    />
                                </motion.button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleShare}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Share size={20} className="text-gray-500 dark:text-gray-400" />
                            </motion.button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>
        </Layout>
    );
}

export async function getServerSideProps({ params, req }) {
    const { slug } = params;
    
    try {
        // 获取当前请求的主机信息，包括正确的端口
        const host = req.headers.host || 'localhost:3000';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`;
        
        // 确保URL格式正确
        const apiUrl = new URL(`/api/posts/${slug}`, baseUrl).toString();
        
        console.log(`尝试获取文章数据，API URL: ${apiUrl}`);
        
        // 尝试从API获取文章数据
        const res = await fetch(apiUrl);
        
        // 如果API返回成功，使用API数据
        if (res.ok) {
            const post = await res.json();
            console.log(`成功获取文章数据: ${slug}`);
            return {
                props: { post }
            };
        }
        
        console.log(`API请求失败，状态码: ${res.status}`);
        
        // 如果API请求失败，返回404
        return {
            notFound: true
        };
    } catch (error) {
        console.error('获取文章数据时出错:', error);
        return {
            notFound: true
        };
    }
}

export const runtime = 'nodejs';

export function Head() {
    return (
        <>
            <style jsx global>{`
                .article-content p {
                    text-indent: 2em;
                }
            `}</style>
        </>
    );
} 