import { useState } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import ArticleEditor from '../../components/ArticleEditor';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Edit, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Post({ frontmatter, slug, content }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveArticle = async (updatedArticle) => {
        setIsSaving(true);
        try {
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
                    date: updatedArticle.date
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                // 刷新页面以显示更新后的内容
                router.reload();
            } else {
                alert('保存失败: ' + data.message);
            }
        } catch (error) {
            console.error('保存文章时出错:', error);
            alert('保存文章失败，请重试');
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <ArticleEditor
                        article={{
                            title: frontmatter.title,
                            content: content,
                            excerpt: frontmatter.excerpt,
                            date: frontmatter.date
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
                    <Link href="/">
                        <Button variant="ghost" className="flex items-center gap-1">
                            <ArrowLeft size={16} />
                            <span>返回首页</span>
                        </Button>
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
                            <CardTitle className="text-3xl">{frontmatter.title}</CardTitle>
                            <p className="text-gray-500 dark:text-gray-400">
                                {new Date(frontmatter.date).toLocaleDateString('zh-CN')}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="prose dark:prose-invert max-w-none animate-fade-in"
                                dangerouslySetInnerHTML={{ __html: marked(content) }}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </Layout>
    );
}

export async function getStaticPaths() {
    const files = fs.readdirSync(path.join('markdown'));

    const paths = files.map(filename => ({
        params: {
            slug: filename.replace('.md', '')
        }
    }));

    return {
        paths,
        fallback: false
    };
}

export async function getStaticProps({ params: { slug } }) {
    const markdownWithMeta = fs.readFileSync(
        path.join('markdown', `${slug}.md`),
        'utf-8'
    );

    const { data: frontmatter, content } = matter(markdownWithMeta);

    return {
        props: {
            frontmatter,
            slug,
            content
        }
    };
} 