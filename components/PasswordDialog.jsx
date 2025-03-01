import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from './ui/use-toast';
import { verifyPrivacyPassword } from '../lib/utils';

/**
 * 密码验证对话框组件
 * @param {object} props - 组件属性
 * @param {boolean} props.open - 对话框是否打开
 * @param {function} props.onOpenChange - 对话框打开状态变化回调
 * @param {function} props.onSuccess - 密码验证成功回调
 * @param {function} props.onCancel - 取消验证回调
 * @returns {React.ReactElement} 密码验证对话框组件
 */
export default function PasswordDialog({ open, onOpenChange, onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /**
   * 处理密码验证
   */
  const handleVerify = async () => {
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyPrivacyPassword(password);
      
      if (isValid) {
        toast({
          title: "验证成功",
          description: "密码验证通过",
          variant: "default"
        });
        onSuccess();
      } else {
        setError('密码错误，请重试');
      }
    } catch (error) {
      console.error('验证密码时出错:', error);
      setError('验证失败，请重试');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * 处理取消验证
   */
  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  /**
   * 处理按键事件，按Enter键提交
   * @param {React.KeyboardEvent} e - 键盘事件
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  /**
   * 切换密码显示状态
   */
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            <span>隐私信息验证</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            查看隐私信息需要验证密码，初始密码为123456
          </p>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            密码存储在项目根目录的privacy-password.json文件中，您可以直接编辑该文件修改密码
          </p>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? '验证中...' : '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 