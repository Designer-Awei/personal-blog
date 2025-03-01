import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并类名工具函数，结合clsx和tailwind-merge
 * @param {...string} inputs - 类名输入
 * @returns {string} 合并后的类名
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * 获取隐私密码
 * @returns {Promise<string>} 隐私密码
 */
export async function getPrivacyPassword() {
  try {
    const response = await fetch('/api/privacy-password');
    const data = await response.json();
    return data.password;
  } catch (error) {
    console.error('获取隐私密码失败:', error);
    return '123456'; // 默认密码
  }
}

/**
 * 验证隐私密码
 * @param {string} inputPassword - 用户输入的密码
 * @returns {Promise<boolean>} 密码是否正确
 */
export async function verifyPrivacyPassword(inputPassword) {
  try {
    console.log('验证密码:', inputPassword);
    const response = await fetch('/api/privacy-password');
    
    if (!response.ok) {
      console.error('获取密码失败:', response.status, response.statusText);
      throw new Error('获取密码失败');
    }
    
    const data = await response.json();
    console.log('获取到的密码:', data.password);
    
    return inputPassword === data.password;
  } catch (error) {
    console.error('验证密码时出错:', error);
    // 如果API调用失败，使用默认密码进行验证
    return inputPassword === '123456';
  }
}

/**
 * 检测是否为Vercel环境
 * @returns {boolean} 是否为Vercel环境
 */
export function isVercelEnvironment() {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('vercel.app');
  }
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL === '1';
} 