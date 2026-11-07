# 印尼水车 B2B 电商平台

基于 [Medusa B2B Starter](https://github.com/medusajs/b2b-starter) 改造，面向印尼客户销售水车（洒水车）等高单价工业设备。

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
  src/migration-scripts/initial-data-seed.ts  印尼地区、PPN 11%、雅加达仓、货运方式、示例水车产品
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
| GET | `/admin/warehouse/orders` | 仓库待发货 |

## 上线前要办的事（代码之外）

1. 用印尼公司主体申请 Midtrans / Xendit 商户（公司文件、NPWP、法人身份证、公司银行账户）。
2. Kominfo/Komdigi PSE 电子系统备案。
3. 用公司主体注册 Google Play 开发者账号。
5. 申请 WhatsApp Business Cloud API 与 Resend，填入 `WHATSAPP_*`、`RESEND_API_KEY`；WhatsApp 24 小时会话外的消息需要先在 Meta 后台审核模板。
6. 开通 Cloudflare R2（或 S3）并填入 `S3_*`，开一台 Redis 并填入 `REDIS_URL`。
