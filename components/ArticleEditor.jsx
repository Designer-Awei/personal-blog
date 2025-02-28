import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ArticleEditor({ article, onSave, onCancel }) {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [date, setDate] = useState(article.date);
  const [category, setCategory] = useState(article.category || '未分类');
  const [customCategories, setCustomCategories] = useState([]);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  // 预定义的文章类别
  const predefinedCategories = ['技术', '设计', '生活', '学习', '工作', '未分类'];

  // 初始化时，如果文章类别不在预定义类别中，则添加到自定义类别
  useEffect(() => {
    if (article.category && !predefinedCategories.includes(article.category)) {
      setCustomCategories([article.category]);
    }
  }, [article.category]);

  // 所有可用的类别（预定义+自定义）
  const allCategories = [...predefinedCategories, ...customCategories.filter(cat => !predefinedCategories.includes(cat))];

  // 添加自定义类别
  const addCustomCategory = () => {
    if (newCustomCategory && !allCategories.includes(newCustomCategory)) {
      setCustomCategories([...customCategories, newCustomCategory]);
      setCategory(newCustomCategory);
      setNewCustomCategory('');
    }
  };

  const handleSave = () => {
    onSave({
      ...article,
      title,
      content,
      excerpt,
      date,
      category
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">编辑文章</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">摘要</label>
            <Input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">日期</label>
            <Input
              type="date"
              value={date.split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
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
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                placeholder="添加自定义类别"
                className="w-full"
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
          <div>
            <label className="block text-sm font-medium mb-1">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[300px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="使用 Markdown 格式编写文章内容..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-1">
            <X size={16} />
            <span>取消</span>
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-1">
            <Save size={16} />
            <span>保存</span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 