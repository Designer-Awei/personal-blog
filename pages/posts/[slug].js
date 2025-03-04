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
// 这些导入将在客户端使用
import { remark } from 'remark';
import html from 'remark-html';
import { isVercelEnvironment, isLocalEnvironment } from '../../lib/utils';

export default function Post({ post, useClientFetch, slug }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [clientPost, setClientPost] = useState(post);
    const [isLoading, setIsLoading] = useState(useClientFetch);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [isVercelEnv, setIsVercelEnv] = useState(false);
    
    // 如果需要在客户端获取文章内容
    useEffect(() => {
        if (useClientFetch && slug) {
            const fetchArticle = async () => {
                try {
                    setIsLoading(true);
                    console.log('客户端尝试获取文章内容，slug:', slug);
                    
                    const response = await fetch(`/api/get-article?slug=${slug}`);
                    
                    if (!response.ok) {
                        console.error('获取文章内容失败，状态码:', response.status);
                        throw new Error('无法获取文章内容');
                    }
                    
                    const articleData = await response.json();
                    console.log('客户端成功获取文章内容:', articleData.title);
                    
                    // 将Markdown转换为HTML
                    const contentHtml = marked(articleData.content);
                    
                    setClientPost({
                        ...articleData,
                        contentHtml
                    });
                    setIsLoading(false);
                } catch (error) {
                    console.error('获取文章内容时出错:', error);
                    setError('无法加载文章内容');
                    setIsLoading(false);
                }
            };
            
            fetchArticle();
        }
    }, [useClientFetch, slug]);
    
    // 获取文章的点赞和收藏状态 - 将这个useEffect移到这里，确保它在所有条件渲染之前被调用
    const currentPost = clientPost || post;
    
    useEffect(() => {
        // 只有当有文章数据时才获取交互状态
        if (currentPost) {
            const fetchInteractions = async () => {
                try {
                    // 获取点赞状态
                    const likeRes = await fetch(`/api/interactions/like`);
                    const likeData = await likeRes.json();
                    
                    // 获取收藏状态
                    const favoriteRes = await fetch(`/api/interactions/favorite`);
                    const favoriteData = await favoriteRes.json();
                    
                    // 使用当前文章的slug
                    const currentSlug = currentPost.slug || slug;
                    
                    setLiked(likeData.like && likeData.like.includes(currentSlug));
                    setFavorited(favoriteData.favorite && favoriteData.favorite.includes(currentSlug));
                } catch (error) {
                    console.error('获取交互状态时出错:', error);
                }
            };
            
            fetchInteractions();
        }
    }, [currentPost, slug]);
    
    useEffect(() => {
        setIsVercelEnv(!isLocalEnvironment());
    }, []);
    
    // 如果页面正在加载或没有文章数据，显示加载状态
    if (router.isFallback || isLoading) {
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
    
    // 如果出现错误，显示错误状态
    if (error) {
        return (
            <Layout>
                <div className="container mx-auto py-8">
                    <div className="flex flex-col justify-center items-center h-64">
                        <p className="text-lg text-red-500 dark:text-red-400 mb-4">{error}</p>
                        <Link href="/" passHref legacyBehavior>
                            <a>
                                <Button variant="outline" className="flex items-center gap-1">
                                    <ArrowLeft size={16} />
                                    <span>返回首页</span>
                                </Button>
                            </a>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }
    
    // 如果没有文章数据，显示错误状态
    if (!currentPost) {
        return (
            <Layout>
                <div className="container mx-auto py-8">
                    <div className="flex flex-col justify-center items-center h-64">
                        <p className="text-lg text-red-500 dark:text-red-400 mb-4">无法加载文章</p>
                        <Link href="/" passHref legacyBehavior>
                            <a>
                                <Button variant="outline" className="flex items-center gap-1">
                                    <ArrowLeft size={16} />
                                    <span>返回首页</span>
                                </Button>
                            </a>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }
    
    // 使用客户端获取的文章数据或服务器端渲染的文章数据
    const { title, date, content, contentHtml } = currentPost;

    const handleEdit = () => {
        if (!isLocalEnvironment()) {
            toast({
                title: "功能暂不可用",
                description: "编辑文章功能仅在本地环境可用，请在本地开发环境中使用此功能。",
                variant: "destructive"
            });
            return;
        }
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveArticle = async (updatedArticle) => {
        setIsSaving(true);
        try {
            // 使用当前文章的slug
            const currentSlug = currentPost.slug || slug;
            
            const response = await fetch('/api/save-article', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug: currentSlug,
                    title: updatedArticle.title,
                    content: updatedArticle.content,
                    excerpt: updatedArticle.excerpt,
                    date: updatedArticle.date,
                    category: updatedArticle.category,
                    coverImage: updatedArticle.coverImage
                }),
            });

            if (!response.ok) {
                throw new Error('保存文章失败');
            }

            const data = await response.json();
            
            // 更新客户端文章数据
            setClientPost({
                ...clientPost,
                title: updatedArticle.title,
                content: updatedArticle.content,
                excerpt: updatedArticle.excerpt,
                date: updatedArticle.date,
                category: updatedArticle.category,
                coverImage: updatedArticle.coverImage,
                contentHtml: marked(updatedArticle.content)
            });
            
            setIsEditing(false);
            toast({
                title: "保存成功",
                description: "文章已成功保存",
            });
        } catch (error) {
            console.error('保存文章时出错:', error);
            toast({
                title: "保存失败",
                description: "保存文章时出错",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 处理点赞
    const handleLike = async () => {
        try {
            // 使用当前文章的slug
            const currentSlug = currentPost.slug || slug;
            
            const response = await fetch('/api/interactions/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug: currentSlug,
                    action: liked ? 'unlike' : 'like',
                }),
            });

            if (!response.ok) {
                throw new Error('点赞操作失败');
            }

            setLiked(!liked);
            
            toast({
                title: liked ? "取消点赞" : "点赞成功",
                description: liked ? "您已取消点赞" : "感谢您的点赞",
            });
        } catch (error) {
            console.error('点赞操作时出错:', error);
            toast({
                title: "操作失败",
                description: "点赞操作时出错",
                variant: "destructive",
            });
        }
    };

    // 处理收藏
    const handleFavorite = async () => {
        try {
            // 使用当前文章的slug
            const currentSlug = currentPost.slug || slug;
            
            const response = await fetch('/api/interactions/favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug: currentSlug,
                    action: favorited ? 'unfavorite' : 'favorite',
                }),
            });

            if (!response.ok) {
                throw new Error('收藏操作失败');
            }

            setFavorited(!favorited);
            
            toast({
                title: favorited ? "取消收藏" : "收藏成功",
                description: favorited ? "您已取消收藏" : "文章已加入收藏",
            });
        } catch (error) {
            console.error('收藏操作时出错:', error);
            toast({
                title: "操作失败",
                description: "收藏操作时出错",
                variant: "destructive",
            });
        }
    };

    // 处理分享
    const handleShare = async () => {
        try {
            // 使用当前文章的slug
            const currentSlug = currentPost.slug || slug;
            
            // 构建分享链接
            const shareUrl = `${window.location.origin}/posts/${currentSlug}`;
            
            // 如果浏览器支持Web Share API
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: `查看这篇文章：${title}`,
                    url: shareUrl,
                });
                
                toast({
                    title: "分享成功",
                    description: "文章已成功分享",
                });
            } else {
                // 复制链接到剪贴板
                await navigator.clipboard.writeText(shareUrl);
                
                toast({
                    title: "链接已复制",
                    description: "文章链接已复制到剪贴板",
                });
            }
        } catch (error) {
            console.error('分享操作时出错:', error);
            toast({
                title: "分享失败",
                description: "分享文章时出错",
                variant: "destructive",
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
                            content: currentPost.content,
                            excerpt: currentPost.excerpt,
                            date: date,
                            category: currentPost.category,
                            coverImage: currentPost.coverImage
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
                    {isLocalEnvironment() && (
                        <Button onClick={handleEdit} className="flex items-center gap-1">
                            <Edit size={16} />
                            <span>编辑文章</span>
                        </Button>
                    )}
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
                        
                        {currentPost.coverImage && (
                            <div className="px-6 pb-4">
                                <img 
                                    src={currentPost.coverImage} 
                                    alt={title}
                                    className="w-full h-auto rounded-lg object-cover max-h-[400px]"
                                />
                            </div>
                        )}
                        
                        <CardContent>
                            <div 
                                className="prose dark:prose-invert max-w-none animate-fade-in article-content"
                                dangerouslySetInnerHTML={{ __html: contentHtml }}
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

export async function getStaticPaths() {
    try {
        // 动态导入fs和path模块
        const fs = await import('fs');
        const path = await import('path');
        
        // 尝试多个可能的内容目录路径
        const possibleContentDirs = [
            path.join(process.cwd(), 'content'),
            path.join(process.cwd(), '.next/server/content'),
            path.join(process.cwd(), '.next/content'),
            path.join(process.cwd(), '../content'),
            path.join(process.cwd(), '../../content')
        ];
        
        let contentDir = null;
        let files = [];
        
        // 尝试从各个可能的路径读取文件列表
        for (const possibleDir of possibleContentDirs) {
            try {
                console.log('尝试读取内容目录:', possibleDir);
                if (fs.existsSync(possibleDir)) {
                    contentDir = possibleDir;
                    files = fs.readdirSync(possibleDir).filter(file => file.endsWith('.md'));
                    console.log('成功从目录读取文件列表:', possibleDir, files.length);
                    break;
                }
            } catch (err) {
                console.log('无法从目录读取文件列表:', possibleDir, err.message);
            }
        }
        
        console.log('获取静态路径，内容目录:', contentDir);
        
        // 如果没有找到任何内容目录或文件，返回空路径
        if (!contentDir || files.length === 0) {
            console.error('未找到有效的文章目录或文件');
            return {
                paths: [],
                fallback: true // 改为true，允许在运行时生成页面
            };
        }
        
        console.log('找到的Markdown文件:', files);
        
        // 为每个文件创建路径
        const paths = files.map(file => ({
            params: {
                slug: file.replace(/\.md$/, '')
            }
        }));
        
        console.log('生成的路径:', paths);
        
        return {
            paths,
            fallback: true // 改为true，允许在运行时生成页面
        };
    } catch (error) {
        console.error('获取文章路径时出错:', error);
        return {
            paths: [],
            fallback: true // 改为true，允许在运行时生成页面
        };
    }
}

export async function getStaticProps({ params }) {
    const { slug } = params;
    
    console.log('获取静态属性，文章slug:', slug);
    
    try {
        // 动态导入fs和path模块
        const fs = await import('fs');
        const path = await import('path');
        const matter = await import('gray-matter').then(mod => mod.default || mod);
        
        // 尝试多个可能的路径
        const possiblePaths = [
            path.join(process.cwd(), 'content', `${slug}.md`),
            path.join(process.cwd(), '.next/server/content', `${slug}.md`),
            path.join(process.cwd(), '.next/content', `${slug}.md`),
            path.join(process.cwd(), '../content', `${slug}.md`),
            path.join(process.cwd(), '../../content', `${slug}.md`)
        ];
        
        let fileContents = null;
        let filePath = null;
        
        // 尝试从各个可能的路径读取文件
        for (const possiblePath of possiblePaths) {
            try {
                console.log('尝试读取文件:', possiblePath);
                if (fs.existsSync(possiblePath)) {
                    fileContents = fs.readFileSync(possiblePath, 'utf8');
                    filePath = possiblePath;
                    console.log('成功从路径读取文件:', possiblePath);
                    break;
                }
            } catch (err) {
                console.log('无法从路径读取文件:', possiblePath, err.message);
            }
        }
        
        // 如果所有路径都失败，则返回useClientFetch为true，让客户端尝试获取
        if (!fileContents) {
            console.error('所有路径都无法找到文件:', slug);
            return {
                props: {
                    slug,
                    useClientFetch: true
                },
                revalidate: 10
            };
        }
        
        console.log('成功读取文件内容，长度:', fileContents.length);
        
        // 解析文章内容
        const { data, content } = matter(fileContents);
        console.log('解析的文章元数据:', data);
        
        // 将Markdown转换为HTML，使用顶部导入的remark和html
        const processedContent = await remark()
            .use(html)
            .process(content);
        const contentHtml = processedContent.toString();
        
        // 确保日期格式正确
        let formattedDate;
        try {
            formattedDate = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
        } catch (dateError) {
            console.error('日期格式化错误:', dateError);
            formattedDate = new Date().toISOString();
        }
        
        return {
            props: {
                post: {
                    slug,
                    title: data.title || slug,
                    date: formattedDate,
                    excerpt: data.excerpt || '',
                    category: data.category || '未分类',
                    coverImage: data.coverImage || null,
                    content: content,
                    contentHtml: contentHtml
                },
                useClientFetch: false
            },
            // 每分钟重新生成页面
            revalidate: 60 // 减少到60秒，更频繁地重新验证
        };
    } catch (error) {
        console.error('获取文章数据时出错:', error, error.stack);
        
        // 在出错的情况下，返回useClientFetch为true，让客户端尝试获取
        return {
            props: {
                slug,
                useClientFetch: true
            },
            revalidate: 10
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