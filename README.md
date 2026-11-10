# GunBase 火械基地 — PWA 产品展示 + 在线询盘

一个纯静态、可安装的 PWA 网页应用，用于向海外客户展示瞄准镜 / 战场急救课程 / 战术装备，并收集询盘。
无需后端服务器，零托管成本（可部署到 GitHub Pages / 任意静态空间）。

## 功能
- 中英双语（EN / 简体中文）一键切换，记忆选择
- 产品目录：三大类（scopes / firstaid / gear），分类筛选 + 关键词搜索
- 客户询盘：公司名 / 联系人 / 邮箱 / 电话 / 国家 / 需求产品点选 / 数量 / 贸易条款(FOB·EXW) / 期望交期 / 备注
- 询盘提交：自动生成邮件（发到商家邮箱）或打印 / 存为 PDF
- 贸易条款展示：50% 订金 + 出货前 50% 尾款 + FOB/EXW
- 商家后台 `admin.html`：上传 Excel 一键导入产品，导出 `products.js` 并支持本机预览
- 可安装（PWA）、离线可访问（Service Worker）

## 目录结构
```
gunbase-pwa/
  index.html        客户前台
  admin.html        商家导入后台（noindex）
  css/style.css     暗色战术 HUD 主题
  js/config.js      ← 改这里：商家邮箱 / 公司名 / 货币 / showPrice 开关
  js/i18n.js        双语文案
  js/products.js    ← 产品数据（由 admin 生成/覆盖）
  js/app.js         前台逻辑
  js/admin.js       后台导入逻辑
  libs/xlsx.full.min.js   SheetJS（Excel 解析）
  assets/           图标
  images/           产品图片目录（见下方「产品图片」）
  manifest.webmanifest / sw.js   PWA
```

## 第一步：填写商家信息
打开 `js/config.js`，把 `sellerEmail` 改成你的真实收件邮箱，`company` 抬头、`currency` 货币按需修改。

## 第二步：导入产品（Excel 一键上传）
1. 打开 `admin.html`
2. 点「Download blank Excel template」下载模板，按列填好产品
   - 列：`id, category(scopes/firstaid/gear), name_en, name_zh, sku, desc_en, desc_zh, price(0=面议), moq, specs_en, specs_zh, image(可选图片URL)`
3. 上传填好的 Excel → 预览核对
4. 点「Download products.js」下载生成文件，用它**覆盖**站点里的 `js/products.js`
5. （可选）「Preview」可在本机浏览器先看效果，无需部署

## 第三步：本地预览
因 PWA 需 http(s) 环境，请用本地服务器打开（不要直接双击 html）：
```
cd gunbase-pwa
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 第四步：部署（GitHub Pages，免费）

> ⚠️ 为什么必须部署？
> 不部署 = 客户打不开。当前是纯静态 PWA，本地 `file://` 只能在你自己电脑跑，
> 且浏览器会禁掉 localStorage / Service Worker / PWA 安装等核心功能。
> **部署到 GitHub Pages 后，你会得到一个公开 URL，把它发给所有客户即可。**

1. 把 `gunbase-pwa/` 整个目录推到一个 GitHub 仓库（仓库设为 **Public**，Pages 才能公开访问）
2. 仓库 **Settings → Pages → Branch 选 `main`、目录选 `/ (root)`** → Save
3. 约 1 分钟后访问 `https://<用户名>.github.io/<仓库名>/`（本账号示例：`https://gunbase-optics.com/`）
4. 客户用手机/电脑打开该链接 → 可「添加到主屏幕」安装成 App，离线也能看目录

### 怎么发给不同客户 / 怎么同步（核心）
- **一个链接发给所有客户**：客户各自在询盘表单里填写自己的公司、联系人、需求——询盘按客户自动区分，无需为每人做一份网站。
- **同步是自动闭环**：
  ```
  后台 admin.html 上传 Excel → 导出 products.js → 运行 ./deploy.sh（一条命令）
        → git 推送 → GitHub Pages 自动重新发布
        → 所有客户打开同一链接即看到新品（PWA 自动刷新缓存）
  ```
- **客户侧无感更新**：`sw.js` 对 `products.js` 采用「网络优先」策略，你一发布，客户再次打开（或下拉刷新）就拿到最新目录，不用重装。
- 如需**为不同客户做不同目录/价格/品牌**（白标），可后续用「多仓库」或「URL 参数切换」实现，默认共享同一目录即可。

### 一键发布脚本（推荐）
仓库关联 origin 后，每次改完产品只需：
```bash
cd gunbase-pwa
./deploy.sh          # 自动 git add / commit / push，触发 Pages 重新发布
```
（脚本不写死代理；若本机需走代理，在 `.git/config` 里设 `http.proxy` 即可。）

## 扩展（可选）：用 Supabase 做真·动态后台
当前为静态方案：导入 Excel 后需重新部署才会让所有客户看到。
若想「上传即对所有客户生效」并集中收询盘，可接入你已有的 Supabase：
- 产品存 `products` 表，admin 上传 Excel 写入，前台 `fetch` 读取
- 询盘存 `inquiries` 表，提交时 INSERT，商家后台可查
需要的话我可以帮你把这套接上（你已有 Supabase 项目 nsnmtkukx...）。

## 产品图片（images/）
当前产品暂无图，卡片显示准星占位图。接入真实图片：
1. 把图片放进 `images/` 目录，建议用 **SKU/货号** 作文件名（如 `RDS-57.jpg`）。
2. 在 Excel 的 `image` 列填文件名 `RDS-57.jpg`（或 `js/products.js` 里改 `image` 字段）。
3. 裸文件名会自动拼成 `images/RDS-57.jpg`；也可直接填完整 URL。
详见 `images/README.md`。图片加载失败会自动回退占位图。

## 价格与英文规格说明
- **价格默认隐藏**：`js/config.js` 中 `showPrice:false`，全站不展示任何价格（含「价格面议」字样也不显示）。如需公开，改为 `true` 并填 `price` 字段即可。
- **英文规格/描述**：当前英文描述与「Key Specs」按产品类型（13 个子类）由领域知识本地撰写，专业且干净；完整详细规格保留在中文 `specs_zh`。如需逐件精确英文规格，可在 Excel 的 `specs_en` 列提供，或交给我按中文逐件精翻（需联网翻译，当前环境受限）。

## 注意
-  firearms / 战术装备面向海外销售涉及各国合规与出口管制，上线前请自行确认目标市场法规。
- `admin.html` 含 `noindex`，不会被搜索引擎收录，但仍建议部署在私有/受限访问位置。
