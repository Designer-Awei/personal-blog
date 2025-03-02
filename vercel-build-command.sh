#!/bin/bash

# 输出当前目录和环境信息
echo "当前目录: $(pwd)"
echo "NODE_ENV: $NODE_ENV"

# 确保content目录存在
if [ -d "content" ]; then
  echo "Content目录存在，内容如下:"
  ls -la content/
else
  echo "Content目录不存在!"
fi

# 创建必要的目录
mkdir -p .next/content
mkdir -p .next/server/content

# 复制content目录到构建目录
if [ -d "content" ]; then
  cp -r content/* .next/content/ 2>/dev/null || :
  cp -r content/* .next/server/content/ 2>/dev/null || :
  echo "已复制content目录到构建目录"
fi

# 正常构建
echo "开始构建..."
next build
echo "构建完成!"

# 构建后再次复制content目录
if [ -d "content" ]; then
  cp -r content/* .next/content/ 2>/dev/null || :
  cp -r content/* .next/server/content/ 2>/dev/null || :
  echo "已再次复制content目录到构建目录"
fi 