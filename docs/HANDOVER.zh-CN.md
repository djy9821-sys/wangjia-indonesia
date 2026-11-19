# 交接文档（给接手的 AI）

更新：2026-11-19。写给接手这个项目的 AI 或开发者：先读这一篇，再按第 2 节的顺序读其他文档。

## 1. 项目是什么

- 李总在印尼卖 WANGJIA® 增氧水车（印尼语 kincir air，英文 paddle-wheel aerator），1 HP、2 HP 两种整机，加上配件（叶轮、齿轮箱、电机、浮筒、轴等）。顾客是印尼的虾塘、鱼塘养殖户，多数用手机。
- 三个端，一个 pnpm + Turborepo 仓库：
  - `apps/backend`：Medusa v2 后端（2.22.3），自带后台管理（`/app`）。在 B2B 模板上加了公司、员工、报价、审批、分期付款计划、保修扫码、拼单（Patungan）等。
  - `apps/storefront`：Next.js 15 网页店（印尼语为主）。
  - `apps/mobile`：Flutter App（安卓 / iOS），印尼语和英语。
- 仓库：GitHub `djy9821-sys/wangjia-indonesia`（公开），只用 `main` 分支，每次推送 CI 跑四项检查。
- 还没上线：没有服务器、没有域名，一切都跑在米杰的 Mac 上。

## 2. 先读这些（按顺序）

1. `AGENTS.md`：仓库规矩（只用 pnpm、不改 `node_modules`、改数据模型要生成迁移、不改已有迁移、`.env` 不提交、业务改动走 workflow、后端从 `@medusajs/framework/*` 引用、用 `MedusaError`）。
2. `README.zh-CN.md`：功能清单、本地运行、「测试包（不用 Mac）」一节。
3. `docs/ROADMAP.zh-CN.md`：上线前清单（1.x）和以后的计划。
4. `docs/WORKLOG.zh-CN.md`：从 11-07 起每天做了什么、怎么验证、哪些没做到。
5. `docs/DESIGN-TEARDOWN.zh-CN.md`：优秀独立站的设计拆解和对 WANGJIA 的建议，做设计前必读。
6. `apps/mobile/README.md`：App 的构建参数和测试方法。
7. `deploy/README.md`：上服务器的步骤（docker compose：Postgres、Redis、后端、网页店、Caddy）。

## 3. 在这台 Mac 上运行

- 没有 Homebrew、Docker、Android SDK。Node 在 `~/.local/bin`，Flutter 在 `~/development/flutter/bin`，pnpm 9.15。访问本机服务用 `curl --noproxy '*'`。
- 启动三样东西（每次 AI 会话结束它们都会停，下次先检查 5432、9000、8000 端口，停了就重启）：
  - 数据库：`cd infra && node pg.js`（嵌入式 Postgres，127.0.0.1:5432）
  - 后端：`pnpm --filter @b2b-starter/backend dev`（:9000，日志写到 `.backend-dev.log`）
  - 网页店：`pnpm --filter @b2b-starter/storefront dev`（:8000，打开 `http://localhost:8000/id`）
- 测试：
  - App：`cd apps/mobile && flutter analyze && flutter test`（101 个）
  - 后端单元：`cd apps/backend && pnpm test:unit`（23 个）
  - 后端 HTTP 集成（40 个用例）：要设 `DB_HOST=localhost`（写 127.0.0.1 会强制 SSL），`DB_USERNAME`、`DB_PASSWORD` 从 `apps/backend/.env` 的 `DATABASE_URL` 里取，然后 `pnpm test:integration:http`
  - 网页店：`cd apps/storefront && npx tsc --noEmit -p tsconfig.json && pnpm lint`（lint 现在有 25 个旧警告，没有错误）
- GitHub 连接不稳：`git push`、`gh` 经常要重试几次，推完用 `git ls-remote` 确认。
- Mac 经常换网络（见过 192.168.1.253、192.168.3.207、192.168.125.x）。安卓测试包把后端地址写死在包里，换网络就连不上，只能按当天地址重新打包（CI 手动触发，见 README「测试包」）。根治办法是上服务器。

## 4. 现在的状态（2026-11-19）

- `main` 上 CI 四项全绿。
- 网页店首页：「深海夜景」风格。米杰在三个小样里选的 A（另外两个是杂志大字、工程图解）。代码在 `apps/storefront/src/modules/home/components/`（`hero`、`benefit-marquee`、`why-wangjia`、`how-to-order`、`cta-band`），动画在 `apps/storefront/tailwind.config.js`（`pond-*`、`night-glow`、`marquee`），产品抠图在 `apps/storefront/public/products/kincir-*-cutout.webp`（用 macOS Vision 从实拍照片抠出来）。商品列表页、商品详情页、导航栏还是原来的样式。
- 网页店商品列表的价格：11-18 修好（搜索索引原来只存欧元、美元，改成只存印尼盾）。
- 注册：后端开关 `SIGNUP_CLOSED`（`apps/backend/.env`），现在是开着（`false`）。设成 `true` 时 App 不显示注册、后端拒绝新注册。
- App：游客能直接看商品；登录 60 天、自动续期；购物车一次请求；列表图片按显示尺寸解码；大字号下首页不截字。最后一个测试包是 `a8a4abb`（连 192.168.1.253），现在电脑不在那个网络，它连不上。
- 没有服务器。米杰 11-18 说先不买。

