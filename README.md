# 个人博客项目

这是一个使用Next.js构建的个人博客系统，包含文章管理、用户交互、AI聊天室等功能。

## 功能特点

- 文章发布与管理
- 点赞和收藏功能
- 个人资料设置
- 主题切换
- AI聊天室（基于SiliconFlow API）

## 本地开发

1. 克隆仓库
```bash
git clone <仓库地址>
cd personal-blog
```

2. 安装依赖
```bash
npm install
```

3. 创建环境变量文件
创建`.env.local`文件，添加以下内容：
```
SILICONFLOW_API_KEY=你的API密钥
```

4. 启动开发服务器
```bash
npm run dev
```

5. 访问 http://localhost:3000 查看应用

## Vercel部署注意事项

由于Vercel是无状态服务器环境，部署时需要注意以下几点：

### 1. 文件系统限制

Vercel生产环境不支持写入文件系统，因此本项目在Vercel环境中有以下限制：

- **新增文章功能暂不可用**：在Vercel环境中，新增文章功能被禁用，用户将看到相应的提示信息
- **用户交互数据（点赞、收藏）**：使用内存存储，服务器重启后数据会丢失
- **用户配置**：使用内存存储，服务器重启后会重置为默认值

### 2. 环境变量设置

在Vercel部署时，需要设置以下环境变量：

- `SILICONFLOW_API_KEY`: 用于AI聊天室功能的API密钥

设置方法：
1. 在Vercel项目设置中找到"Environment Variables"
2. 添加上述环境变量及其值
3. 重新部署项目

### 3. 未来改进计划

为了解决Vercel环境中的数据持久化问题，计划实施以下改进：

- 使用数据库服务（如MongoDB Atlas、Supabase等）替代文件系统存储
- 实现完整的用户认证系统
- 添加文章评论功能
- 优化移动端体验

## 项目结构

```
personal-blog/
├── components/       # UI组件
├── data/             # 本地数据存储（开发环境）
├── lib/              # 工具函数和API客户端
├── pages/            # 页面和API路由
│   ├── api/          # 后端API
│   └── ...           # 前端页面
├── posts/            # 文章内容
├── public/           # 静态资源
└── styles/           # CSS样式
```

## 技术栈

- Next.js - React框架
- Tailwind CSS - 样式库
- ShadcnUI - UI组件库
- SiliconFlow API - AI聊天功能 