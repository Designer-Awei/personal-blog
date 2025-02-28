import { useState } from 'react';
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

  const handleSave = () => {
    onSave({
      ...article,
      title,
      content,
      excerpt,
      date
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