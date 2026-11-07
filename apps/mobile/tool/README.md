# Dev helpers

`push-payload.apns` — simulate a push on the iOS Simulator (no Firebase needed):

```bash
xcrun simctl push booted id.co.wangjia.wangjiaApp tool/push-payload.apns
```

Tapping the banner opens the order from `order_id`.
