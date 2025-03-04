/**
 * 博客通知内容配置文件
 * 可以在此文件中添加、修改或删除通知内容
 * 每个通知对象包含id和content两个属性
 * @typedef {Object} Notification
 * @property {number} id - 通知的唯一标识符
 * @property {string} content - 通知的内容文本
 * @returns {Notification[]} 通知数组
 */
const notifications = [
  {
    id: 1,
    content: "欢迎访问我的博客！这里有丰富的技术文章和生活分享，同时也收录了一些AI工具，希望您能喜欢。"
  },
  {
    id: 2,
    content: "功能公告：当前版本禁用文章编辑与创建文章功能，预计一周后开放，感谢您的理解！"
  },
  {
    id: 3,
    content: "近期推荐阅读：《Web开发趋势与最佳实践》，了解最新的前端开发技术和方法。"
  },
  {
    id: 4,
    content: "彩蛋~更新了网站索引功能，新增了索引合集界面~"
  }
];

export default notifications; 