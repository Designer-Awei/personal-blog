# 个人图片说明

请将您的个人照片命名为 `profile.jpg` 并放置在此文件夹中。

图片建议：
1. 使用正方形或圆形头像图片
2. 建议尺寸为 500x500 像素或更高
3. 文件格式可以是 JPG、PNG 或 WebP

如果您没有合适的图片，可以暂时使用占位图片服务，例如：
- https://placehold.co/500x500
- https://picsum.photos/500

## 临时解决方案

如果您暂时没有个人照片，可以修改 `pages/index.js` 文件中的 Image 组件，将其替换为：

```jsx
<div className="w-48 h-48 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-6xl font-bold">
  您的名字首字母
</div>
``` 