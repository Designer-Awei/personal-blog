import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeColor, setThemeColor] = useState('blue');
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // 可用的主题颜色选项
  const themeColorOptions = [
    { 
      name: '蓝色', 
      value: 'blue', 
      bgLight: '#f0f7ff', 
      bgDark: '#0f172a' 
    },
    { 
      name: '绿色', 
      value: 'green', 
      bgLight: '#f0fdf4', 
      bgDark: '#052e16' 
    },
    { 
      name: '紫色', 
      value: 'purple', 
      bgLight: '#faf5ff', 
      bgDark: '#2e1065' 
    },
    { 
      name: '粉色', 
      value: 'pink', 
      bgLight: '#fdf2f8', 
      bgDark: '#831843' 
    },
    { 
      name: '橙色', 
      value: 'orange', 
      bgLight: '#fff7ed', 
      bgDark: '#7c2d12' 
    }
  ];

  // 在组件挂载后执行
  useEffect(() => {
    setMounted(true);
    
    // 从localStorage获取保存的主题颜色
    const savedThemeColor = localStorage.getItem('themeColor');
    if (savedThemeColor) {
      setThemeColor(savedThemeColor);
      applyThemeColor(savedThemeColor, theme);
    } else {
      // 如果没有保存的主题颜色，使用默认的蓝色
      localStorage.setItem('themeColor', 'blue');
      applyThemeColor('blue', theme);
    }
  }, [theme]);

  // 应用主题颜色 - 修改此函数以确保颜色正确应用
  const applyThemeColor = (colorValue, currentTheme) => {
    const colorOption = themeColorOptions.find(option => option.value === colorValue);
    if (colorOption) {
      const bgColor = currentTheme === 'dark' ? colorOption.bgDark : colorOption.bgLight;
      
      // 设置CSS变量
      document.documentElement.style.setProperty('--theme-bg', bgColor);
      
      // 直接设置body背景色
      document.body.style.backgroundColor = bgColor;
      
      // 添加调试信息
      console.log(`应用主题颜色: ${colorValue}, 当前主题: ${currentTheme}, 背景色: ${bgColor}`);
      
      // 添加自定义数据属性，用于CSS选择器
      document.documentElement.setAttribute('data-theme-color', colorValue);
    }
  };

  // 获取颜色值
  const getColorValue = (colorName) => {
    const color = themeColorOptions.find(c => c.name === colorName);
    return color ? color.value : 'blue';
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // 确保在主题切换后重新应用颜色
    setTimeout(() => {
      applyThemeColor(themeColor, newTheme);
    }, 100);
  };

  // 更改主题颜色
  const changeThemeColor = (colorValue) => {
    setThemeColor(colorValue);
    localStorage.setItem('themeColor', colorValue);
    
    // 立即应用颜色
    applyThemeColor(colorValue, theme);
    setShowColorDropdown(false);
    
    // 添加延迟重新应用，确保在DOM更新后应用样式
    setTimeout(() => {
      applyThemeColor(colorValue, theme);
    }, 100);
    
    // 再次延迟应用，以处理可能的异步更新
    setTimeout(() => {
      applyThemeColor(colorValue, theme);
    }, 500);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={showColorDropdown} onOpenChange={setShowColorDropdown}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 px-2 h-8"
            onClick={() => setShowColorDropdown(!showColorDropdown)}
          >
            <span className="hidden sm:inline">选择背景颜色</span>
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themeColorOptions.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={() => changeThemeColor(color.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ 
                  backgroundColor: theme === 'dark' ? color.bgDark : color.bgLight,
                  border: '1px solid #ccc'
                }}
              />
              <span>{color.name}</span>
              {themeColor === color.value && (
                <span className="ml-auto text-green-500">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={toggleTheme}
      >
        {theme === 'light' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        <span className="sr-only">切换主题</span>
      </Button>
    </div>
  );
} 