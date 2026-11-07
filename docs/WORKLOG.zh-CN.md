# 工作日志（WANGJIA 印尼销售平台）

仓库：github.com/djy9821-sys/wangjia-indonesia（公开）。每条记录对应一次或几次提交；验证方式写在括号里。待办见文末。

## 2026-11-07

### 13:59 – 16:19 搭建主体
- `b4fefae` 基于 Medusa v2 B2B starter 搭起后端 + 管理后台 + Next.js 商城 + Flutter App。核心是自定义 `payment_plan` 模块：分期（定金/尾款）、转账凭证上传、财务确认、发货放行闸门。本地用 embedded-postgres 跑库（机器没有 Docker/brew）。
- `c7575e0` 退款、取消计划并自动取消订单、定金超时自动过期；印尼省/市县/区三级地址数据（38/514/7285）。
- `34b7d5b` 上线前加固：凭证私有存储（S3/R2 签名链接）、后台角色（owner/sales/finance/warehouse）、活动计划期间锁定订单编辑、WhatsApp/邮件通知、Redis 模块可选。
- `22a503c` 网页商城付款计划页；后台自定义页面中/印双语切换。
- `509f567` 品牌改为 WANGJIA® 增氧水车（kincir air），公司 PT Adhinusa Lestari Jaya（用户说“好像是”，待确认）；种子目录换成 1 HP / 2 HP 增氧机和配件；占位 logo。
- `54e9c13` App：bundle `id.co.wangjia.wangjiaApp`，Keychain 存 token，本地购物车，询价与报价对话。
- `3a063c0` 商品规格表、图集、分类筛选，App 内 Midtrans 支付（WebView）。
- `f575a06` 忘记密码、地址簿、注册时 WhatsApp OTP。
- `26e29a2` 推送后端（FCM provider）、财务 CSV 导出、`deploy/` 单机 Docker 方案（Postgres、Redis、Caddy、Uptime Kuma、Umami、每日备份）。
- `3743d05` 发票 PDF（含 PPN、签名链接）、App 推送客户端。（后端 9 个集成测试通过；浏览器和模拟器逐页验证）

### 21:41 – 22:18 工程化
- `6252de7` 公共接口限流、付款到期提醒定时任务、后台总览卡片。
- `4c007c5` GitHub Actions CI（后端 tsc/lint/集成测试，商城 tsc/lint，App analyze/test），英文 README。
- `5f95eaa` SEO（印尼语描述、hreflang、OG 图），Chatwoot 客服台独立 compose。
- `c84db3c` 修 starter 自带测试在 CI 失败：`difference_sum` 字段已不存在；两个 spec 覆写 `JWT_SECRET` 导致 401（运行器先加载配置再注入 env）。（CI 三项全绿）

### 23:04 – 23:46 防伪保修、售后、发布准备
- `aded23b` `warranty` 模块：每台一个序列号 + 随机二维码，公开验真（记扫码次数）、客户登记保修、作废；后台「防伪保修」页批量生成与 CSV；商城 `/garansi/<code>` 落地页；App 扫码（mobile_scanner）、手动输码、我的机器；收货地址地图打点（flutter_map + OSM + Nominatim），仓库页地图链接；错误上报（后端 Sentry 协议 + App 纯 Dart sentry，GlitchTip compose）；Biteship 物流轨迹接口与 App「Lacak」；Fastlane 四条发布通道。期间发现并修复：在 `apps/backend` 下执行 `pnpm add` 会被该目录的 `node-linker=hoisted` 重排依赖，导致 core-flows 加载两份而起不来——从根目录重装解决，并记入 README/备忘。
- `4b5d0e0` App 内注销账号（匿名化 + 吊销登录 + 旧 token 立即失效）；订单页「机身序列号」面板（装箱时扫码关联）；客户在订单里一键登记保修；我的机器一键 WhatsApp 报修；总览加保修统计。
- `2909cba` 保修到期前 30 天自动提醒；A4 二维码标签 PDF（3×8）；发票列出序列号；客户详情页「客户的机器」；网页账户 Garansi 页；App 离线目录缓存；商品页 WhatsApp 分享；rclone 异地备份。
- `903294e` 老板中文日报（WhatsApp + 邮件）；商品页信任块；作废序列号不再出现在客户列表。
- `957f43f` 发布硬伤：Android 主 manifest 补 INTERNET/CAMERA，iOS 补相册权限说明；按产品元数据预填保修月数。
- `b46c351` 印尼语隐私政策、条款、运费、退换四页（替换 starter 英文占位）；上架清单。
- `876eb22` CI 增加 Android APK 构建产物（不用 Mac 也能拿测试包）。
- `109c266` 我的机器 → 配件分类直达；后台「只看可疑扫码」。
- `dbab7dc` `beb6ec9` `1aacebb` 标签/可疑筛选测试，保修推送深链接，App 模型单元测试，后台双语「操作指南」页。
- `9ff50c1` 小额订单自动生成全款付款计划（`AUTO_PLAN_MAX_TOTAL`），配件可立即付款；集成测试覆盖。
- `202884d` 网页下单成功页加“去付款”入口；App 下单后重试拉取计划。

