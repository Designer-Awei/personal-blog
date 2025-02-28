import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import Layout from '../components/layout';
import ImageUploader from '../components/ImageUploader';
import { getUserConfig } from '../lib/userConfig';

export default function Home({ posts, userConfig: initialUserConfig }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [userConfig, setUserConfig] = useState(initialUserConfig);
  const [profileImage, setProfileImage] = useState(initialUserConfig.profileImage);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpdate = async (imageData) => {
    try {
      // 上传图片到服务器
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 更新用户配置
        await fetch('/api/user-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profileImage: data.imageUrl }),
        });

        // 更新本地状态
        setProfileImage(data.imageUrl);
      }
    } catch (error) {
      console.error('上传图片时出错:', error);
      alert('上传图片失败，请重试');
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 个人信息区域 - 左侧 */}
        <div className="md:col-span-1 sticky top-4 self-start">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>关于我</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-4">
                <ImageUploader 
                  onImageUpdate={handleImageUpdate}
                  currentImage={profileImage}
                />
                <h2 className="text-xl font-bold">{userConfig.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">设计师</p>
              </div>
              <div className="space-y-2">
                <p><strong>邮箱:</strong> {userConfig.email}</p>
                <p><strong>位置:</strong> {userConfig.location}</p>
                <p><strong>技能:</strong> {userConfig.skills}</p>
                <p className="mt-4">{userConfig.bio}</p>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-4">
                {userConfig.socialLinks.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 文章列表区域 - 右侧 */}
        <div className="md:col-span-3">
          <div className="mb-6">
            <Input
              type="text"
              placeholder="搜索文章..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <Link href={`/posts/${post.slug}`} key={post.slug}>
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>{new Date(post.date).toLocaleDateString('zh-CN')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{post.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-blue-500">阅读更多 →</p>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl">没有找到匹配的文章</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">尝试使用不同的搜索词</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  // 获取文章列表
  const files = fs.readdirSync(path.join('markdown'));
  
  const posts = files.map(filename => {
    const slug = filename.replace('.md', '');
    const markdownWithMeta = fs.readFileSync(
      path.join('markdown', filename),
      'utf-8'
    );
    
    const { data: frontmatter, content } = matter(markdownWithMeta);
    
    return {
      slug,
      title: frontmatter.title,
      date: frontmatter.date,
      excerpt: frontmatter.excerpt,
    };
  });
  
  // 获取用户配置
  const userConfig = getUserConfig();
  
  return {
    props: {
      posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date)),
      userConfig,
    },
  };
} 