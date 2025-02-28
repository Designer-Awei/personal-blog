// 客户端安全的用户配置管理
// 注意：此文件不应直接导入Node.js模块（如fs和path）

// 获取用户配置（客户端安全）
export async function getUserConfig() {
  try {
    const response = await fetch('/api/user-config');
    if (!response.ok) {
      throw new Error('获取用户配置失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取用户配置时出错:', error);
    return null;
  }
}

// 更新用户配置（客户端安全）
export async function updateUserConfig(newConfig) {
  try {
    const response = await fetch('/api/user-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfig),
    });
    
    if (!response.ok) {
      throw new Error('更新用户配置失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('更新配置文件时出错:', error);
    return { success: false, error: error.message };
  }
}

// 更新用户头像（客户端安全）
export async function updateProfileImage(imageUrl) {
  return updateUserConfig({ profileImage: imageUrl });
}

// 更新主题颜色（客户端安全）
export async function updateThemeColor(color) {
  return updateUserConfig({ themeColor: color });
}

// 获取可用的主题颜色（客户端安全）
export function getAvailableThemeColors() {
  return [
    { name: '蓝色', value: 'blue', primary: '#3b82f6', secondary: '#93c5fd' },
    { name: '绿色', value: 'green', primary: '#10b981', secondary: '#6ee7b7' },
    { name: '紫色', value: 'purple', primary: '#8b5cf6', secondary: '#c4b5fd' },
    { name: '粉色', value: 'pink', primary: '#ec4899', secondary: '#f9a8d4' },
    { name: '橙色', value: 'orange', primary: '#f97316', secondary: '#fdba74' }
  ];
}

// 获取用户互动数据（点赞和收藏）（客户端安全）
export async function getUserInteractions() {
  try {
    const likesResponse = await fetch('/api/interactions/like');
    const favoritesResponse = await fetch('/api/interactions/favorite');
    
    if (!likesResponse.ok || !favoritesResponse.ok) {
      throw new Error('获取互动数据失败');
    }
    
    const likes = await likesResponse.json();
    const favorites = await favoritesResponse.json();
    
    return {
      likes: likes.like || [],
      favorites: favorites.favorite || []
    };
  } catch (error) {
    console.error('读取互动数据时出错:', error);
    return { likes: [], favorites: [] };
  }
}

// 更新点赞状态（客户端安全）
export async function toggleLike(slug) {
  try {
    const interactions = await getUserInteractions();
    const isLiked = interactions.likes.includes(slug);
    
    const response = await fetch('/api/interactions/like', {
      method: isLiked ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    });
    
    if (!response.ok) {
      throw new Error('更新点赞状态失败');
    }
    
    return { success: true, liked: !isLiked };
  } catch (error) {
    console.error('更新点赞状态时出错:', error);
    return { success: false, error: error.message };
  }
}

// 更新收藏状态（客户端安全）
export async function toggleFavorite(slug) {
  try {
    const interactions = await getUserInteractions();
    const isFavorited = interactions.favorites.includes(slug);
    
    const response = await fetch('/api/interactions/favorite', {
      method: isFavorited ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    });
    
    if (!response.ok) {
      throw new Error('更新收藏状态失败');
    }
    
    return { success: true, favorited: !isFavorited };
  } catch (error) {
    console.error('更新收藏状态时出错:', error);
    return { success: false, error: error.message };
  }
} 