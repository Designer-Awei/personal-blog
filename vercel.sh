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

# 正常构建
echo "开始构建..."
npm run build
echo "构建完成!" 