## 2026-11-08
- `f6a638f` `7a84b75` 网页注册补 WhatsApp 号码字段（动作里已读取，表单漏了）。
- `29216f6` 商城 SEO 博客（4 篇印尼语文章，进 sitemap）；App 版本策略接口与更新门控（侧载 APK 也有效）；Typebot、DocuSeal compose 与文档；DocuSeal 签约回调写入订单；集成测试增至 30 个。（CI 四项含 APK 全绿：7a84b75；29216f6 运行中）

- `7b6c4fc` 本工作日志。
- `0fc409e` App 打磨：错误提示人话化（断网/超时/会话过期/服务器错误 → 印尼语提示，所有请求加 25 秒超时）；原生启动画面（flutter_native_splash，品牌蓝 + logo）；商品图片磁盘缓存（cached_network_image）；扫码直达 App（iOS Universal Links + Android App Links：entitlements、manifest、`onGenerateRoute`，商城提供 `/.well-known/apple-app-site-association` 与 `assetlinks.json`，需填 Apple Team ID 与安卓签名指纹）。

- 运维可靠性：数据库恢复脚本 `deploy/scripts/restore.sh` 与恢复演练说明；`/health/deep`（检查数据库 + 缓存，异常 503，给 Uptime Kuma）；Caddy 统一安全响应头（HSTS、nosniff、Referrer-Policy 等）；`apps/mobile/maestro/` 三条端到端测试脚本（登录浏览、输码验真、订单详情，供真机前验证，本机未执行）。（集成测试 31 个；CI 0fc409e 四项全绿）

- `2c02f0f` 商城全站 WhatsApp 悬浮按钮；后台订单页「销售合同」面板（DocuSeal 签完自动出现，含文件和审计日志链接）。

- WhatsApp 模板模式：Meta 规定会话窗口外只能发已审核模板，provider 现在在配置 `WHATSAPP_TEMPLATE_NAME` 后自动把每条通知包进通用模板（换行转 ` | `、1024 字截断）；提交审核的模板文案见 `docs/whatsapp-templates.md`。网页订单详情补齐：物流轨迹（Biteship）、订单内机器一键登记保修。

- 后端单元测试（WhatsApp provider 号码归一化/模板参数/干跑、保修序列号与码解析），`pnpm test:unit` 进 CI。

- 站内通知：所有发给客户的通知带 `receiver_id`，`GET /store/notifications` 返回去重后的历史，App「账户 → Notifikasi」可回看并跳转订单/保修；发货后 7 天自动回访（`FOLLOWUP_DAYS`，回复进 Chatwoot）；操作指南新增「经销商开子账号与信用额度」。优化大纲 `docs/ROADMAP.zh-CN.md`。

- 视觉打磨：画了一套矢量水车/叶轮/齿轮箱/浮筒插图（`brand/products/`，渲染为 PNG 放在后端 `static/products` 与商城 `public/products`），种子数据和 `set-product-images.ts` 脚本把插图挂到商品上（真实照片到位后在后台替换即可）；商城首页用 2 HP 插图作主视觉；App 统一主题（浅蓝底、白卡片、圆角按钮）、首页品牌头图 + 三个信任标签、商品卡片 4:3 大图 + “Garansi 12 bln”角标 + 价格区、详情页价格块与信任标签。

## 本机验证手段
- 后端：`pnpm test:integration:http`（30 个用例）、tsc、medusa lint；curl 走接口；浏览器查后台页面。
- 商城：tsc、lint；浏览器查页面；sitemap 检查。
- App：flutter analyze/test；离线 SwiftPM 编译后装到 iPhone 17 Pro 模拟器逐页点；Dart 不走系统代理，本机需 `--dart-define=DEV_PROXY=127.0.0.1:1082` 地图瓦片才加载。

## 尚未完成 / 需要 李总 提供
- 真实凭证：Midtrans、WhatsApp Cloud API、Resend、Firebase（iOS/Android 配置文件 + 服务账号）、R2/S3、Redis、Biteship、GlitchTip DSN。
- 官方 WANGJIA logo 文件；确认公司全名、NPWP、收款账户（只放 `.env`）。
- Apple Developer / Google Play 账号，域名与 VPS。
- Android 真机/模拟器测试（本机无 Android SDK，只能靠 CI 产物）。
- 印尼律师过一遍隐私政策与条款文案。
- App 真机验证：相机扫码、FCM 推送、Midtrans 沙盒支付、Universal/App Links（安卓用 CI 产出的 APK，iOS 需开发者账号签名）。
- 端到端自动化：用 Maestro 把“登录 → 下单 → 付款计划 → 扫码登记”写成脚本放进 CI。
