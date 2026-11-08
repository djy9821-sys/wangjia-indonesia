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

- 视觉打磨：画了一套矢量水车/叶轮/齿轮箱/浮筒插图（`brand/products/`，渲染为 PNG 放在后端 `static/products` 与商城 `public/products`），种子数据和 `set-product-images.ts` 脚本把插图挂到商品上（真实照片到位后在后台替换即可）；商城首页用 2 HP 插图作主视觉；App 统一主题（浅蓝底、白卡片、圆角按钮）、首页品牌头图 + 三个信任标签、商品卡片 4:3 大图 + “Garansi 12 bln”角标 + 价格区、详情页价格块与信任标签。（CI 611eea3 四项全绿）

- App 页面风格统一：登录页品牌头图 + 密码可见切换 + 回车提交；订单卡片改为缩略图 + 日期/件数 + 商品摘要 + 发货/付款两个状态标签；账户页改为头像卡（姓名首字母、公司标签）+ 分组卡片（服务 / 设置 / 退出），底部显示版本号，新增「Bantuan（WhatsApp）」入口；购物车、订单、报价、通知的空状态统一为图标 + 说明 + “Lihat produk”按钮。订单行项目模型加 `thumbnail`。
- 网页商城印尼语化：账户区（导航、总览、订单、报价、资料、地址、公司、审批）、购物车、结账各步骤、订单详情、询价弹窗等 75 个文件的 starter 英文文案全部改为印尼语（`src/lib/util/order-status.ts` 统一发货/付款状态文案与 id-ID 日期）；网页订单卡加缩略图与状态标签；账户页横幅、登录页右栏、购物车登录提示的 starter 抽象图换成品牌视觉块 `BrandBanner`（渐变 + WANGJIA 字标 + 2 HP 插图）。
- 商城第二轮印尼语化：商品页/列表/筛选/排序/搜索/面包屑/页脚/404 的 starter 英文全部改掉（页脚去掉 Medusa 推广链接和 “Powered by” 角标）；联系页改为真正的印尼语页面（WhatsApp + 邮箱，取自 `NEXT_PUBLIC_WHATSAPP_NUMBER` / `NEXT_PUBLIC_CONTACT_EMAIL`）；货币改为 `Rp 8.900.000` 格式（id-ID，整数不显示分）；商品卡库存改为“Tersedia / Sisa N unit / Stok habis”；价格注明「Belum termasuk PPN 11%」——顺手修正 App 里原先写反的「Sudah termasuk PPN」（目录价为未税价，PPN 在结算时加）。（CI e3ac279 四项含 APK 全绿；dd0a891 的运行被后一次推送按并发规则取消）
- 真实产品资料入库：从 WANGJIA 印尼经销商（Pusat Kincir / PT AKU）的博客 wangjiaerator.blogspot.com 抓取了 60 多篇产品帖和 110 张图，挑出 27 张没有第三方电话水印的实拍/目录图（裁掉两张带电话的边角），压到 ≤1000px 放进后端 `static/products/*.jpg`。种子商品从 5 件扩成 15 件：整机 4 件（1 HP 含 9SP 机械密封与 4SP 油封两种齿轮箱、2 HP 四叶轮、2 HP 射流增氧机、YC-055 直驱 550 W 无齿轮箱）+ 配件 11 件（叶轮 6/8 叶、齿轮箱尼龙/铸铁/不锈钢/4SP 油封、1 HP/2 HP 电机、浮筒、电机罩、9 花键齿轮组、轴座、联轴器铸铁/不锈钢、SS304 轴、1 HP/2 HP 机架、机械密封套件）。每件带印尼语描述（卖点、9/12 koli 装箱清单、加油与保养）和 `spec:` 参数表（功率/电压电流/叶轮/齿轮箱/浮筒/机架/轴/适用塘面积/装箱/保修），App 和商城的参数表自动显示。价格仍是**参考价**（按博客 2019–2022 标价上浮取整，种子注释里写明），正式上线前要 李总 在后台改成真实价目。
- 新脚本 `src/scripts/sync-catalog.ts`：按 handle/SKU 把已有数据库同步到种子定义（更新文案、图片、参数、补新变体；规格项变了就整件重建；加 `recreate` 参数全部重建），默认不覆盖后台改过的价格；`rebrand-wangjia.ts` 改为调用它，删掉只会挂插图的 `set-product-images.ts`。顺手修了搜索索引在 `product-option.*` 事件里遇到已删除行时的 `product_id` 空指针。
- 商城：首页主视觉改为 1 HP / 2 HP 实拍图 + 按真实卖点改写的文案；新增 `/panduan` 安装与保养指南（装箱清单可点到对应配件、10 步组装、换油周期、故障对应配件），页脚加链接。本机验证：tsc/lint 两端无错误，同步脚本连跑两次结果收敛（15 件），网页首页/列表/详情/指南页和 App 商品列表均显示实拍图和新参数。
- 产品图统一处理（李总反馈“图片能不能好看些”）：原图只有 300–700 px，无法凭空提清晰度或去掉 WANG JIA 水印，所以做的是统一规格——`brand/products/enhance-photos.cjs`（sharp）先裁掉图里自带的蓝色边框、标题和说明字幕，白底图再自动去白边，然后全部居中放到 1200×1200 白底正方形（留白 8 %），轻度锐化/对比度/饱和度，mozjpeg 压缩（27 张共 2.6 MB）。列表页和详情页现在每张图尺寸、留白一致。真正好看还得李总用手机补拍，脚本可以直接复用。 App 商品卡片和详情图廊改为白底完整显示（`BoxFit.contain`），不再把正方形图裁成 4:3；商城商品详情图廊改为白色正方形展示台（原来 80px 内边距把图压得很小）+ 56px 缩略图带选中框。
- 发现并修掉一个流程坑：`medusa exec` 跑完脚本就退出，本地事件总线来不及把商品变更写进搜索索引，整体重建商品后商城列表页会空白。`sync-catalog.ts` 现在结尾调用 Search 模块 `reindex({ index: "product", strategy: "in_place" })` 并轮询到 `ready` 再退出。（CI ee25466、f9fca67 四项全绿）
- 正式 logo 到位（李总发来一张带灰底和产品图的 JPG）：用 `brand/logo/cut-from-source.cjs` 按饱和度/明度把蓝色 W、红点和黑色 WANG JIA 字样从灰底里抠成透明 PNG（标志、字标、竖排组合、横排组合各一份），再用 `brand/logo/build-assets.cjs` 一键生成 App 启动图标/自适应图标/启动页（白底）、商城 `icon.png`/`apple-icon.png`/`favicon.ico`、1200×630 的 Open Graph 分享图。App 的 `WangjiaLogo` 组件改为直接用官方图（无字版放在白色圆角块里，蓝底上也看得清），商城顶栏换横排组合标；品牌渐变从“深蓝→绿”改为 logo 的“天蓝 #0193DE → 深蓝 #0E5A8A”。占位用的矢量水车 logo 和 SVG 全部删除。（CI eb77789 四项含 APK 全绿）
- 拼团（Patungan）上线，借鉴拼多多但按李总的生意改：后台开一个“某型号 × 团购价 × 最低台数 × 截止日”的拼团，养殖户在 App/商城看到进度条，选台数「Ikut patungan」后商品按团购价进购物车（Medusa 加购工作流的自定义单价 + `metadata.group_buy_id`），后面走原有的地址/运费/付款计划流程；订单成立时订阅器把台数计入拼团，凑够即成团并给所有参与者发 WhatsApp/邮件/推送，整点定时任务把过期未成团的标为失败并通知（财务退款或按原价继续）。结账前校验拼团仍开放，关闭后不能再用团购价下单。新模块 `group-buy`（group_buy / group_buy_order 两张表）、工作流 5 个、`/store/group-buys`、`/store/group-buys/:id/join`、`/admin/group-buys`，后台「拼团 / Patungan」页可新建、看参团订单、取消。商城首页改为“先看货”：主视觉压短 → 进行中的拼团 → 8 件商品网格（原推荐系列挪到最后），商品页右侧显示该商品的拼团，新增 `/patungan` 说明页；App 商品页顶部加拼团横滑卡和参团弹窗，结账页支持接管服务端已建好的购物车。
- 本机联调：用管理员接口开了一个“1 HP 3 Phase – Lampung”拼团（团购价 465 万，最低 5 台），以 Budi 身份通过 store 接口参团 3 台并完成下单，订单行单价 465 万、含 PPN 合计 15.484.500，拼团进度变为 3/5；网页商品页点「Ikut patungan」后购物车里是团购价，App 卡片与参团弹窗正常。顺带发现并修了一个严重问题：昨天 `sync-catalog recreate` 重建商品时把商品绑到了 Medusa 首次启动自建的另一个“Default Shipping Profile”，与配送方式所属模板不一致，导致任何购物车都无法结账；同步脚本现在选配送方式所属的模板，已把 15 件商品重新绑回。 集成测试新增 group-buys 用例（创建/列表、参团进购物车、成团与过期、取消）；第一轮 CI 只挂了一条——测试种子的商品用美元计价而快照只认 IDR，改成回退到商品第一个价格后全绿（CI b87ede1 一条失败 → cb69fdd 四项全绿）。本机 jest 连内嵌 Postgres 时报 “server does not support SSL”，暂未解决，集成测试以 CI 为准。
- App 外观按电商平台的版式重做（米杰反馈“没 Shopee / 拼多多好看”）：新增品牌色板 `widgets/brand.dart`（品牌蓝管导航与标识，新增橙红强调色 #F04E23 专管价格、促销与主按钮）。首页改为：蓝色顶栏 + 本地搜索框 → 用真实商品图生成的轮播 banner（3 张，可点进详情）→ 四个图标入口（整机 / 配件 / 拼团 / 保修）→ 拼团横条改橙红强调 → 「Semua produk」双列商品网格（正方形图、两行标题、橙红大价格、“N tipe” 角标、Garansi / Bisa cicil 小标签）。商品页改为：全宽正方形图廊 → 橙红大价格 + PPN 提示 → 标题与信任标签 → 带价格的规格方块选择 → 数量 → “批量采购询价”入口 → 参数表 / 描述分块白卡；底部固定购买栏「Chat · Keranjang · + Keranjang · Beli sekarang」。功能一个没加，代码量基本持平；模拟器逐屏核对过溢出问题。 第二轮把全局主题统一到同一套色板（白色顶栏、橙红主按钮、底部导航选中态橙红），购物车改为电商式条目（白底方图、规格小标签、橙红单价、方形加减器、垃圾桶删除）和底部固定结算栏（小计橙红大字 + 「Checkout (N)」），订单卡片金额改橙红。
- 装到米杰 iPhone 14 Pro 的尝试：手机已连线、开发者模式已开，但电脑上的 Apple ID 是免费个人团队，不能给带「关联域名（Universal Links）」权限的 App 签发描述文件，需去掉该权限单独签一份测试包；另外 Xcode 命令行要用 `-clonedSourcePackagesDirPath build/ios/SourcePackages` 复用 Flutter 已解析的 Swift 包才能离线编译。手机测试版商品图地址需指向电脑局域网 IP（已用 `BACKEND_PUBLIC_URL=http://192.168.3.207:9000` 重跑 sync-catalog）。

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
