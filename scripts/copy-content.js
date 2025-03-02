/**
 * 复制content目录到构建目录的脚本
 * 在构建过程中运行，确保content目录在Vercel环境中可用
 */
const fs = require('fs');
const path = require('path');

// 源目录和目标目录
const sourceDir = path.join(process.cwd(), 'content');
const targetDirs = [
  path.join(process.cwd(), '.next/content'),
  path.join(process.cwd(), '.next/server/content'),
  path.join(process.cwd(), '.vercel/output/static/content'),
  path.join(process.cwd(), '.vercel/output/functions/content')
];

/**
 * 复制文件夹及其内容
 * @param {string} source - 源目录
 * @param {string} target - 目标目录
 */
function copyFolderSync(source, target) {
  // 如果目标目录不存在，则创建
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
    console.log(`创建目录: ${target}`);
  }

  // 读取源目录中的所有文件和文件夹
  const files = fs.readdirSync(source);

  // 遍历所有文件和文件夹
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    // 获取文件状态
    const stat = fs.statSync(sourcePath);

    // 如果是目录，则递归复制
    if (stat.isDirectory()) {
      copyFolderSync(sourcePath, targetPath);
    } 
    // 如果是文件，则直接复制
    else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`复制文件: ${sourcePath} -> ${targetPath}`);
    }
  });
}

// 检查源目录是否存在
if (!fs.existsSync(sourceDir)) {
  console.error(`源目录不存在: ${sourceDir}`);
  process.exit(1);
}

// 复制到所有目标目录
targetDirs.forEach(targetDir => {
  try {
    copyFolderSync(sourceDir, targetDir);
    console.log(`成功复制content目录到: ${targetDir}`);
  } catch (error) {
    console.error(`复制到 ${targetDir} 时出错:`, error);
  }
});

console.log('内容目录复制完成！'); 