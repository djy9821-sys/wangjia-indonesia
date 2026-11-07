# 部署（一台 VPS）

1. 买一台 Ubuntu 22.04/24.04 的 VPS（雅加达或新加坡，4 vCPU / 8 GB 起步），装 Docker：`curl -fsSL https://get.docker.com | sh`。
2. 把 `wangjia.co.id`、`api.`、`status.`、`analytics.` 四个域名的 A 记录指到这台机器。
3. 克隆仓库，`cp deploy/.env.example deploy/.env` 填域名和数据库密码；`cp apps/backend/.env.template apps/backend/.env.production`，填 JWT/COOKIE 密钥、CORS（填 https 域名）、Midtrans、WhatsApp、Resend、S3、Firebase。
4. 首次启动：`docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build`。后端启动时自动跑迁移和种子数据。
5. 建管理员：`docker compose -f deploy/docker-compose.yml exec backend sh -c "cd .medusa/server && npx medusa user -e boss@example.com -p '强密码'"`，登录 `https://api.<域名>/app`，在 Settings → Publishable API keys 拿到 key 填进 `deploy/.env` 的 `PUBLISHABLE_KEY`，再 `up -d --build storefront`。
6. 打开 `https://status.<域名>` 配 Uptime Kuma（监控 `https://api.<域名>/health/deep`（检查数据库和缓存，异常返回 503）和首页，告警发到 WhatsApp/Telegram）；`https://analytics.<域名>` 配 Umami，把它给的脚本加到商城 `layout.tsx`。
7. 备份：`backup` 容器每天 dump 一次到 `backups` 卷，保留 14 天。异地副本：先 `docker run --rm -it -v wangjia_rclone:/config/rclone rclone/rclone config` 配好 R2/S3/网盘远端，在 `deploy/.env` 填 `RCLONE_REMOTE=r2:wangjia-backups`，然后 `docker compose -f deploy/docker-compose.yml --env-file deploy/.env --profile offsite up -d`，每天自动同步。
   **恢复演练**（上线前至少做一次，之后每季度一次）：`docker compose -f deploy/docker-compose.yml --env-file deploy/.env stop backend`，然后 `docker compose -f deploy/docker-compose.yml --env-file deploy/.env run --rm backup sh /restore.sh <DB_USER> <DB_NAME> /backups/<文件>.dump`，再 `up -d backend`。脚本会重建数据库并打印恢复后的订单数。
8. 更新：`git pull && docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build`。

Midtrans 后台的通知地址填 `https://api.<域名>/webhooks/midtrans`；App 的 `--dart-define=MEDUSA_URL=https://api.<域名>`。

## Chatwoot 客服台（单独一台小机器）

`docker-compose.chatwoot.yml` 把 Chatwoot（含 Postgres、Redis、Caddy）装在另一台 2 vCPU / 4 GB 的机器上，域名如 `chat.wangjia.co.id`：

1. `cp deploy/.env.chatwoot.example deploy/.env.chatwoot`，填域名、数据库密码、`SECRET_KEY_BASE`（`openssl rand -hex 64`）和发信 SMTP。
2. `docker compose -f deploy/docker-compose.chatwoot.yml --env-file deploy/.env.chatwoot run --rm rails bundle exec rails db:chatwoot_prepare`（只在第一次）。
3. `docker compose -f deploy/docker-compose.chatwoot.yml --env-file deploy/.env.chatwoot up -d`，打开域名创建管理员账号。
4. 在 Chatwoot 里新建 WhatsApp 收件箱（WhatsApp Cloud），用和后端 `WHATSAPP_PHONE_NUMBER_ID` 同一个号码，这样客户看到的是同一个 WANGJIA 号码：系统通知由后端发，人工回复在 Chatwoot 里做。Meta 后台的 Webhook 指向 Chatwoot 给出的地址。
5. 网页商城想加在线聊天气泡，把 Chatwoot 收件箱里的网站 Widget 脚本贴进 `apps/storefront/src/app/[countryCode]/(main)/layout.tsx`。

## GlitchTip 错误监控（可与 Chatwoot 同一台机器）

`docker-compose.glitchtip.yml` 是开源的 Sentry 兼容错误平台，域名如 `errors.wangjia.co.id`：

1. `cp deploy/.env.glitchtip.example deploy/.env.glitchtip`，填域名、数据库密码、`SECRET_KEY`（`openssl rand -hex 32`）和告警邮箱 SMTP。
2. `docker compose -f deploy/docker-compose.glitchtip.yml --env-file deploy/.env.glitchtip up -d`，打开域名注册第一个账号（之后注册已关闭）。
3. 建三个项目：backend、storefront、app，把各自的 DSN 填到后端 `.env.production` 的 `SENTRY_DSN`、App 打包的 `--dart-define=SENTRY_DSN=…`。后端只上报 5xx 和未处理异常，4xx 业务错误不报。

## Typebot 对话机器人 / DocuSeal 电子签（可选，可与 Chatwoot 同机）

- Typebot：`cp deploy/.env.typebot.example deploy/.env.typebot`，填两个域名（builder 给员工、viewer 给客户）、数据库密码、`ENCRYPTION_SECRET`、SMTP；`docker compose -f deploy/docker-compose.typebot.yml --env-file deploy/.env.typebot up -d`。用 `ADMIN_EMAIL` 的邮箱魔法链接登录 builder，做好流程后把「Share → Bubble」脚本贴到商城布局。
- DocuSeal：`cp deploy/.env.docuseal.example deploy/.env.docuseal`，填域名、密码、`SECRET_KEY_BASE`、`DOCUSEAL_WEBHOOK_SECRET`；`docker compose -f deploy/docker-compose.docuseal.yml --env-file deploy/.env.docuseal up -d`。后端 `.env.production` 填同一个 `DOCUSEAL_WEBHOOK_SECRET`。
