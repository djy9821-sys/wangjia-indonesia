# 部署（一台 VPS）

1. 买一台 Ubuntu 22.04/24.04 的 VPS（雅加达或新加坡，4 vCPU / 8 GB 起步），装 Docker：`curl -fsSL https://get.docker.com | sh`。
2. 把 `wangjia.co.id`、`api.`、`status.`、`analytics.` 四个域名的 A 记录指到这台机器。
3. 克隆仓库，`cp deploy/.env.example deploy/.env` 填域名和数据库密码；`cp apps/backend/.env.template apps/backend/.env.production`，填 JWT/COOKIE 密钥、CORS（填 https 域名）、Midtrans、WhatsApp、Resend、S3、Firebase。
4. 首次启动：`docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build`。后端启动时自动跑迁移和种子数据。
5. 建管理员：`docker compose -f deploy/docker-compose.yml exec backend sh -c "cd .medusa/server && npx medusa user -e boss@example.com -p '强密码'"`，登录 `https://api.<域名>/app`，在 Settings → Publishable API keys 拿到 key 填进 `deploy/.env` 的 `PUBLISHABLE_KEY`，再 `up -d --build storefront`。
6. 打开 `https://status.<域名>` 配 Uptime Kuma（监控 `https://api.<域名>/health` 和首页，告警发到 WhatsApp/Telegram）；`https://analytics.<域名>` 配 Umami，把它给的脚本加到商城 `layout.tsx`。
7. 备份：`backup` 容器每天 dump 一次到 `backups` 卷，保留 14 天。用 rclone 把 `/var/lib/docker/volumes/wangjia_backups` 同步到 R2 或网盘。
8. 更新：`git pull && docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build`。

Midtrans 后台的通知地址填 `https://api.<域名>/webhooks/midtrans`；App 的 `--dart-define=MEDUSA_URL=https://api.<域名>`。

Chatwoot（客服工作台）体量较大，建议单独一台小机器或用其云版本，不放在这个 compose 里。
