#!/bin/bash

# 输出当前目录
echo "当前目录: $(pwd)"

# 列出content目录内容
echo "Content目录内容:"
ls -la content/

# 创建必要的目录
mkdir -p .next/content
mkdir -p .next/server/content

# 复制content目录到构建目录
cp -r content/* .next/content/
cp -r content/* .next/server/content/

# 输出复制后的目录内容
echo ".next/content目录内容:"
ls -la .next/content/

echo ".next/server/content目录内容:"
ls -la .next/server/content/

# 运行正常的构建命令
npm run build

# 构建后再次复制content目录
cp -r content/* .next/content/
cp -r content/* .next/server/content/

# 输出最终的目录内容
echo "最终.next/content目录内容:"
ls -la .next/content/

echo "最终.next/server/content目录内容:"
ls -la .next/server/content/

echo "构建完成!" 