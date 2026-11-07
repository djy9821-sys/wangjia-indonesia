# WANGJIA® 印尼官方商城

李总（PT Adhinusa Lestari Jaya，待确认）的 WANGJIA 品牌增氧水车（kincir air / paddle wheel aerator，虾塘鱼塘用）在印尼的官方商城与 App。基于 [Medusa B2B Starter](https://github.com/medusajs/b2b-starter) 改造。

品牌素材在 `brand/`：目前是我们画的占位标识，拿到李总的正式 logo 文件后替换同名文件即可。

工作日志（每次提交做了什么、怎么验证、待办）：[docs/WORKLOG.zh-CN.md](docs/WORKLOG.zh-CN.md)。

## 业务流程

```
客户在 App/网页看产品 → 询价或下单 → 销售报价、创建付款计划（定金/尾款）
→ 客户付款（Midtrans 在线支付 或 银行转账并上传凭证）
→ 财务确认到款 → 订单“放行” → 仓库备货、填写货运公司与单号发货
→ 客户在 App 查看进度
```

- **付款计划**（`payment_plan` 模块）：一张订单一个计划，拆成若干期。发货条件可选"定金到账即可发货"或"全款到账才可发货"。
- **Midtrans**：客户在 App 里为某一期生成 Snap 支付链接，支持 QRIS、GoPay、OVO、DANA、ShopeePay、各银行虚拟账户、便利店付款。Midtrans 回调 `POST /webhooks/midtrans`，结算成功自动记为已到账。
- **银行转账**：客户上传转账凭证（bukti transfer），财务在后台核对银行流水后点"确认到账"或"拒绝凭证"。
- **仓库闸门**：订单的付款计划未放行时，后台"Create Fulfillment"会被拒绝（HTTP 400）。
- **退款**：财务在订单页对已到账的期数点"退款"，可部分或全额。Midtrans 支付的通过网关原路退回；银行转账的由财务线下转回后登记。定金退完且尚未发货时，放行自动撤销，仓库重新看不到这单。
- **取消**：销售或财务可"取消付款计划与订单"，未付的期数作废、订单取消，已到账的款项留待退款。每小时跑一次的任务会自动取消"定金逾期未付"的计划（`PAYMENT_PLAN_EXPIRE_DAYS`，默认 7 天，或第一期的到期日）。
- **印尼地址**：内置 38 省、514 市县、7,285 区的行政区划数据（来源 cahyadsn/wilayah，MIT），App 下单时三级下拉选择。
- **App 购物车与报价**：App 有本地购物车（多商品、多数量一起下单，或整车询价）和“Penawaran”标签页（看销售报价、留言、接受后自动变成订单）。登录令牌存在 iOS Keychain / Android Keystore，令牌失效自动回到登录页。包名 `id.co.wangjia`，iOS 工程只用 Swift Package Manager，不需要 CocoaPods。
- **产品规格参数**：在后台商品的 Metadata 面板里加 `spec:01 Daya motor` = `1 HP` 这样的键值（前面的两位数字只用来排序，不显示），App 产品页和网页产品页的“Spesifikasi”表会自动出现。商品图片用后台自带的上传，App 里自动变成可左右滑、可放大的图集。
- **App 内支付**：Midtrans 支付页在 App 内打开，付完自动回到订单并刷新；GoPay、ShopeePay、DANA 的深链接会交给对应 App。
- **账户功能**：忘记密码（App/网页发邮件，链接到网页 `/id/reset-password` 设新密码，需要 `STOREFRONT_URL`）；地址簿（App 的“Alamat Saya”，下单时可选常用地址并勾选保存）；注册时 WhatsApp OTP（`POST /store/otp/request`、`/store/otp/verify`，`OTP_REQUIRED=true` 时没验证过手机不能注册，本地可用 `OTP_DEV_CODE`）。
- **推送通知**：客户通知除 WhatsApp/邮件外同时推送到 App（Firebase Cloud Messaging）。设备令牌在登录后自动注册到 `/store/push-tokens`，退出时删除；FCM 报无效的令牌会自动清理。点击通知直接打开对应订单。
- **发票 PDF**：订单的 Proforma Invoice / Invoice（印尼语，含 PPN 11%、已付与剩余、付款计划状态）。后台 `GET /admin/orders/:id/invoice`；客户在网页订单页和 App 订单页点“Unduh Invoice”拿到 24 小时有效的签名链接。抬头信息在 `.env` 的 `COMPANY_*`（公司名、地址、NPWP、电话、邮箱、收款账户），`BACKEND_PUBLIC_URL` 填后端公网地址。正式税务发票（e-Faktur）仍需会计在 DJP Coretax 开具。
- **催款提醒**：每天 09:00（雅加达时间）自动给“2 天内到期”和“已逾期”的分期发 WhatsApp/邮件/推送提醒，并给财务发一封逾期汇总；每期每天最多提醒一次。天数和时间在 `REMINDER_DAYS_BEFORE`、`REMINDER_CRON`；手动跑一次：`pnpm medusa exec ./src/scripts/run-reminders.ts`。
- **接口限流**：登录/重置密码每 IP 15 分钟 20 次，OTP 10 次，注册与询价每小时 10 次，凭证上传每小时 30 次；超出返回 429。测试环境用 `RATE_LIMIT_DISABLED=true` 关闭。
- **后台概览**：订单列表上方五个数字：待确认到款、逾期未付、待发货、待报价、本月已收，点击直达对应页面；订单页有“WhatsApp 客户”一键联系。
- **财务导出**：后台“财务到款”页底部按到账日期导出 CSV（到款与退款，含订单号、客户、金额、方式、确认人），UTF-8 带 BOM，Excel 直接打开，给会计做对账和 PPN 申报。
- **网页端付款**：网页商城"账户 → 订单详情"里有与 App 一致的"Rencana Pembayaran"：看分期、在线付款（Midtrans）、上传转账凭证、看退款。
- **后台双语**：付款计划面板、财务到款、仓库发货、团队角色四个页面右上角有"中文 / ID"开关，默认跟随 Medusa 后台语言（中文界面显示中文，其他显示印尼语），选择保存在浏览器里。文案字典在 `src/admin/utils/i18n.ts`。
- **角色**：owner（负责人，全部权限）、sales（销售：报价、建/取消付款计划）、finance（财务：确认到款、拒绝凭证、退款、取消）、warehouse（仓库：发货）、none（只读）。在后台"团队角色"页分配，只有负责人能改，且系统至少保留一个负责人。没分配任何角色之前所有管理员按负责人处理（首次引导），分配第一个角色后即按实际角色生效；未分配的人默认 `ADMIN_DEFAULT_ROLE`（默认 none）。
- **改单锁定**：订单一旦有付款计划，后台的 Order Edit 会被拒绝。要加运费或改数量：订单页点"仅取消计划（改单用）"→ 改单并确认 → 重新创建付款计划。取消过的计划保留作记录。
- **通知**：客户上传凭证（通知财务 + 客户回执）、到账确认（客户）、放行（仓库）、凭证被拒（客户）、退款（客户）、取消（客户）、发货含货运单号（客户）。客户走 WhatsApp Business Cloud API，兜底邮件；员工走邮件（Resend），收件人取自 `FINANCE_NOTIFY_EMAILS` / `WAREHOUSE_NOTIFY_EMAILS`，未设置则发给对应角色的管理员。未配置密钥时只打印日志（`[whatsapp:dry-run]` / `[email:dry-run]`），不影响流程。
- **凭证存储**：配置 `S3_*`（Cloudflare R2 / S3 / MinIO）后，转账凭证以私有方式上传，接口返回 15 分钟有效的签名链接；不配置则落在本地 `static/`（仅限开发）。
- **生产基础设施**：设置 `REDIS_URL` 后自动启用 Redis 事件总线、工作流引擎、缓存和锁；不设则用内存版（重启丢状态，仅限开发）。

## 目录

```
apps/backend/     Medusa v2 后端 + 管理后台扩展
  src/modules/payment-plan/        付款计划、分期、转账凭证 数据模型
  src/workflows/payment-plan/      创建计划、确认到款、拒绝凭证、Midtrans 交易与回调
  src/api/admin/payment-plans/     后台接口 + 发货闸门中间件
  src/api/store/payment-plans/     App 用的接口（查看计划、上传凭证、发起 Midtrans）
  src/api/webhooks/midtrans/       Midtrans 通知
  src/admin/widgets/order-payment-plan.tsx   订单详情页的"付款计划与到款确认"面板
  src/admin/routes/finance/        财务待确认列表
  src/admin/routes/warehouse/      仓库待发货列表
  src/scripts/set-admin-role.ts    给管理员分配角色
  src/migration-scripts/initial-data-seed.ts  印尼地区、PPN 11%、雅加达仓、货运方式、WANGJIA 增氧水车与配件目录（价格为占位，后台改）
  src/scripts/rebrand-wangjia.ts   老数据库改品牌：改店名、下架示例商品、建 WANGJIA 目录（跑完后在后台随便保存一次商品，或重启后端，让网页搜索索引刷新）
apps/storefront/  Next.js 15 网页商城（印尼地区）
infra/            本地开发用的内嵌 PostgreSQL（不需要 Docker / Homebrew）
```

## 本地运行

前置：Node 22.23.4+，pnpm 9.15。

```bash
# 1. 启动本地 Postgres（保持这个终端开着）
cd infra && npm install && node pg.js

# 2. 安装依赖
pnpm install

# 3. 后端：迁移 + 种子数据（会打印 Publishable API key）
cd apps/backend
cp .env.template .env   # 填 DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/indo_b2b 及随机 JWT/COOKIE secret
pnpm medusa db:migrate

# 4. 创建管理员并分配角色
pnpm medusa user -e boss@example.com -p supersecret
pnpm medusa user -e finance@example.com -p supersecret
pnpm medusa exec ./src/scripts/set-admin-role.ts finance@example.com finance
pnpm medusa user -e gudang@example.com -p supersecret
pnpm medusa exec ./src/scripts/set-admin-role.ts gudang@example.com warehouse

# 5. 启动后端（后台 http://localhost:9000/app）
pnpm dev

# 6. 商城：把 Publishable key 填进 apps/storefront/.env.local 后启动（http://localhost:8000）
cd ../storefront && pnpm dev
```

后台语言：右上角头像 → Profile → Language 可切换为中文。

测试账号（本地种子）：boss@example.com（负责人）、sales@example.com（销售）、finance@example.com（财务）、gudang@example.com（仓库），密码都是 `supersecret`。
顾客示例：`infra/smoke-order.sh` 会注册 budi@contoh.id 并下一张真实订单。

## 测试

```bash
cd apps/backend
# DB_HOST 必须写 localhost（写 127.0.0.1 测试框架会强制开 SSL）
DB_HOST=localhost DB_USERNAME=postgres DB_PASSWORD=postgres \
TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules \
npx jest --config ./jest.config.js --rootDir . integration-tests/http/payment-plans --runInBand --forceExit
```

`integration-tests/http/payment-plans/payment-plans.spec.ts` 覆盖：建计划、金额校验、客户查看、发货闸门拦截、上传凭证、财务待办、确认到款并放行、重复确认拒绝、仓库待办、拒绝凭证回退、全款策略与负责人强制放行、部分/全额退款与放行撤销、取消计划、行政区划接口、未登录 401。

## Midtrans 配置

`apps/backend/.env`：

```
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx      # 沙箱 key 来自 dashboard.sandbox.midtrans.com
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_FINISH_URL=https://你的域名/pembayaran/selesai   # 付完款跳回的页面或 App 深链接
```

Midtrans 后台 Settings → Configuration → Payment Notification URL 填 `https://<后端域名>/webhooks/midtrans`。本地调试可用 ngrok 之类把 9000 端口暴露出去。

## App 用到的接口（供 Flutter 对接）

全部需要客户登录（Bearer token）并带 `x-publishable-api-key`。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/store/orders/:id/payment-plan` | 查看某订单的付款计划与每期状态 |
| GET | `/store/payment-installments/:id` | 查看单期（付款后轮询） |
| POST | `/store/payment-installments/:id/midtrans` | 生成 Midtrans Snap `token` / `redirect_url` |
| POST | `/store/payment-installments/:id/proofs` | 上传转账凭证：`{ file: { name, mime_type, content(base64) }, bank_name, sender_name, amount, transferred_at, note }` |
| GET | `/store/orders/:id/shipments` | 发货记录与货运单号 |
| GET | `/store/orders/:id/tracking` | 物流轨迹（配置 `BITESHIP_API_KEY` 后有历史节点；否则只有单号和链接） |
| GET | `/store/warranty/verify/:code` | 扫码验真（只需 publishable key；`code` 可以是二维码里的完整链接） |
| POST | `/store/warranty/register` | 登记保修 `{ code, farm_location }`，同一客户重复登记幂等，他人已登记返回 400 |
| GET | `/store/warranty/units` | 我登记过的设备与保修到期日 |
| GET | `/store/orders/:id/warranty-units` | 这个订单发出的机身序列号；配合 `POST /store/warranty/register { unit_id }` 一键登记，不用扫码 |
| DELETE | `/store/account` | 客户自助注销（App Store / Play 审核要求）：联系方式匿名化、地址和推送设备删除、登录身份删除、旧 token 立即失效；订单与保修记录保留 |
| GET | `/store/wilayah` · `/store/wilayah/:provinceCode` · `/store/wilayah/:regencyCode` | 省 → 市县 → 区 三级联动（只需 publishable key） |

后台接口（管理员登录）：

| 方法 | 路径 | 角色 |
|---|---|---|
| GET/POST | `/admin/orders/:id/payment-plan` | 查看 / 创建（sales、finance） |
| GET | `/admin/payment-installments?status=awaiting_confirmation` | 财务待办 |
| POST | `/admin/payment-installments/:id/confirm` | 确认到账（finance） |
| POST | `/admin/payment-proofs/:id/reject` | 拒绝凭证（finance） |
| POST | `/admin/payment-plans/:id/release` | 负责人强制放行（owner） |
| POST | `/admin/payment-installments/:id/refund` | 退款 `{ amount, reason, method, bank_account }`（finance） |
| POST | `/admin/payment-plans/:id/cancel` | 取消计划与订单 `{ reason, cancel_order }`（finance、sales） |
| GET | `/admin/team` | 管理员列表与角色 |
| POST | `/admin/team/:userId/role` | 分配角色 `{ role }`（owner） |
| GET | `/admin/warehouse/orders` | 仓库待发货（含客户地图打点坐标） |
| GET/POST | `/admin/warranty/units` | 序列号列表 / 批量生成 `{ product_id, variant_id, quantity, batch, warranty_months }`（warehouse、sales） |
| GET | `/admin/warranty/units/export?batch=` | 标签打印用 CSV（序列号、二维码内容） |
| GET | `/admin/warranty/units/labels?batch=` | A4 二维码标签 PDF（3×8 格） |
| POST | `/admin/warranty/units/:id` | 关联订单 / 作废 / 备注 `{ order_id, status, notes }` |
| GET/POST/DELETE | `/admin/orders/:id/warranty-units(/:unitId)` | 订单页「机身序列号」面板：装箱时扫码/输入序列号关联到订单、移除（warehouse、sales） |

## 小额订单自动付款计划

配件、附件这类小额订单不需要销售手动建付款计划：订单金额 ≤ `AUTO_PLAN_MAX_TOTAL`（默认 1500 万 IDR，设 0 关闭）时，下单或接受报价后系统自动生成一期「Pembayaran penuh」（全款、发货前付清、`AUTO_PLAN_DUE_DAYS` 天内到期），客户立刻收到 WhatsApp 并可在 App 里用 Midtrans 付款或上传转账凭证。整机大额订单仍由销售按定金/尾款建计划。

## 防伪与保修（扫码）

产品元数据里可以放 `warranty_months`（如 1 HP 12、2 HP 18），生成序列号时自动按产品预填保修月数。每台设备出厂前在后台「防伪保修」页按批次生成序列号（`WJ-26-000123`）和随机二维码（`https://商城域名/id/garansi/<12位码>`）。生成后自动下载 A4 标签 PDF（3×8 格、70×37 mm 不干胶，普通打印机即可）和 CSV（给专业标签机），贴在机身铭牌旁。

- 任何人用手机相机扫码会打开商城的验真页：正品显示产品、序列号、保修状态；仿品或已作废标签显示「无法验证」并提示举报。
- App 里「账户 → Garansi & Keaslian」用相机扫码（或手动输码）后可一键登记保修：绑定客户、记录塘口位置、算出到期日，并通过 WhatsApp / 邮件 / 推送发送保修凭证。同一台机只能被一个客户登记。
- 后台能看每个序列号的扫码次数：同一标签被扫很多次是仿品复制标签的信号。
- 网页商城的「账户 → Garansi」也能输码登记和查看自己的机器（没装 App 的客户用）。App 商品页右上角可一键把商品链接分享到 WhatsApp。
- 仓库装箱时在订单页「机身序列号」面板输入/扫描序列号，客户在 App 订单详情就能看到自己那台机器，一键登记保修（不用扫码）；「我的机器」点一下就能 WhatsApp 报修，消息里自带序列号。
- 总览页多了「已登记保修」卡片（本月新增、可疑扫码数）；客户详情页右侧有「客户的机器」面板；发票 PDF 底部列出该订单的机身序列号。
- 保修到期前 30 天（`WARRANTY_REMINDER_DAYS`）自动给客户发 WhatsApp/邮件/推送，提醒检修和备件，带动配件销售。
- 每天 07:30（雅加达）给 李总 发一条中文日报（WhatsApp + 邮件）：新订单、昨日到账、待确认、逾期、待报价、新登记保修。填 `OWNER_WHATSAPP`（国际格式不带 +，多个用逗号）和 `OWNER_EMAILS` 即开启；本地试跑 `OWNER_WHATSAPP=62812… npx medusa exec ./src/scripts/run-owner-digest.ts`。

## 收货地图打点

App 填地址时可以在地图（OpenStreetMap，免密钥）上把图钉拖到塘口或仓库门口，坐标存在地址 `metadata.lat/lng`。仓库页对应订单会出现「地图定位」链接（Google Maps），直接发给货车司机。

## 错误监控

后端和 App 都接了 Sentry 协议的错误上报，推荐自建开源 [GlitchTip](https://glitchtip.com)（`deploy/docker-compose.glitchtip.yml`）。后端填 `SENTRY_DSN`；App 打包时 `--dart-define=SENTRY_DSN=…`。不填则完全关闭。App 端用纯 Dart 的 `sentry` 包（没有原生依赖，离线 SwiftPM 构建不受影响），能抓到所有 Dart/Flutter 异常。

## 物流轨迹

仓库在订单「Mark as shipped」填单号时写成 `承运商代码:单号`（如 `jne:JP0123456789`、`sicepat:000123456789`、`lion:1234567890`），后端配置 `BITESHIP_API_KEY`（Biteship 免费跟踪接口）后，App 的订单详情「Lacak」会显示承运商的节点历史，10 分钟缓存。没配置时只显示单号和链接。

## 测试包（不用 Mac）

每次推送到 `main`，GitHub Actions 会多跑一个「Android APK (test build)」任务，在该次运行的 Artifacts 里可以下载 `app-release.apk`（调试签名，可直接安装到安卓手机给 李总 的团队试用）。接口地址等参数来自仓库的 Actions Variables：`MEDUSA_URL`、`MEDUSA_PUBLISHABLE_KEY`、`STOREFRONT_URL`、`WHATSAPP_NUMBER`（没设就用默认值）。

## 获客与合同（可选服务）

- **商城博客**（`apps/storefront/src/lib/blog/index.tsx`）：印尼语养殖知识文章（选型、每公顷台数、保养、验真），自动进 sitemap，文末带产品和验真入口。加文章只需在数组里追加一项，不需要 CMS。
- **Typebot**（`deploy/docker-compose.typebot.yml`）：开源对话机器人。建一个「塘口面积 → 水深 → 用电 → 推荐型号 → 留电话」的流程，把 Viewer 的气泡脚本贴进商城 `layout.tsx`，热线索用 Typebot 的 Chatwoot/Webhook 模块推给销售。WhatsApp 号码的 Webhook 只能指向一个系统，建议留给 Chatwoot（人工 + 系统通知），机器人先在网页上跑。
- **DocuSeal**（`deploy/docker-compose.docuseal.yml`）：开源电子签。销售上传销售合同模板，发签署链接给客户（WhatsApp），在 DocuSeal 的 Webhook 里填 `https://api.<域名>/webhooks/docuseal` 和密钥头 `X-Docuseal-Secret`，并在模板/提交里带上 `order_id`；签完后订单 metadata 自动记录 `contract_signed_at` 和签署文件链接。
- **扫码直接进 App（Universal Links / App Links）**：标签二维码是 `https://商城域名/id/garansi/<码>`；装了 App 的手机扫码会直接打开 App 的验真/登记页。需要：商城 `.env` 填 `NEXT_PUBLIC_IOS_TEAM_ID`（Apple 团队 ID）和 `NEXT_PUBLIC_ANDROID_SHA256`（发布签名指纹），商城会在 `/.well-known/apple-app-site-association` 和 `/.well-known/assetlinks.json` 提供关联文件；App 里 `ios/Runner/Runner.entitlements` 和 `AndroidManifest.xml` 的域名目前写的是 `wangjia.co.id`，域名定下来后改成实际域名。
- **App 版本策略**：后台 `.env` 的 `APP_MIN_VERSION` / `APP_LATEST_VERSION` / `APP_ANDROID_URL` / `APP_IOS_URL`。低于最低版本 App 会锁定并引导更新，低于最新版本只显示横幅；不依赖应用商店，侧载 APK 也有效。

## 发布 App（Fastlane）

`apps/mobile/fastlane/` 有 TestFlight / App Store / Play 内测 / Play 正式四条发布通道，见 [apps/mobile/README.md](apps/mobile/README.md)。

## 部署

`deploy/` 里有一台 VPS 跑全套的方案：Postgres、Redis、后端、网页商城、Caddy（自动 HTTPS）、Uptime Kuma（监控告警）、Umami（访问统计）、每日数据库备份；另有 Chatwoot 客服台和 GlitchTip 错误监控的独立 compose。步骤见 [deploy/README.md](deploy/README.md)。

## 上线前要办的事（代码之外）

1. 用印尼公司主体申请 Midtrans / Xendit 商户（公司文件、NPWP、法人身份证、公司银行账户）。
2. Kominfo/Komdigi PSE 电子系统备案。
3. 用公司主体注册 Google Play 开发者账号。
5. 申请 WhatsApp Business Cloud API 与 Resend，填入 `WHATSAPP_*`、`RESEND_API_KEY`；WhatsApp 24 小时会话外的消息需要先在 Meta 后台审核模板。
6. 开通 Cloudflare R2（或 S3）并填入 `S3_*`，开一台 Redis 并填入 `REDIS_URL`。
8. 物流：在 [biteship.com](https://biteship.com) 注册拿 API key 填 `BITESHIP_API_KEY`（跟踪接口免费）；和货运公司确认承运商代码。
9. 标签：拿第一批序列号 CSV 去印二维码标签（建议铝质或 PET 防水标签，贴铭牌旁）；商城域名定下来后再生成正式批次，二维码里带的是 `STOREFRONT_URL`。
10. 上架准备：Apple Developer（公司主体，需 D-U-N-S）和 Google Play 开发者账号；隐私政策公开链接（商城 `/id/privacy`，App 里「账户 → Kebijakan privasi」指向它，用 `--dart-define=PRIVACY_URL`）；App 内已有「Hapus akun」满足两家商店的账号删除要求；准备应用图标、6.7"/6.5"/5.5" 截图、简介（印尼语 + 英语）、支持邮箱；Android 发布需要 `android/key.properties` + keystore（不要提交）；iOS 用 Xcode 自动签名。发布命令见 [apps/mobile/README.md](apps/mobile/README.md)（Fastlane）。
7. 推送：在 Firebase 控制台建项目，加 iOS 应用（Bundle ID `id.co.wangjia.wangjiaApp`）和 Android 应用（包名 `id.co.wangjia.wangjia_app`），把 `GoogleService-Info.plist` 放到 `apps/mobile/ios/Runner/`、`google-services.json` 放到 `apps/mobile/android/app/`（两个文件都已在 .gitignore 外，建议不要提交）；iOS 还要在 Apple 开发者后台生成 APNs 密钥并上传到 Firebase。后端在"项目设置 → 服务账号"生成私钥 JSON，路径或内容填到 `FIREBASE_SERVICE_ACCOUNT`。没配置时推送只写日志。
