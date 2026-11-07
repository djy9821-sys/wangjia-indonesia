# WhatsApp 模板（提交给 Meta 审核）

WhatsApp Business Cloud API 规定：企业主动发给客户的消息（客户 24 小时内没给我们发过消息时）必须使用已审核的模板。后端所有系统通知（付款确认、发货、保修、提醒、日报）都是一段文本，所以只需要**一个**通用模板，把文本作为 `{{1}}` 参数发出。

在 Meta Business Suite → WhatsApp Manager → Message templates 新建：

| 项 | 值 |
|---|---|
| 名称 | `wangjia_notice`（与 `.env` 的 `WHATSAPP_TEMPLATE_NAME` 一致） |
| 类别 | Utility（事务通知） |
| 语言 | Indonesian (`id`)（`WHATSAPP_TEMPLATE_LANG`） |
| 正文 | `Informasi dari WANGJIA Kincir Air:\n\n{{1}}\n\nBalas pesan ini jika ada pertanyaan.` |
| 示例参数 | `Pembayaran Uang muka 30% sebesar Rp 4.162.500 untuk pesanan #12 sudah dikonfirmasi. Pesanan Anda sekarang disiapkan untuk pengiriman.` |
| 页脚（可选） | `PT Adhinusa Lestari Jaya` |

注意事项：

- 参数里不能有换行；后端会自动把换行改成 ` | `，并截断到 1024 字符。
- 审核通常 1–24 小时。审核通过前先不要填 `WHATSAPP_TEMPLATE_NAME`，否则发送会报 `template name does not exist`。
- 客户回复后的 24 小时内，Meta 允许自由文本；但统一走模板更稳，也不影响人工在 Chatwoot 里回复。
- 如果 Meta 以“参数过于开放”为由拒绝，可以拆成几个更具体的模板（付款确认、发货、保修），代码里在 `data.template` 传入即可覆盖通用模板。
- 老板日报（中文）也走同一个模板；若希望中文版，再建一个 `wangjia_notice` 的 `zh_CN` 语言版本，并把 `OWNER_*` 的发送改为该语言（目前统一用 `id`，中文内容照样能发）。
