import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Search, Calendar, Heart, Star, Trash, X, Clock, Bookmark, Mail, MapPin, Code, ArrowRight, Plus, Settings, History, Phone, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/ui/use-toast';
import Image from 'next/image';
import ImageUploader from '../components/ImageUploader';
import { getUserConfig } from '../lib/userConfig';
import { useRouter } from 'next/router';
import PasswordDialog from '../components/PasswordDialog';
import { isVercelEnvironment, isLocalEnvironment } from '../lib/utils';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function Home({ posts, userConfig: initialUserConfig, categories }) {
    const [searchTerm, setSearchTerm] = useState('');
  const [userConfig, setUserConfig] = useState(initialUserConfig);
  const [profileImage, setProfileImage] = useState(initialUserConfig.profileImage);
  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [likedPosts, setLikedPosts] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const router = useRouter();
  const searchRef = useRef(null);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [isEmailVisible, setIsEmailVisible] = useState(false);
  const [isVercelEnv, setIsVercelEnv] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingVisibilityAction, setPendingVisibilityAction] = useState(null);

  // 初始化时从localStorage加载最近搜索记录和隐藏状态，并检测环境
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    
    // 从localStorage读取邮箱和电话隐藏状态
    const savedEmailVisible = localStorage.getItem('isEmailVisible');
    const savedPhoneVisible = localStorage.getItem('isPhoneVisible');
    
    if (savedEmailVisible !== null) {
      setIsEmailVisible(savedEmailVisible === 'true');
    }
    
    if (savedPhoneVisible !== null) {
      setIsPhoneVisible(savedPhoneVisible === 'true');
    }

    // 检测是否在本地环境中
    setIsVercelEnv(!isLocalEnvironment());
    
    // 更新电话号码
    updatePhoneNumber();
  }, []);

  // 更新电话号码
  const updatePhoneNumber = async () => {
    try {
      console.log('正在更新电话号码...');
      const response = await fetch('/api/update-phone', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('电话号码更新成功:', data.phone);
        setUserConfig(prev => ({
          ...prev,
          phone: data.phone
        }));
      } else {
        console.error('更新电话号码失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('更新电话号码时出错:', error);
    }
  };

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

  // 获取点赞和收藏状态
  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        // 获取点赞状态
        const likeRes = await fetch(`/api/interactions/like`);
        const likeData = await likeRes.json();
        
        // 获取收藏状态
        const favoriteRes = await fetch(`/api/interactions/favorite`);
        const favoriteData = await favoriteRes.json();
        
        setLikedPosts(likeData.like || []);
        setFavoritePosts(favoriteData.favorite || []);
      } catch (error) {
        console.error('获取交互状态时出错:', error);
      }
    };
    
    fetchInteractions();
  }, []);

  // 搜索功能
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPosts(posts);
      setSearchSuggestions([]);
    } else {
      const results = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPosts(results);
      
      // 生成搜索建议
      const titleSuggestions = posts
        .filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(post => ({
          title: post.title,
          date: post.date,
          slug: post.slug
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setSearchSuggestions(titleSuggestions);
    }
  }, [searchTerm, posts]);

  // 处理分类过滤
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => post.category === activeCategory);
      setFilteredPosts(filtered);
    }
  }, [activeCategory, posts]);

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

  // 动画变体
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // 创建新文章
  const handleCreateNewArticle = () => {
    // 如果不是本地环境，显示提示信息
    if (!isLocalEnvironment()) {
      toast({
        title: "功能暂不可用",
        description: "创建文章功能仅在本地环境可用，请在本地开发环境中使用此功能。",
        variant: "destructive"
      });
      return;
    }
    router.push('/new-article');
  };

  // 跳转到个人信息页面
  const handleGoToProfile = () => {
    router.push('/profile');
  };

  const handleSearchFocus = () => {
    if (searchTerm.length > 0) {
      setShowSearchSuggestions(true);
    } else if (recentSearches.length > 0) {
      // 如果没有输入搜索词但有最近搜索记录，也显示建议
      setShowSearchSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // 延迟关闭搜索建议，以便用户可以点击建议
    setTimeout(() => {
      setShowSearchSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion) => {
    // 如果是点击的文章标题
    if (typeof suggestion === 'object' && suggestion.title) {
      setSearchTerm(suggestion.title);
      addToRecentSearches(suggestion.title);
      
      // 可选：直接跳转到文章
      router.push(`/posts/${suggestion.slug}`);
    } else {
      // 如果是点击的搜索词
      setSearchTerm(suggestion);
      addToRecentSearches(suggestion);
    }
    setShowSearchSuggestions(false);
  };

  const addToRecentSearches = (term) => {
    // 添加到最近搜索记录，最多保存5条，避免重复
    const updatedSearches = [term, ...recentSearches.filter(item => item !== term)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addToRecentSearches(searchTerm);
    }
  };

  const handleDeleteArticle = async (e, slug) => {
    e.preventDefault(); // 阻止链接跳转
    e.stopPropagation(); // 阻止事件冒泡
    
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/delete-article?slug=${slug}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 更新本地状态，移除已删除的文章
        setFilteredPosts(filteredPosts.filter(post => post.slug !== slug));
        
        toast({
          title: "删除成功",
          description: "文章已成功删除",
          variant: "default"
        });
      } else {
        const data = await response.json();
        throw new Error(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文章时出错:', error);
      toast({
        title: "删除失败",
        description: error.message || "删除文章失败，请重试",
        variant: "destructive"
      });
    }
  };

  // 处理点赞
  const handleLike = async (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const isLiked = likedPosts.includes(slug);
      const method = isLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/interactions/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });
      
      if (response.ok) {
        if (isLiked) {
          setLikedPosts(likedPosts.filter(id => id !== slug));
          toast({
            title: "已取消点赞",
            description: "您已取消对该文章的点赞",
            variant: "default"
          });
        } else {
          setLikedPosts([...likedPosts, slug]);
          toast({
            title: "点赞成功",
            description: "感谢您对该文章的喜爱",
            variant: "default"
          });
        }
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
  const handleFavorite = async (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const isFavorited = favoritePosts.includes(slug);
      const method = isFavorited ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/interactions/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });
      
      if (response.ok) {
        if (isFavorited) {
          setFavoritePosts(favoritePosts.filter(id => id !== slug));
          toast({
            title: "已取消收藏",
            description: "您已取消对该文章的收藏",
            variant: "default"
          });
        } else {
          setFavoritePosts([...favoritePosts, slug]);
          toast({
            title: "收藏成功",
            description: "文章已添加到您的收藏",
            variant: "default"
          });
        }
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

    return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {/* 个人信息区域 - 左侧 */}
        <motion.div 
          className="md:col-span-1 sticky top-4 self-start z-10"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-md card-hover-effect">
            <CardHeader>
              <CardTitle>关于我</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {/* 个人信息卡片 */}
                <Card className="animate-fade-in">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>个人详情</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative">
                        <img 
                          src={profileImage || '/placeholder-avatar.png'} 
                          alt={userConfig.name}
                          className="w-32 h-32 rounded-full object-cover"
                        />
                      </div>
                      <motion.h2 
                        className="text-xl font-bold mt-2"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        {userConfig.name}
                      </motion.h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{userConfig.occupation || '设计师'}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Mail size={16} className="text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p><strong>邮箱:</strong> {isEmailVisible ? userConfig.email : '****@**.com'}</p>
                            <button 
                              onClick={toggleEmailVisibility} 
                              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {isEmailVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone size={16} className="text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p><strong>电话:</strong> {isPhoneVisible ? userConfig.phone : '*** **** ****'}</p>
                            <button 
                              onClick={togglePhoneVisibility} 
                              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {isPhoneVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-primary mt-1" />
                        <p><strong>位置:</strong> {userConfig.location}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Code size={16} className="text-primary mt-1" />
                        <p><strong>技能:</strong> {userConfig.skills}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 border-t pt-3">
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="text-red-500" />
                        <span>点赞: {likedPosts.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark size={16} className="text-yellow-500" />
                        <span>收藏: {favoritePosts.length}</span>
                      </div>
                    </div>
                    <p className="mt-4">{userConfig.bio}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
  <div className="flex space-x-4">
    <motion.a 
      href="/links" 
      className="text-blue-500 hover:text-blue-700"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)" }}
    >
      索引合集
    </motion.a>
  </div>
              <motion.button
                onClick={handleGoToProfile}
                className="flex items-center gap-1 text-gray-500 hover:text-primary transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)" }}
              >
                <Settings size={16} />
                <span>个人详情</span>
              </motion.button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* 文章列表区域 - 右侧 */}
        <motion.div 
          className="md:col-span-3 z-20 relative"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-16 md:mb-6 relative z-50">
            <form onSubmit={handleSearch} className="w-full relative z-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400 z-[51]" />
              <Input
                ref={searchRef}
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="pl-8 w-full"
              />
              
              {/* 搜索建议 */}
              {showSearchSuggestions && (
                <motion.div 
                  className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
                >
                  {searchTerm.length > 0 && searchSuggestions.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        按时间排序的相关文章
                      </div>
                      <ul className="py-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <li 
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <div className="flex items-center">
                              <Search size={14} className="mr-2 text-gray-400" />
                              <span>{suggestion.title}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(suggestion.date).toLocaleDateString('zh-CN')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : recentSearches.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span>最近搜索</span>
                        <button 
                          onClick={clearRecentSearches}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          清除
                        </button>
                      </div>
                      <ul className="py-1">
                        {recentSearches.map((term, index) => (
                          <li 
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                            onClick={() => handleSuggestionClick(term)}
                          >
                            <Calendar size={14} className="mr-2 text-gray-400" />
                            <span>{term}</span>
                    </li>
                ))}
            </ul>
        </div>
                  ) : null}
                </motion.div>
              )}
            </form>
          </div>

          {filteredPosts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {filteredPosts.map((post, index) => (
                <motion.div key={post.slug} variants={item} className="relative z-20">
                  <Link href={`/posts/${post.slug}`} passHref legacyBehavior>
                    <a className="block h-full">
                      <Card className="h-full cursor-pointer card-hover-effect overflow-hidden relative z-20">
                        <div className="flex flex-row h-full">
                          {/* 左侧图片区域 - 占1/3宽度，铺满无边框 */}
                          <div className="w-1/3 relative" style={{ minHeight: "180px" }}>
                            {post.coverImage ? (
                              <div className="absolute inset-0">
                                <img 
                                  src={post.coverImage} 
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div 
                                className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                              >
                                <span className="text-gray-400 dark:text-gray-600">暂无图片</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 右侧内容区域 - 占2/3宽度 */}
                          <div className="w-2/3 flex flex-col">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="pr-3 flex-1">
                                  <CardTitle className="line-clamp-2 text-lg" title={post.title}>{post.title}</CardTitle>
                                  <CardDescription className="flex items-center gap-1 mt-1">
                                    <Calendar size={14} />
                                    {new Date(post.date).toLocaleDateString('zh-CN')}
                                  </CardDescription>
                                </div>
                                <Badge className="whitespace-nowrap shrink-0 ml-2">{post.category}</Badge>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="py-2">
                              <p className="line-clamp-2 text-sm" title={post.excerpt}>{post.excerpt}</p>
                            </CardContent>
                            
                            <CardFooter className="flex justify-between mt-auto pt-2">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => handleLike(post.slug, e)}
                                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
                                >
                                  <Heart 
                                    size={18} 
                                    className={likedPosts.includes(post.slug) ? "fill-red-500 text-red-500" : ""} 
                                  />
                                </button>
                                <button 
                                  onClick={(e) => handleFavorite(post.slug, e)}
                                  className="flex items-center space-x-1 text-gray-500 hover:text-yellow-500"
                                >
                                  <Star 
                                    size={18} 
                                    className={favoritePosts.includes(post.slug) ? "fill-yellow-500 text-yellow-500" : ""} 
                                  />
                                </button>
                                <button 
                                  className="flex items-center cursor-pointer text-red-500 hover:text-red-700"
                                  onClick={(e) => handleDeleteArticle(e, post.slug)}
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                              <p className="text-sm text-blue-500 flex items-center gap-1 group">
                                阅读更多 
                              </p>
                            </CardFooter>
                          </div>
                        </div>
                      </Card>
                    </a>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xl">没有找到匹配的文章</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">尝试使用不同的搜索词</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* 悬浮的新增文章按钮 */}
      <motion.button
        whileHover={!isVercelEnv ? { scale: 1.05 } : {}}
        whileTap={!isVercelEnv ? { scale: 0.98 } : {}}
        onClick={handleCreateNewArticle}
        className={`floating-button ${isVercelEnv ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'} text-white rounded-full md:rounded-lg flex items-center justify-center md:justify-start md:px-4 md:gap-2 md:w-auto`}
        style={{ boxShadow: "0 4px 6px -2px rgba(0, 0, 0, 0.1)" }}
        initial={{ y: 100, opacity: 0, boxShadow: "0 4px 6px -2px rgba(0, 0, 0, 0.1)" }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        disabled={isVercelEnv}
      >
        <Plus size={24} />
        <span className="hidden md:inline whitespace-nowrap">新增文章</span>
      </motion.button>

      {/* 悬浮的AI聊天室按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/chat')}
        className="floating-button bg-primary hover:bg-primary/90 text-white rounded-full md:rounded-lg flex items-center justify-center md:justify-start md:px-4 md:gap-2 md:w-auto"
        style={{ bottom: "6rem", right: "2rem", boxShadow: "0 4px 6px -2px rgba(0, 0, 0, 0.1)" }}
        initial={{ y: 100, opacity: 0, boxShadow: "0 4px 6px -2px rgba(0, 0, 0, 0.1)" }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
      >
        <MessageSquare size={24} />
        <span className="hidden md:inline whitespace-nowrap">AI聊天室</span>
      </motion.button>

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
  // 文章目录路径
  const contentDirectory = path.join(process.cwd(), 'content');
  
  // 确保content目录存在
  if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
  }
  
  // 检查是否有文章文件
  let fileNames = [];
  try {
    fileNames = fs.readdirSync(contentDirectory);
  } catch (error) {
    fileNames = [];
  }
  
  // 如果没有文章，创建示例文章
  if (fileNames.filter(fileName => fileName.endsWith('.md')).length === 0) {
    // 示例文章数据
    const samplePosts = [
      {
        title: '人工智能在日常生活中的应用',
        date: '2023-11-05',
        category: '科技',
        excerpt: '人工智能技术正在改变我们的日常生活，从智能手机到智能家居，AI无处不在。本文探讨AI如何影响我们的生活方式。',
        content: '# 人工智能在日常生活中的应用\n\n## 智能助手\n像Siri、Alexa和Google Assistant这样的智能助手已经成为许多人日常生活的一部分，帮助我们设置提醒、回答问题和控制智能设备。\n\n## 推荐系统\n从视频平台到购物网站，AI驱动的推荐系统根据我们的偏好和行为模式为我们提供个性化内容。\n\n## 智能家居\n智能恒温器、灯光和安全系统使我们的家更加舒适和安全，同时也更加节能。'
      },
      {
        title: '可持续时尚的兴起',
        date: '2023-12-10',
        category: '时尚',
        excerpt: '随着环保意识的提高，可持续时尚正成为行业新趋势。本文讨论如何在追求时尚的同时做出更环保的选择。',
        content: '# 可持续时尚的兴起\n\n## 环境影响\n传统时装产业是全球第二大污染行业，从原材料生产到废弃物处理都对环境造成巨大压力。\n\n## 可持续品牌\n越来越多的品牌开始采用环保材料、道德生产方式和循环经济模式，减少对环境的负面影响。\n\n## 消费者选择\n作为消费者，我们可以通过购买二手衣物、支持可持续品牌和延长服装使用寿命来支持可持续时尚。'
      },
      {
        title: '数字营销策略指南',
        date: '2024-01-15',
        category: '营销',
        excerpt: '在数字化时代，有效的营销策略对企业成功至关重要。本文提供了一些关键的数字营销策略和最佳实践。',
        content: '# 数字营销策略指南\n\n## 内容营销\n创建有价值的内容是吸引和留住目标受众的关键，包括博客文章、视频、播客和社交媒体内容。\n\n## 社交媒体营销\n选择适合你目标受众的社交平台，创建引人入胜的内容，并与你的受众积极互动。\n\n## 搜索引擎优化\n优化你的网站和内容以提高在搜索引擎结果中的排名，增加有机流量。\n\n## 电子邮件营销\n建立和维护一个电子邮件列表，定期向订阅者发送有价值的内容和促销信息。'
      }
    ];
    
    // 写入示例文章
    samplePosts.forEach((post, index) => {
      try {
        const content = matter.stringify(post.content, {
          title: post.title,
          date: post.date,
          category: post.category,
          excerpt: post.excerpt
        });
        
        // 使用简单的slug生成方式
        const slug = `article-${index + 1}`;
        
        // 写入文件
        fs.writeFileSync(path.join(contentDirectory, `${slug}.md`), content);
      } catch (error) {
        // 忽略错误
      }
    });
  }
  
  // 获取所有文章文件
  const updatedFileNames = fs.readdirSync(contentDirectory);
  
  // 解析文章数据
  const posts = updatedFileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      // 从文件名获取slug
      const slug = fileName.replace(/\.md$/, '');
      
      // 读取文章内容
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // 使用gray-matter解析文章元数据
      const { data } = matter(fileContents);
      
      // 返回文章数据
      return {
        slug,
        title: data.title,
        date: data.date,
        category: data.category || '未分类',
        excerpt: data.excerpt,
        coverImage: data.coverImage || null
      };
    });
  
  // 提取所有分类
  const categories = [...new Set(posts.map(post => post.category))];
  
  // 获取用户配置
  const userConfigPath = path.join(process.cwd(), 'data', 'userConfig.json');
  let userConfig = {
    name: 'Designer-Awei',
    email: '1974379701@qq.com',
    phone: '11111111111',
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
    
    // 如果配置文件存在，读取配置
    if (fs.existsSync(userConfigPath)) {
      const configData = fs.readFileSync(userConfigPath, 'utf8');
      userConfig = JSON.parse(configData);
    } else {
      // 否则创建默认配置
      fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2));
    }
  } catch (error) {
    console.error('首页: 获取用户配置时出错:', error);
  }

  return {
    props: {
      posts,
      categories,
      userConfig
    }
  };
} 