# 自定义字体使用指南

## 📁 文件放置

将你下载的字体文件放在 `public/fonts/` 目录下：

```
public/
└── fonts/
    ├── fonts.css           # 字体定义文件
    ├── YourFont.ttf        # 你的字体文件（TTF格式）
    ├── YourFont.woff       # 你的字体文件（WOFF格式，推荐）
    └── YourFont.woff2      # 你的字体文件（WOFF2格式，最推荐）
```

## 🎨 支持的字体格式

- **WOFF2** (.woff2) - 最佳选择，文件最小，支持最好
- **WOFF** (.woff) - 很好的选择，兼容性好
- **TTF** (.ttf) - 通用格式，文件较大
- **OTF** (.otf) - OpenType格式，功能丰富

## ⚙️ 添加自定义字体步骤

### 1. 准备字体文件
将你的字体文件复制到 `public/fonts/` 目录

### 2. 在 fonts.css 中定义字体
编辑 `public/fonts/fonts.css` 文件，添加你的字体定义：

```css
@font-face {
  font-family: 'YourFontName';        /* 字体名称 */
  src: url('./YourFont.woff2') format('woff2'),
       url('./YourFont.woff') format('woff'),
       url('./YourFont.ttf') format('truetype');
  font-weight: normal;                /* 字体粗细 */
  font-style: normal;                 /* 字体样式 */
  font-display: swap;                 /* 字体加载策略 */
}
```

### 3. 在代码中注册字体
编辑 `src/components/ImageEditor.jsx` 文件，在 `fontFamilies` 数组中添加：

```javascript
{
  name: '你的字体显示名',
  value: '"YourFontName", "备用字体", sans-serif',
  preview: '预览文字',
  category: 'custom'
}
```

## 📝 常用字体推荐

### 中文字体
- **思源黑体** - 开源，支持多语言
- **站酷字体系列** - 免费商用，设计感强
- **文泉驿字体** - 开源中文字体
- **方正字体** - 专业中文字体（注意版权）

### 英文字体
- **Roboto** - Google 设计，现代简洁
- **Open Sans** - 可读性强
- **Lato** - 人文主义风格
- **Montserrat** - 几何风格

### 装饰字体
- **Pacifico** - 手写风格
- **Lobster** - 复古风格
- **Dancing Script** - 优雅手写体

## 🔧 实用技巧

### 字体格式转换
可以使用在线工具将字体转换为Web格式：
- [Font Squirrel](https://www.fontsquirrel.com/tools/webfont-generator)
- [CloudConvert](https://cloudconvert.com/)

### 字体压缩
使用工具压缩字体文件大小：
- [fontmin](https://github.com/ecomfe/fontmin)
- [subfont](https://github.com/Munter/subfont)

### 版权注意
- 确保你有使用字体的合法权限
- 开源字体：思源黑体、文泉驿、站酷字体等
- 免费商用字体：阿里巴巴普惠体、OPPOSans等

## 🚀 示例：添加"站酷庆科黄油体"

1. **下载字体文件**
   ```
   ZCOOLQingKeHuangYou-Regular.ttf
   ```

2. **放置文件**
   ```
   public/fonts/ZCOOLQingKeHuangYou-Regular.ttf
   ```

3. **定义字体**（在 fonts.css 中）
   ```css
   @font-face {
     font-family: 'ZCOOLQingKeHuangYou';
     src: url('./ZCOOLQingKeHuangYou-Regular.ttf') format('truetype');
     font-weight: normal;
     font-style: normal;
     font-display: swap;
   }
   ```

4. **注册字体**（在 ImageEditor.jsx 中）
   ```javascript
   {
     name: '站酷庆科黄油体',
     value: '"ZCOOLQingKeHuangYou", "黑体", sans-serif',
     preview: '黄油体',
     category: 'custom'
   }
   ```

## 🎯 最佳实践

1. **文件命名**：使用英文和数字，避免中文和空格
2. **文件大小**：尽量选择文件较小的格式（WOFF2 > WOFF > TTF）
3. **备用字体**：总是提供备用字体以防自定义字体加载失败
4. **预览文字**：选择能体现字体特色的预览文字
5. **分类管理**：按类型组织字体（中文、英文、装饰等）

## ❓ 常见问题

**Q: 字体文件很大怎么办？**
A: 可以使用字体子集化工具，只保留需要的字符

**Q: 字体没有显示？**
A: 检查文件路径、CSS语法、浏览器控制台错误

**Q: 可以使用Google字体吗？**
A: 可以，但需要网络连接。建议下载到本地使用

**Q: 如何知道字体是否免费商用？**
A: 查看字体官网的许可证信息，或使用开源字体 