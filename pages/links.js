import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Plus, X, Edit, Save, Trash2, ChevronLeft, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

/**
 * 生成安全的唯一ID
 * @returns {string} 唯一ID
 */
const generateUniqueId = () => {
  return `id-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 更多链接页面组件
 * @returns {React.ReactElement} 更多链接页面
 */
export default function LinksPage({ userConfig: initialUserConfig }) {
  const [mounted, setMounted] = useState(false);
  const [userConfig, setUserConfig] = useState(initialUserConfig);
  const [categories, setCategories] = useState([]);
  const [uncategorizedLinks, setUncategorizedLinks] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemSource, setDraggedItemSource] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const scrollContainerRefs = useRef({});
  const pageRef = useRef(null);
  const autoScrollTimer = useRef(null);
  
  // 添加新索引相关状态
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  // 编辑链接相关状态
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editingLink, setEditingLink] = useState({ id: null, name: '', url: '', categoryId: null });

  // 检测设备类型
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  
  // 检测设备类型
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始检测
    checkIfMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true);
    
    // 初始化分类和未分类链接
    if (initialUserConfig) {
      const cats = initialUserConfig.linkCategories || [];
      
      // 确保每个分类中的链接都有唯一id
      const categoriesWithLinkIds = cats.map(cat => ({
        ...cat,
        links: cat.links.map(link => ({
          ...link,
          id: generateUniqueId()
        }))
      }));
      
      setCategories(categoriesWithLinkIds);
      
      // 处理未分类链接
      const allLinks = initialUserConfig.socialLinks || [];
      const categorizedLinkUrls = cats.flatMap(cat => cat.links.map(link => link.url));
      const uncategorized = allLinks.filter(link => !categorizedLinkUrls.includes(link.url));
      
      // 确保每个链接都有一个唯一的id
      const uncategorizedWithIds = uncategorized.map(link => ({
        ...link,
        id: generateUniqueId()
      }));
      
      setUncategorizedLinks(uncategorizedWithIds);
    }
  }, [initialUserConfig]);

  // 保存配置到服务器
  const saveConfig = async (newConfig) => {
    try {
      // 清理数据，移除id字段
      const cleanConfig = {
        ...newConfig,
        linkCategories: newConfig.linkCategories.map(cat => ({
          ...cat,
          links: cat.links.map(link => ({
            name: link.name,
            url: link.url
          }))
        }))
      };
      
      const response = await fetch('/api/update-user-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanConfig),
      });
      
      if (!response.ok) {
        throw new Error('保存配置失败');
      }
      
      setUserConfig(cleanConfig);
      toast.success('保存成功');
      return true;
    } catch (error) {
      console.error('保存配置错误:', error);
      toast.error('保存失败');
      return false;
    }
  };

  // 添加新分类
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('分类名称不能为空');
      return;
    }
    
    // 创建新分类
    const newCategory = {
      id: generateUniqueId(),
      name: newCategoryName,
      links: []
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // 更新配置
    const newConfig = {
      ...userConfig,
      linkCategories: updatedCategories
    };
    
    saveConfig(newConfig);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // 删除分类
  const handleDeleteCategory = (categoryId) => {
    // 找到要删除的分类
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    
    if (!categoryToDelete) return;
    
    // 检查分类是否有链接
    if (categoryToDelete.links && categoryToDelete.links.length > 0) {
      toast.error('无法删除非空类别，请先移除所有链接');
      return;
    }
    
    // 显示确认对话框
    if (window.confirm(`确定要删除"${categoryToDelete.name}"类别吗？`)) {
      // 将该分类中的链接移回未分类（此时应该为空）
      const linksToMove = categoryToDelete.links;
      const updatedUncategorized = [...uncategorizedLinks, ...linksToMove];
      
      // 更新分类列表
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      
      setCategories(updatedCategories);
      setUncategorizedLinks(updatedUncategorized);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: updatedCategories
      };
      
      saveConfig(newConfig);
      toast.success(`已删除"${categoryToDelete.name}"类别`);
    }
  };

  // 编辑分类名称
  const handleEditCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setEditingCategoryName(category.name);
    }
  };

  // 保存编辑的分类名称
  const handleSaveCategory = () => {
    if (!editingCategoryName.trim()) {
      toast.error('分类名称不能为空');
      return;
    }
    
    const updatedCategories = categories.map(cat => 
      cat.id === editingCategoryId 
        ? { ...cat, name: editingCategoryName }
        : cat
    );
    
    setCategories(updatedCategories);
    
    // 更新配置
    const newConfig = {
      ...userConfig,
      linkCategories: updatedCategories
    };
    
    saveConfig(newConfig);
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // 开始拖动
  const handleDragStart = (e, item, source, index) => {
    // 不要在这里阻止默认行为，否则无法开始拖动
    setIsDragging(true);
    setDraggedItem(item);
    setDraggedItemSource(source);
    
    // 设置拖动效果
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, index }));
    }
    
    // 添加拖动样式
    if (e.target) {
      setTimeout(() => {
        e.target.classList.add('opacity-50', 'scale-105', 'shadow-lg');
      }, 0);
    }
  };
  
  // 结束拖动
  const handleDragEnd = (e) => {
    setIsDragging(false);
    
    // 清除拖动样式
    if (e.target) {
      e.target.classList.remove('opacity-50', 'scale-105', 'shadow-lg');
    }
    
    // 清除自动滚动计时器
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };
  
  // 处理拖动悬停
  const handleDragOver = (e, categoryId) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverCategory(categoryId);
    
    // 处理自动滚动
    handleAutoScroll(e);
  };

  // 处理自动滚动
  const handleAutoScroll = (e) => {
    if (!pageRef.current) return;
    
    const { clientY } = e;
    const { top, bottom, height } = pageRef.current.getBoundingClientRect();
    const scrollThreshold = 100; // 滚动触发区域高度
    
    // 清除现有计时器
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    
    // 检查是否在顶部或底部边缘
    if (clientY < top + scrollThreshold) {
      // 靠近顶部，向上滚动
      autoScrollTimer.current = setInterval(() => {
        window.scrollBy(0, -10);
      }, 10);
    } else if (clientY > bottom - scrollThreshold) {
      // 靠近底部，向下滚动
      autoScrollTimer.current = setInterval(() => {
        window.scrollBy(0, 10);
      }, 10);
    }
  };

  // 处理拖动离开
  const handleDragLeave = (e) => {
    e.preventDefault();
    
    // 检查是否真的离开了目标元素，而不是进入了子元素
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    
    setDragOverCategory(null);
  };

  // 处理拖放
  const handleDrop = (e, categoryId, dropIndex) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    
    console.log('拖放到:', categoryId, '拖动项:', draggedItem?.name, '位置:', dropIndex); // 调试信息
    
    // 如果没有拖动项，则不做任何操作
    if (!draggedItem) {
      setDraggedItem(null);
      setDraggedItemSource(null);
      setDragOverCategory(null);
      setDragOverIndex(null);
      return;
    }
    
    // 同一分类内排序
    if (draggedItemSource === categoryId && typeof dropIndex === 'number') {
      // 找到当前分类
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) {
        setDraggedItem(null);
        setDraggedItemSource(null);
        setDragOverCategory(null);
        setDragOverIndex(null);
        return;
      }
      
      // 找到拖动项在源分类中的索引
      const sourceIndex = category.links.findIndex(link => link.id === draggedItem.id);
      if (sourceIndex === -1 || sourceIndex === dropIndex) {
        setDraggedItem(null);
        setDraggedItemSource(null);
        setDragOverCategory(null);
        setDragOverIndex(null);
        return;
      }
      
      // 重新排序链接
      const newLinks = [...category.links];
      const [movedItem] = newLinks.splice(sourceIndex, 1);
      
      // 如果拖动到最后，直接添加到末尾
      if (dropIndex >= newLinks.length) {
        newLinks.push(movedItem);
      } else {
        // 否则插入到指定位置
        newLinks.splice(dropIndex, 0, movedItem);
      }
      
      // 更新分类
      const newCategories = categories.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, links: newLinks };
        }
        return cat;
      });
      
      setCategories(newCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: newCategories
      };
      
      saveConfig(newConfig);
      toast.success(`已重新排序 "${category.name}" 分类中的索引`);
    }
    // 从未分类拖到分类
    else if (draggedItemSource === 'uncategorized' && categoryId !== 'uncategorized') {
      // 从未分类拖到分类
      const newUncategorized = uncategorizedLinks.filter(link => link.id !== draggedItem.id);
      
      const newCategories = categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            links: [...cat.links, draggedItem]
          };
        }
        return cat;
      });
      
      setUncategorizedLinks(newUncategorized);
      setCategories(newCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: newCategories
      };
      
      saveConfig(newConfig);
      toast.success(`已将 "${draggedItem.name}" 添加到 "${categories.find(c => c.id === categoryId)?.name}" 分类`);
    } else if (draggedItemSource !== 'uncategorized' && categoryId !== 'uncategorized' && draggedItemSource !== categoryId) {
      // 从一个分类拖到另一个分类
      const newCategories = categories.map(cat => {
        if (cat.id === draggedItemSource) {
          // 从源分类中移除
          return {
            ...cat,
            links: cat.links.filter(link => link.id !== draggedItem.id)
          };
        } else if (cat.id === categoryId) {
          // 添加到目标分类
          return {
            ...cat,
            links: [...cat.links, draggedItem]
          };
        }
        return cat;
      });
      
      setCategories(newCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: newCategories
      };
      
      saveConfig(newConfig);
      toast.success(`已将 "${draggedItem.name}" 从 "${categories.find(c => c.id === draggedItemSource)?.name}" 移动到 "${categories.find(c => c.id === categoryId)?.name}" 分类`);
    } else if (categoryId === 'uncategorized') {
      // 从分类拖到未分类
      const newCategories = categories.map(cat => {
        if (cat.id === draggedItemSource) {
          return {
            ...cat,
            links: cat.links.filter(link => link.id !== draggedItem.id)
          };
        }
        return cat;
      });
      
      setUncategorizedLinks([...uncategorizedLinks, draggedItem]);
      setCategories(newCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: newCategories
      };
      
      saveConfig(newConfig);
      toast.success(`已将 "${draggedItem.name}" 移动到未分类索引`);
    }
    
    // 重置拖动状态
    setDraggedItem(null);
    setDraggedItemSource(null);
    setDragOverCategory(null);
    setDragOverIndex(null);
  };

  // 处理卡片拖动悬停
  const handleCardDragOver = (e, categoryId, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 只有在同一分类内才设置悬停索引
    if (draggedItemSource === categoryId) {
      setDragOverIndex(index);
    }
    
    setDragOverCategory(categoryId);
  };

  // 长按开始
  const handleLongPress = (e, item, source, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 设置长按定时器
    const timer = setTimeout(() => {
      // 长按触发拖动
      handleDragStart(e, item, source, index);
      
      // 添加震动反馈
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      toast.success('已进入排序模式，拖动卡片可以调整顺序', { duration: 2000 });
    }, 500); // 500ms长按触发
    
    setLongPressTimer(timer);
  };
  
  // 处理触摸开始
  const handleTouchStart = (e, categoryId) => {
    setTouchStartX(e.touches[0].clientX);
  };
  
  // 处理触摸移动
  const handleTouchMove = (e) => {
    // 如果有长按定时器，取消它
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  // 处理触摸结束
  const handleTouchEnd = (e, categoryId) => {
    // 如果有长按定时器，取消它
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // 如果不是移动设备或没有触摸起始点，不处理滑动
    if (!isMobile || !touchStartX) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    
    // 如果滑动距离足够大，触发滚动
    if (Math.abs(diffX) > 50) {
      const direction = diffX > 0 ? 'right' : 'left';
      handleScroll(categoryId, direction);
    }
    
    // 重置触摸状态
    setTouchStartX(0);
  };

  // 阻止链接点击
  const handleLinkClick = (e) => {
    // 检查点击事件是否来自编辑按钮
    const target = e.target;
    const isEditButton = target.closest('button') && 
                         (target.closest('button').querySelector('svg[data-lucide="edit"]') || 
                          target.closest('button').querySelector('svg.lucide-edit'));
    
    // 如果是编辑按钮或者正在拖动，阻止链接跳转
    if (isDragging || isEditButton) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 处理水平滚动
  const handleScroll = (categoryId, direction) => {
    const container = scrollContainerRefs.current[categoryId];
    if (container) {
      const scrollAmount = 200; // 每次滚动的像素数
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // 设置滚动容器引用
  const setScrollContainerRef = (categoryId, ref) => {
    if (ref) {
      scrollContainerRefs.current[categoryId] = ref;
    }
  };

  // 打开添加链接对话框
  const handleOpenAddLink = (categoryId = null) => {
    setSelectedCategoryId(categoryId);
    setNewLink({ name: '', url: '' });
    setIsAddingLink(true);
  };

  // 关闭添加链接对话框
  const handleCloseAddLink = () => {
    setIsAddingLink(false);
    setNewLink({ name: '', url: '' });
    setSelectedCategoryId(null);
  };

  // 处理链接字段变更
  const handleLinkChange = (field, value) => {
    setNewLink(prev => ({ ...prev, [field]: value }));
  };

  // 添加新链接
  const handleAddLink = async () => {
    // 验证链接信息
    if (!newLink.name.trim() || !newLink.url.trim()) {
      toast.error('链接名称和URL不能为空');
      return;
    }

    // 如果URL不包含协议，添加https://
    let url = newLink.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // 创建新链接对象
    const linkToAdd = {
      id: generateUniqueId(),
      name: newLink.name.trim(),
      url: url
    };

    // 根据选择的分类添加链接
    if (selectedCategoryId) {
      // 添加到指定分类
      const updatedCategories = categories.map(cat => {
        if (cat.id === selectedCategoryId) {
          return {
            ...cat,
            links: [...cat.links, linkToAdd]
          };
        }
        return cat;
      });
      
      setCategories(updatedCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: updatedCategories
      };
      
      const saved = await saveConfig(newConfig);
      if (saved) {
        toast.success(`已添加到"${categories.find(c => c.id === selectedCategoryId)?.name}"分类`);
      }
    } else {
      // 添加到未分类链接
      const newUncategorized = [...uncategorizedLinks, linkToAdd];
      setUncategorizedLinks(newUncategorized);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        socialLinks: newUncategorized
      };
      
      const saved = await saveConfig(newConfig);
      if (saved) {
        toast.success('已添加到未分类链接');
      }
    }

    // 关闭对话框
    handleCloseAddLink();
  };

  // 打开编辑链接对话框
  const handleOpenEditLink = (link, categoryId) => {
    setEditingLink({
      id: link.id,
      name: link.name,
      url: link.url,
      categoryId: categoryId
    });
    setIsEditingLink(true);
  };

  // 关闭编辑链接对话框
  const handleCloseEditLink = () => {
    setEditingLink({ id: null, name: '', url: '', categoryId: null });
    setIsEditingLink(false);
  };

  // 处理编辑链接字段变更
  const handleEditLinkChange = (field, value) => {
    setEditingLink(prev => ({ ...prev, [field]: value }));
  };

  // 保存编辑的链接
  const handleSaveEditedLink = async () => {
    // 验证链接信息
    if (!editingLink.name.trim() || !editingLink.url.trim()) {
      toast.error('链接名称和URL不能为空');
      return;
    }

    // 如果URL不包含协议，添加https://
    let url = editingLink.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // 更新后的链接对象
    const updatedLink = {
      id: editingLink.id,
      name: editingLink.name.trim(),
      url: url
    };

    // 根据链接所在位置更新
    if (editingLink.categoryId === 'uncategorized') {
      // 更新未分类链接
      const updatedUncategorized = uncategorizedLinks.map(link => 
        link.id === editingLink.id ? updatedLink : link
      );
      
      setUncategorizedLinks(updatedUncategorized);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        socialLinks: updatedUncategorized
      };
      
      const saved = await saveConfig(newConfig);
      if (saved) {
        toast.success('链接已更新');
      }
    } else {
      // 更新分类中的链接
      const updatedCategories = categories.map(cat => {
        if (cat.id === editingLink.categoryId) {
          return {
            ...cat,
            links: cat.links.map(link => 
              link.id === editingLink.id ? updatedLink : link
            )
          };
        }
        return cat;
      });
      
      setCategories(updatedCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: updatedCategories
      };
      
      const saved = await saveConfig(newConfig);
      if (saved) {
        toast.success('链接已更新');
      }
    }

    // 关闭对话框
    handleCloseEditLink();
  };

  // 删除链接
  const handleDeleteLink = async (linkId, categoryId) => {
    // 显示确认对话框
    if (!window.confirm('确定要删除此链接吗？')) {
      return;
    }

    if (categoryId === 'uncategorized') {
      // 从未分类链接中删除
      const updatedUncategorized = uncategorizedLinks.filter(link => link.id !== linkId);
      setUncategorizedLinks(updatedUncategorized);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        socialLinks: updatedUncategorized
      };
      
      const saved = await saveConfig(newConfig);
      if (saved) {
        toast.success('链接已删除');
      }
    } else {
      // 从分类中删除
      const updatedCategories = categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            links: cat.links.filter(link => link.id !== linkId)
          };
        }
        return cat;
      });
      
      setCategories(updatedCategories);
      
      // 更新配置
      const newConfig = {
        ...userConfig,
        linkCategories: updatedCategories
      };
      
      const saved = await saveConfig(newConfig);
      if (saved) {
        toast.success('链接已删除');
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <motion.div
        ref={pageRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto pb-10"
      >
        <div className="mb-4 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-1">
              <ArrowLeft size={16} />
              <span>返回首页</span>
            </Button>
          </Link>
        </div>

        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">索引合集</CardTitle>
            <CardDescription>这里收集了我所有的社交媒体和推荐网站链接</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium truncate">索引分类</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsAddingCategory(true)} 
                    className="flex items-center justify-center gap-1 px-2 sm:px-3"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">添加新分类</span>
                    <span className="sm:hidden">添加</span>
                  </Button>
                </div>
              </div>
              
              {isAddingCategory && (
                <div className="flex items-center gap-2 mt-4">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="输入分类名称"
                    className="flex-1"
                  />
                  <Button onClick={handleAddCategory} size="sm">
                    <Save size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAddingCategory(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
              
              {/* 分类卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {categories.map((category) => (
                  <Card 
                    key={category.id} 
                    className={`border border-gray-200 dark:border-gray-700 ${dragOverCategory === category.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onDragOver={(e) => handleDragOver(e, category.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, category.id, null)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        {editingCategoryId === category.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="flex-1"
                            />
                            <Button size="sm" onClick={handleSaveCategory}>
                              <Save size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingCategoryId(null)}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-lg truncate">{category.name}</CardTitle>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-muted-foreground"
                                onClick={() => handleOpenAddLink(category.id)}
                              >
                                <Plus size={16} className="mr-1 sm:mr-1" />
                                <span className="hidden sm:inline">添加新索引</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-muted-foreground"
                                onClick={() => handleEditCategory(category.id)}
                              >
                                <Edit size={16} className="mr-1 sm:mr-1" />
                                <span className="hidden sm:inline">编辑</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 size={16} className="mr-1 sm:mr-1" />
                                <span className="hidden sm:inline">删除</span>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="relative"
                        onDragOver={(e) => handleDragOver(e, category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id, null)}
                      >
                        {/* 左右滚动按钮 - 仅在桌面端显示 */}
                        {category.links.length > 0 && !isMobile && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                              onClick={() => handleScroll(category.id, 'left')}
                            >
                              <ChevronLeft size={20} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                              onClick={() => handleScroll(category.id, 'right')}
                            >
                              <ChevronRight size={20} />
                            </Button>
                          </>
                        )}
                        
                        {/* 链接容器 */}
                        <div 
                          className={`
                            ${category.links.length === 0 ? 'flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px]' : 'flex overflow-x-auto py-2 px-6'}
                            ${dragOverCategory === category.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                            ${isMobile ? 'scrollbar-hide' : 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent'}
                          `}
                          ref={(ref) => setScrollContainerRef(category.id, ref)}
                          onDragOver={(e) => handleDragOver(e, category.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, category.id, null)}
                          onTouchStart={(e) => handleTouchStart(e, category.id)}
                          onTouchEnd={(e) => handleTouchEnd(e, category.id)}
                        >
                          {category.links.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500">拖动链接到此处添加</p>
                          ) : (
                            <>
                              {category.links.map((link, index) => (
                                <motion.div
                                  key={link.id}
                                  className={`
                                    flex-shrink-0 w-32 h-32 m-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 
                                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                    flex flex-col items-center justify-center text-center
                                    ${isDragging && draggedItem?.id === link.id ? 'opacity-50 scale-105 shadow-lg' : ''}
                                    ${dragOverCategory === category.id && dragOverIndex === index ? 'border-l-4 border-l-blue-500' : ''}
                                    ${dragOverCategory === category.id && dragOverIndex === index + 1 ? 'border-r-4 border-r-blue-500' : ''}
                                    cursor-move relative group
                                  `}
                                  whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                  whileTap={{ scale: 0.98 }}
                                  draggable="true"
                                  onDragStart={(e) => handleDragStart(e, link, category.id, index)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleCardDragOver(e, category.id, index)}
                                  onDrop={(e) => handleDrop(e, category.id, index)}
                                  onTouchStart={(e) => handleLongPress(e, link, category.id, index)}
                                  onTouchMove={handleTouchMove}
                                  onTouchEnd={handleTouchEnd}
                                >
                                  <h3 className="font-medium truncate w-full">{link.name}</h3>
                                  <ExternalLink size={16} className="text-gray-400 mt-2" />
                                  
                                  {/* 编辑按钮 */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity z-20"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOpenEditLink(link, category.id);
                                    }}
                                  >
                                    <Edit size={12} />
                                  </Button>
                                  
                                  {/* 使用div包装链接，确保编辑按钮可以正常点击 */}
                                  <div className="absolute inset-0 z-10">
                                    <a 
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 opacity-0"
                                      onClick={handleLinkClick}
                                    />
                                  </div>
                                </motion.div>
                              ))}
                              {/* 添加末尾放置区域 */}
                              {category.links.length > 0 && draggedItemSource === category.id && (
                                <div 
                                  className={`
                                    flex-shrink-0 w-8 h-32 m-1
                                    ${dragOverIndex === category.links.length ? 'border-l-4 border-l-blue-500' : ''}
                                  `}
                                  onDragOver={(e) => handleCardDragOver(e, category.id, category.links.length)}
                                  onDrop={(e) => handleDrop(e, category.id, category.links.length)}
                                ></div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* 未分类链接 */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl truncate">未分类链接</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-muted-foreground"
                      onClick={() => handleOpenAddLink()}
                    >
                      <Plus size={16} className="mr-1 sm:mr-1" />
                      <span className="hidden sm:inline">添加新索引</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent
                  className={`
                    p-4 min-h-[100px] 
                    ${isDragging ? 'border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg' : ''}
                  `}
                  onDragOver={(e) => handleDragOver(e, 'uncategorized')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'uncategorized', null)}
                >
                  {uncategorizedLinks.map((link, index) => (
                    <motion.div
                      key={link.id}
                      className={`flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isDragging && draggedItem?.id === link.id ? 'opacity-50 scale-105 shadow-lg' : ''} ${dragOverCategory === 'uncategorized' ? 'ring-2 ring-blue-500' : ''} cursor-move relative group`}
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, link, 'uncategorized', index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, 'uncategorized', index)}
                      onDrop={(e) => handleDrop(e, 'uncategorized', index)}
                    >
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-medium">{link.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full" title={link.url}>
                          {link.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity z-20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenEditLink(link, 'uncategorized');
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
                      </div>
                      
                      {/* 使用div包装链接，确保编辑按钮可以正常点击 */}
                      <div className="absolute inset-0 z-10">
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 opacity-0"
                          onClick={handleLinkClick}
                        />
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              长按或拖动链接卡片可以将其添加到分类中
            </p>
          </CardFooter>
        </Card>

        {/* 添加链接对话框 */}
        <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加新索引</DialogTitle>
              <DialogDescription>
                {selectedCategoryId 
                  ? `添加到"${categories.find(c => c.id === selectedCategoryId)?.name}"分类` 
                  : '添加到未分类链接'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={newLink.name}
                  onChange={(e) => handleLinkChange('name', e.target.value)}
                  placeholder="例如：我的博客"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={newLink.url}
                  onChange={(e) => handleLinkChange('url', e.target.value)}
                  placeholder="例如：https://example.com"
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={handleCloseAddLink}>取消</Button>
              <Button onClick={handleAddLink}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑链接对话框 */}
        <Dialog open={isEditingLink} onOpenChange={setIsEditingLink}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>编辑索引</DialogTitle>
              <DialogDescription>
                {editingLink.categoryId && editingLink.categoryId !== 'uncategorized'
                  ? `编辑"${categories.find(c => c.id === editingLink.categoryId)?.name}"分类中的链接`
                  : '编辑未分类链接'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={editingLink.name}
                  onChange={(e) => handleEditLinkChange('name', e.target.value)}
                  placeholder="例如：我的博客"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={editingLink.url}
                  onChange={(e) => handleEditLinkChange('url', e.target.value)}
                  placeholder="例如：https://example.com"
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2 justify-between">
              <Button variant="outline" onClick={handleCloseEditLink}>取消</Button>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDeleteLink(editingLink.id, editingLink.categoryId);
                    handleCloseEditLink();
                  }}
                >
                  删除
                </Button>
                <Button onClick={handleSaveEditedLink}>保存</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </Layout>
  );
}

/**
 * 获取服务器端属性
 * @returns {Promise<Object>} 包含用户配置的props对象
 */
export async function getServerSideProps() {
  // 导入服务器端模块
  const fs = require('fs');
  const path = require('path');
  
  // 默认用户配置
  const defaultConfig = {
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
    linkCategories: [],
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