## 5. 米杰的要求（最重要）

- 对设计不满意：觉得模板感“很普通没创意”，在 X 上看到很多免费的网站设计，想要那种效果。“深海夜景”是他三选一选的，但做出来他仍然觉得没达到要求。建议：先请他发几张 X 上喜欢的设计截图或链接，照着参考做小样给他确认，再改代码；不要凭感觉猜他的口味。
- 要实用，不要臃肿：先量再改，改顾客能感觉到的地方；想法放进路线图。
- 不要反复问他；但设计方向、花钱、上线这类事要他拍板。
- 回复用中文，先说结论，短一点。
- 每轮更新 `docs/WORKLOG.zh-CN.md`，路线图保持最新。
- 网页版要“谁都能看到”，这需要公网服务器。

## 6. 不能碰、不能说的

- 不提交 `.env`、`.env.local`、`.env.production`、Firebase 配置、服务账号密钥；不打印任何环境变量的值。新变量写进 `apps/backend/.env.template`。
- 公司真实信息（NPWP、收款账户 `COMPANY_BANK`）只放 `.env`。
- 示例顾客账号的邮箱和密码在 `apps/mobile/README.md` 第 84 行（Maestro 命令里），需要时指给人看，不要贴到聊天或日志里。
- 开发数据库里有一个真实用户的账号：不要导出、不要打印顾客的邮箱或姓名。
- 后端日志 `.backend-dev.log` 里有 `dry-run` 的邮件行（带重置密码的令牌），不要打印这些行。
- 配置里的销售 WhatsApp 号码可能是真人号码，不要外传。
- `apps/backend/src/search` 下的文件后端启动时全部会被加载，不要放测试文件。改搜索索引定义后，本机要跑 `pnpm medusa db:migrate:search`，再重启后端（线上容器启动时会自动跑 `db:migrate`）。

## 7. 还没做的（大致按重要性）

1. 上线（路线图 1.4）：一台云服务器（建议新加坡或雅加达机房，2 核 4G，Ubuntu）加一个域名，按 `deploy/README.md` 部署。上线后 App 连固定地址，测试包的问题就没了，网页版谁都能打开。这一步要米杰或李总购买。
2. 网页店设计：先读 `docs/DESIGN-TEARDOWN.zh-CN.md`（拆解了 Teenage Engineering、Nothing、大疆产品页和 X 上流行的设计来源，结论是先要画面素材，再按故事线排版）。拿到米杰的参考再做；商品列表页、商品详情页、导航栏还没跟首页统一。
3. 路线图 1.10：每件商品描述末尾有一句中文摘要，顾客看得到，上线前要移到后台备注。
4. 路线图 1.11、1.12、1.14、1.16、1.17：网页注册和 App 对齐；结算页的运费与合计、订单页的地址和取消；改密码后让其他设备下线；大字号排版；地址栏自动更正。
5. 路线图 1.13、1.15：几条规则要李总定（自动建付款计划的金额、运费怎么收、登录时长、分期提醒频率等）。
6. 真机测试（路线图 1.6）：下单、付款、上传凭证、扫码保修、推送从没在真手机上走完。
7. 外部账号：Midtrans、WhatsApp Cloud API、Firebase、Resend、对象存储、Redis、Apple / Google 开发者账号（路线图 1.1 到 1.9）。
8. 想法：首页加一个“按塘面积算要几台增氧机”的计算器，每台能带多大面积、多少公斤虾，要李总给准确数字。

## 8. 常用位置

- 网页店首页：`apps/storefront/src/app/[countryCode]/(main)/page.tsx`
- 网页店搜索和列表价格：`apps/storefront/src/lib/search-client.ts`，后端 `apps/backend/src/search/`
- 后端中间件：`apps/backend/src/api/middlewares.ts`；注册开关：`apps/backend/src/api/middlewares/signup-closed.ts`；App 启动时读的开关：`apps/backend/src/api/store/app-version/route.ts`
- 初始商品数据：`apps/backend/src/migration-scripts/initial-data-seed.ts`
- App：入口 `apps/mobile/lib/main.dart`，构建参数 `apps/mobile/lib/config.dart`，登录页 `apps/mobile/lib/screens/login_screen.dart`
- CI 和手动打安卓测试包：`.github/workflows/ci.yml`
