import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Save, X, Plus, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageUploader from './ImageUploader';

export default function ProfileEditor({ userConfig, onSave, onCancel }) {
  const [name, setName] = useState(userConfig.name);
  const [email, setEmail] = useState(userConfig.email);
  const [phone, setPhone] = useState(userConfig.phone || '15057616150');
  const [location, setLocation] = useState(userConfig.location);
  const [skills, setSkills] = useState(userConfig.skills);
  const [bio, setBio] = useState(userConfig.bio);
  const [socialLinks, setSocialLinks] = useState(userConfig.socialLinks);
  const [profileImage, setProfileImage] = useState(userConfig.profileImage);
  const [occupation, setOccupation] = useState(userConfig.occupation || '设计师');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef(null);

  const handleAddLink = () => {
    setSocialLinks([...socialLinks, { name: '', url: '' }]);
  };

  const handleRemoveLink = (index) => {
    const newLinks = [...socialLinks];
    newLinks.splice(index, 1);
    setSocialLinks(newLinks);
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };

  const handleImageUpdate = (imageData) => {
    setProfileImage(imageData);
  };

  const handleSubmit = async () => {
    if (!name || !email) {
      alert('姓名和邮箱不能为空');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave({
        name,
        email,
        phone,
        location,
        skills,
        bio,
        profileImage,
        occupation,
        socialLinks: socialLinks.filter(link => link.name && link.url)
      });
    } catch (error) {
      console.error('保存个人信息时出错:', error);
      alert('保存个人信息失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加点击外部自动保存功能
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        // 点击了卡片外部，自动保存
        handleSubmit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [name, email, phone, location, skills, bio, profileImage, occupation, socialLinks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card ref={cardRef} className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle className="text-xl">编辑个人信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <ImageUploader 
              onImageUpdate={handleImageUpdate} 
              currentImage={profileImage} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">姓名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">职业</label>
            <Input
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full"
              placeholder="例如：设计师、开发者、作家等"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">电话</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">位置</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">技能</label>
            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full"
              placeholder="用逗号分隔多个技能"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">个人简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full h-24 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">社交链接</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleAddLink}
                className="flex items-center gap-1"
              >
                <Plus size={16} />
                <span>添加链接</span>
              </Button>
            </div>
            {socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={link.name}
                  onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
                  placeholder="名称"
                  className="w-1/3"
                />
                <Input
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  placeholder="URL"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleRemoveLink(index)}
                  className="shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
            <X size={16} />
            <span>取消</span>
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
            <Save size={16} />
            <span>{isSubmitting ? '保存中...' : '保存'}</span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 