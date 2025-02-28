import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Image, X } from 'lucide-react';

export default function NewArticleForm({ onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [category, setCategory] = useState('技术');
  const [customCategories, setCustomCategories] = useState([]);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  // 预定义的文章类别
  const predefinedCategories = ['技术', '设计', '生活', '学习', '工作'];

  // 所有可用的类别（预定义+自定义）
  const allCategories = [...predefinedCategories, ...customCategories];

  // 添加自定义类别
  const addCustomCategory = () => {
    if (newCustomCategory && !allCategories.includes(newCustomCategory)) {
      setCustomCategories([...customCategories, newCustomCategory]);
      setCategory(newCustomCategory);
      setNewCustomCategory('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !content) {
      alert('标题和内容不能为空');
      return;
    }
    
    // 生成slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    const articleData = {
      title,
      content,
      excerpt: excerpt || title,
      date,
      slug,
      category
    };
    
    // 如果有图片，处理图片上传
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      try {
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        
        const uploadData = await uploadResponse.json();
        
        if (uploadResponse.ok) {
          articleData.coverImage = uploadData.imageUrl;
        }
      } catch (error) {
        console.error('上传图片时出错:', error);
      }
    }
    
    onSubmit(articleData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>创建新文章</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">标题</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">摘要</label>
              <Input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="文章摘要（可选）"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">日期</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">文章类别</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {allCategories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? "default" : "outline"}
                    onClick={() => setCategory(cat)}
                    className="text-sm"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newCustomCategory}
                  onChange={(e) => setNewCustomCategory(e.target.value)}
                  placeholder="添加自定义类别"
                  className="text-sm"
                />
                <Button 
                  type="button" 
                  onClick={addCustomCategory}
                  disabled={!newCustomCategory || allCategories.includes(newCustomCategory)}
                >
                  添加
                </Button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">当前选择: <span className="font-medium">{category}</span></p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="使用Markdown格式编写文章内容"
                className="w-full min-h-[300px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">封面图片（可选）</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload').click()}
                  className="flex items-center gap-1"
                >
                  <Image size={16} />
                  <span>选择图片</span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存文章'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 