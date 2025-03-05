import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Save, X, Plus, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageUploader from './ImageUploader';
import { toast } from './ui/use-toast';

export default function ProfileEditor({ userConfig, onSave, onCancel }) {
  const [name, setName] = useState(userConfig.name);
  const [email, setEmail] = useState(userConfig.email);
  const [phone, setPhone] = useState(userConfig.phone || '11111111111');
  const [location, setLocation] = useState(userConfig.location);
  const [skills, setSkills] = useState(userConfig.skills);
  const [bio, setBio] = useState(userConfig.bio);
  const [profileImage, setProfileImage] = useState(userConfig.profileImage);
  const [occupation, setOccupation] = useState(userConfig.occupation || '设计师');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef(null);

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
        socialLinks: userConfig.socialLinks
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
  }, [name, email, phone, location, skills, bio, profileImage, occupation, userConfig]);

  // 监听表单变化，提示用户保存
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (
        name !== userConfig.name ||
        email !== userConfig.email ||
        phone !== userConfig.phone ||
        location !== userConfig.location ||
        skills !== userConfig.skills ||
        bio !== userConfig.bio ||
        profileImage !== userConfig.profileImage ||
        occupation !== userConfig.occupation
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [name, email, phone, location, skills, bio, profileImage, occupation, userConfig]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card>
        <CardHeader>
          <CardTitle>编辑个人资料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center mb-6">
            <ImageUploader 
              initialImage={profileImage} 
              onUpdate={handleImageUpdate} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">姓名 *</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入您的姓名"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">职业</label>
              <Input
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="输入您的职业"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">邮箱 *</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入您的邮箱"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">电话</label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="输入您的电话"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">位置</label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="输入您的位置"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">技能</label>
              <Input
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="输入您的技能，用逗号分隔"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">个人简介</label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="输入您的个人简介"
              className="w-full h-24 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>保存</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 