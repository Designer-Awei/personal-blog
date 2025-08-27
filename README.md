# 个人博客项目

这是一个使用Next.js构建的个人博客系统，包含文章管理、用户交互、AI聊天室等功能。

## 功能特点

- 文章发布与管理
- 点赞和收藏功能
- 个人资料设置
- 主题切换
- AI聊天室（基于SiliconFlow API）
  - **多模型支持**：支持GLM-4、Qwen、DeepSeek等多种AI模型自由切换
  - **图片分析**：上传图片进行AI视觉分析，支持多种图像格式
  - **WEB搜索**：智能联网搜索，提供实时信息和网络资源
  - **记忆系统**：基于MemU API的对话记忆，保持上下文连续性
  - **流式响应**：实时流式输出，提升交互体验
  - **时间查询**：支持北京时间、纽约时间等全球时区查询

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
SILICONFLOW_API_KEY=你的SiliconFlow API密钥
SERPER_API_KEY=你的Serper API密钥（用于WEB搜索）
MEMU_API_KEY=你的MemU API密钥（用于记忆系统，可选）
MEMU_API_BASE_URL=https://api.memu.so（MemU API基础URL，可选）
```

4. 启动开发服务器
```bash
npm run dev
```

5. 访问 http://localhost:3000 查看应用

## 文章存储

本博客系统使用统一的文件夹存储所有文章：

- 所有文章都存储在项目根目录下的 `content` 文件夹中
- 文章使用Markdown格式（.md文件）
- 每篇文章都包含frontmatter元数据，如标题、日期、摘要等
- 新创建的文章会自动保存到 `content` 文件夹中

## Vercel部署注意事项

由于Vercel是无状态服务器环境，部署时需要注意以下几点：

### 1. 文件系统限制

Vercel生产环境不支持写入文件系统，因此本项目在Vercel环境中有以下限制：

- **新增文章功能暂不可用**：在Vercel环境中，新增文章功能被禁用，用户将看到相应的提示信息
- **用户交互数据（点赞、收藏）**：使用内存存储，服务器重启后数据会丢失
- **用户配置**：使用内存存储，服务器重启后会重置为默认值

### 2. 环境变量设置

在Vercel部署时，需要设置以下环境变量：

- `SILICONFLOW_API_KEY`: 用于AI聊天室功能的API密钥（必需）
- `SERPER_API_KEY`: 用于WEB搜索功能的API密钥（必需，用于联网搜索）
- `MEMU_API_KEY`: 用于记忆系统的API密钥（可选，用于对话记忆）
- `MEMU_API_BASE_URL`: MemU API的基础URL（可选，默认为 https://api.memu.so）

设置方法：
1. 在Vercel项目设置中找到"Environment Variables"
2. 添加上述环境变量及其值
3. 重新部署项目

**注意**：`SERPER_API_KEY` 是必需的环境变量，用于启用WEB搜索功能。如果不配置该变量，聊天室将无法进行联网搜索。

### 3. AI聊天室功能详解

#### 支持的AI模型
聊天室支持以下AI模型，可在聊天界面中实时切换：

- **GLM-4-9B-0414** (通用对话) - 主力模型，适合日常对话
- **Qwen3-8B** (通用对话) - 阿里通义千问系列
- **GLM-4.1V-9B-Thinking** (思考模型) - 支持图片分析
- **Qwen2.5-7B-Instruct** (通用对话) - 高质量对话模型
- **DeepSeek-R1-Distill-Qwen-7B** (通用对话) - DeepSeek推理模型
- **ChatGLM3-6B** (通用对话) - 清华ChatGLM系列

#### 图片上传和分析
- **支持格式**：支持JPEG、PNG、WebP等常见图片格式
- **文件大小限制**：最大支持10MB的图片文件
- **智能压缩**：自动压缩图片以优化传输和分析效率
- **视觉分析**：使用GLM视觉模型进行详细的图片内容分析
- **分析维度**：包括主要对象、场景、颜色、布局、文字内容、情感表达等

#### WEB搜索功能
- **搜索引擎**：基于Google搜索API (Serper)
- **智能查询分析**：
  - 自动识别时间查询（北京时间、纽约时间等）
  - 支持全球主要城市时区查询
  - 通用话题的智能搜索
- **搜索结果处理**：
  - 自动格式化搜索结果
  - 提供来源链接和引用方式
  - 支持markdown格式的链接引用

#### 记忆系统
- **记忆存储**：自动保存对话历史和上下文信息
- **智能检索**：根据当前对话内容检索相关记忆
- **上下文连续性**：保持对话的连续性和个性化体验
- **记忆管理**：支持跨会话的记忆保留和检索

#### 高级功能
- **流式响应**：实时流式输出，提升交互体验
- **停止生成**：支持随时中断AI响应生成
- **超时处理**：30秒自动超时保护
- **错误处理**：完善的错误处理和用户提示
- **移动端优化**：支持移动设备的触摸操作和响应式设计

### 5. 依赖问题解决

如果在Vercel部署时遇到以下错误：

```
Failed to compile.
Module not found: Can't resolve 'remark'
Module not found: Can't resolve 'remark-html'
```

请确保项目中已安装这些依赖：

```bash
npm install remark remark-html
```

并确认`package.json`中包含这些依赖：

```json
"dependencies": {
  "remark": "^14.0.3",
  "remark-html": "^15.0.2"
}
```

### 6. 未来改进计划

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
│   │   ├── chat.js              # AI聊天API（支持多模型、图片、搜索）
│   │   ├── search.js            # WEB搜索API（基于Serper）
│   │   ├── vision-analyze.js    # 图片视觉分析API
│   │   ├── memory-retrieve.js   # 记忆检索API
│   │   ├── memory-store.js      # 记忆存储API
│   │   └── ...                  # 其他API
│   ├── chat.js      # AI聊天室页面
│   └── ...           # 前端页面
├── posts/            # 文章内容
├── public/           # 静态资源
│   └── uploads/      # 用户上传的文件（图片等）
└── styles/           # CSS样式
```

## 技术栈

- Next.js - React框架
- Tailwind CSS - 样式库
- ShadcnUI - UI组件库
- SiliconFlow API - AI聊天和视觉分析
- Serper API - WEB搜索功能
- MemU API - 对话记忆系统
- Framer Motion - 动画效果
- Marked - Markdown渲染 

## 隐私密码设置

本项目中的邮箱和电话信息默认是可见的，但用户可以选择隐藏这些信息。当用户尝试将隐藏的信息重新设为可见时，需要输入密码进行验证。

- 默认密码：`123456`
- 密码存储位置：项目根目录下的 `privacy-password.json` 文件
- 密码格式：`{ "password": "您的密码" }`

您可以直接编辑 `privacy-password.json` 文件来修改密码。在Vercel环境中，密码始终为默认值 `123456`。 