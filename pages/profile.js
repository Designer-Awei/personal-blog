import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Heart, Star, ArrowLeft, Calendar, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import ProfileEditor from '../components/ProfileEditor';
import { toast } from '../components/ui/use-toast';
import PasswordDialog from '../components/PasswordDialog';

export default function Profile({ userConfig: initialUserConfig }) {
  const [userConfig, setUserConfig] = useState(initialUserConfig);
  const [likedPosts, setLikedPosts] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPhoneVisible, setIsPhoneVisible] = useState(true);
  const [isEmailVisible, setIsEmailVisible] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingVisibilityAction, setPendingVisibilityAction] = useState(null);
  const router = useRouter();

  // 初始化时从localStorage读取隐藏状态
  useEffect(() => {
    // 从localStorage读取邮箱和电话隐藏状态
    const savedEmailVisible = localStorage.getItem('isEmailVisible');
    const savedPhoneVisible = localStorage.getItem('isPhoneVisible');
    
    if (savedEmailVisible !== null) {
      setIsEmailVisible(savedEmailVisible === 'true');
    }
    
    if (savedPhoneVisible !== null) {
      setIsPhoneVisible(savedPhoneVisible === 'true');
    }
  }, []);
  
  // 更新邮箱可见性状态并保存到localStorage
  const toggleEmailVisibility = () => {
    // 如果当前是可见状态，直接设置为不可见
    if (isEmailVisible) {
      const newState = false;
      setIsEmailVisible(newState);
      localStorage.setItem('isEmailVisible', newState.toString());
    } else {
      // 如果当前是不可见状态，需要验证密码
      setPendingVisibilityAction('email');
      setShowPasswordDialog(true);
    }
  };
  
  // 更新电话可见性状态并保存到localStorage
  const togglePhoneVisibility = () => {
    // 如果当前是可见状态，直接设置为不可见
    if (isPhoneVisible) {
      const newState = false;
      setIsPhoneVisible(newState);
      localStorage.setItem('isPhoneVisible', newState.toString());
    } else {
      // 如果当前是不可见状态，需要验证密码
      setPendingVisibilityAction('phone');
      setShowPasswordDialog(true);
    }
  };

  // 密码验证成功后的回调
  const handlePasswordSuccess = () => {
    setShowPasswordDialog(false);
    
    if (pendingVisibilityAction === 'email') {
      const newState = true;
      setIsEmailVisible(newState);
      localStorage.setItem('isEmailVisible', newState.toString());
    } else if (pendingVisibilityAction === 'phone') {
      const newState = true;
      setIsPhoneVisible(newState);
      localStorage.setItem('isPhoneVisible', newState.toString());
    }
    
    setPendingVisibilityAction(null);
  };

  // 取消密码验证的回调
  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    setPendingVisibilityAction(null);
  };

  // 获取互动数据和文章
  const fetchInteractionData = async () => {
    setIsLoading(true);
    try {
      // 获取点赞状态
      const likeRes = await fetch(`/api/interactions/like`);
      const likeData = await likeRes.json();
      
      // 获取收藏状态
      const favoriteRes = await fetch(`/api/interactions/favorite`);
      const favoriteData = await favoriteRes.json();
      
      const likedSlugs = likeData.like || [];
      const favoriteSlugs = favoriteData.favorite || [];
      
      setLikeCount(likedSlugs.length);
      setFavoriteCount(favoriteSlugs.length);
      
      // 获取所有文章
      const postsRes = await fetch('/api/posts');
      const allPosts = await postsRes.json();
      
      // 过滤出点赞和收藏的文章
      const likedPostsData = allPosts.filter(post => likedSlugs.includes(post.slug));
      const favoritePostsData = allPosts.filter(post => favoriteSlugs.includes(post.slug));
      
      setLikedPosts(likedPostsData);
      setFavoritePosts(favoritePostsData);
    } catch (error) {
      console.error('获取数据时出错:', error);
      toast({
        title: "获取数据失败",
        description: "无法获取最新的点赞和收藏数据，请刷新页面重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchInteractionData();
  }, []);

  // 监听路由变化，当用户返回到个人资料页面时重新获取数据
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (url === '/profile') {
        fetchInteractionData();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInteractionData();
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async (updatedProfile) => {
    try {
      const response = await fetch('/api/user-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (response.ok) {
        setUserConfig(updatedProfile);
        setIsEditing(false);
        toast({
          title: "保存成功",
          description: "个人资料已更新",
          variant: "default"
        });
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存个人信息时出错:', error);
      toast({
        title: "保存失败",
        description: "保存个人信息失败，请重试",
        variant: "destructive"
      });
    }
  };

  if (isEditing) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto mb-4">
          <Button 
            variant="ghost" 
            className="flex items-center gap-1"
            onClick={handleCancelEdit}
          >
            <ArrowLeft size={16} />
            <span>返回个人资料</span>
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">互动统计</CardTitle>
                <CardDescription>您的点赞和收藏数据</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                <span>刷新数据</span>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="text-red-500" size={18} />
                    点赞文章
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{likeCount}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">您已点赞 {likeCount} 篇文章</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="text-yellow-500" size={18} />
                    收藏文章
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{favoriteCount}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">您已收藏 {favoriteCount} 篇文章</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
        
        <div className="max-w-4xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：仅点赞的文章 */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="text-red-500" size={18} />
                仅点赞的文章 ({likedPosts.filter(post => !favoritePosts.some(fp => fp.slug === post.slug)).length})
              </CardTitle>
              <CardDescription>您点赞但未收藏的文章</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p>加载中...</p>
                </div>
              ) : likedPosts.filter(post => !favoritePosts.some(fp => fp.slug === post.slug)).length > 0 ? (
                <div className="space-y-4">
                  {likedPosts
                    .filter(post => !favoritePosts.some(fp => fp.slug === post.slug))
                    .map(post => (
                      <Card key={post.slug} className="card-hover-effect">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{post.title}</CardTitle>
                          <CardDescription className="text-xs flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(post.date).toLocaleDateString('zh-CN')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm line-clamp-2">{post.excerpt}</p>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="text-red-500 fill-red-500" size={16} />
                          </div>
                          <Link href={`/posts/${post.slug}`}>
                            <Button variant="outline" size="sm">阅读文章</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>您没有仅点赞的文章</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧：收藏的文章（包括同时点赞的） */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-yellow-500" size={18} />
                收藏的文章 ({favoritePosts.length})
              </CardTitle>
              <CardDescription>您收藏的所有文章</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p>加载中...</p>
                </div>
              ) : favoritePosts.length > 0 ? (
                <div className="space-y-4">
                  {favoritePosts.map(post => (
                    <Card key={post.slug} className="card-hover-effect">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{post.title}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(post.date).toLocaleDateString('zh-CN')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm line-clamp-2">{post.excerpt}</p>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="text-yellow-500 fill-yellow-500" size={16} />
                          {likedPosts.some(lp => lp.slug === post.slug) && (
                            <Heart className="text-red-500 fill-red-500" size={16} />
                          )}
                        </div>
                        <Link href={`/posts/${post.slug}`}>
                          <Button variant="outline" size="sm">阅读文章</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>您还没有收藏任何文章</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <ProfileEditor
          userConfig={userConfig}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
        />
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span>刷新数据</span>
          </Button>
        </div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">个人资料</CardTitle>
                <CardDescription>查看和管理您的个人信息</CardDescription>
              </div>
              <Button onClick={handleEditProfile}>编辑资料</Button>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex flex-col items-center mb-4">
                  {userConfig.profileImage ? (
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                      <img 
                        src={userConfig.profileImage} 
                        alt={userConfig.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 mb-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      照片
                    </div>
                  )}
                  <h2 className="text-xl font-bold">{userConfig.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userConfig.occupation || '设计师'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="flex items-center">
                  <strong>邮箱:</strong> 
                  <span className="ml-1">
                    {isEmailVisible ? userConfig.email : '****@**.com'}
                  </span>
                  <button 
                    onClick={toggleEmailVisibility} 
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {isEmailVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </p>
                <p className="flex items-center">
                  <strong>电话:</strong> 
                  <span className="ml-1">
                    {isPhoneVisible ? userConfig.phone || '15057616150' : '*** **** ****'}
                  </span>
                  <button 
                    onClick={togglePhoneVisibility} 
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {isPhoneVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </p>
                <p><strong>位置:</strong> {userConfig.location}</p>
                <p><strong>技能:</strong> {userConfig.skills}</p>
                <p className="mt-4">{userConfig.bio}</p>
                <div className="flex space-x-4 mt-4">
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
              </div>
            </CardContent>
          </Card>

          <div className="max-w-4xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧：仅点赞的文章 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="text-red-500" size={18} />
                  仅点赞的文章 ({likedPosts.filter(post => !favoritePosts.some(fp => fp.slug === post.slug)).length})
                </CardTitle>
                <CardDescription>您点赞但未收藏的文章</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    <p>加载中...</p>
                  </div>
                ) : likedPosts.filter(post => !favoritePosts.some(fp => fp.slug === post.slug)).length > 0 ? (
                  <div className="space-y-4">
                    {likedPosts
                      .filter(post => !favoritePosts.some(fp => fp.slug === post.slug))
                      .map(post => (
                        <Card key={post.slug} className="card-hover-effect">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{post.title}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(post.date).toLocaleDateString('zh-CN')}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm line-clamp-2">{post.excerpt}</p>
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-between">
                            <div className="flex items-center gap-2">
                              <Heart className="text-red-500 fill-red-500" size={16} />
                            </div>
                            <Link href={`/posts/${post.slug}`}>
                              <Button variant="outline" size="sm">阅读文章</Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>您没有仅点赞的文章</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 右侧：收藏的文章（包括同时点赞的） */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={18} />
                  收藏的文章 ({favoritePosts.length})
                </CardTitle>
                <CardDescription>您收藏的所有文章</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    <p>加载中...</p>
                  </div>
                ) : favoritePosts.length > 0 ? (
                  <div className="space-y-4">
                    {favoritePosts.map(post => (
                      <Card key={post.slug} className="card-hover-effect">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{post.title}</CardTitle>
                          <CardDescription className="text-xs flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(post.date).toLocaleDateString('zh-CN')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm line-clamp-2">{post.excerpt}</p>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="text-yellow-500 fill-yellow-500" size={16} />
                            {likedPosts.some(lp => lp.slug === post.slug) && (
                              <Heart className="text-red-500 fill-red-500" size={16} />
                            )}
                          </div>
                          <Link href={`/posts/${post.slug}`}>
                            <Button variant="outline" size="sm">阅读文章</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>您还没有收藏任何文章</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      {/* 密码验证对话框 */}
      <PasswordDialog 
        open={showPasswordDialog} 
        onOpenChange={setShowPasswordDialog}
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
      />
    </Layout>
  );
}

export async function getServerSideProps() {
  // 导入服务器端模块
  const fs = require('fs');
  const path = require('path');
  
  // 默认用户配置
  const defaultConfig = {
    name: 'Designer-Awei',
    email: '1974379701@qq.com',
    phone: '15057616150',
    location: '浙江杭州',
    skills: 'Solidworks、KeyShot、Cursor',
    occupation: '设计师',
    profileImage: null,
    bio: '热爱设计和技术，喜欢分享知识和经验。在这个博客上，我会分享我的设计心得和技术见解。',
    socialLinks: [
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'Cursor', url: 'https://cursor.sh' },
      { name: 'Trea', url: 'https://trea.com' }
    ],
    themeColor: 'blue'
  };
  
  try {
    // 确保配置目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const CONFIG_FILE = path.join(process.cwd(), 'data', 'userConfig.json');
    
    // 如果配置文件不存在，创建默认配置
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return { props: { userConfig: defaultConfig } };
    }
    
    // 读取配置文件
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const userConfig = JSON.parse(configData);
    
    return { props: { userConfig } };
  } catch (error) {
    console.error('获取用户配置时出错:', error);
    return { props: { userConfig: defaultConfig } };
  }
} 