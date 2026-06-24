# OngoCare Website Chat Widget

Embeddable floating chat widget for customer websites. Uses visitor JWT auth and polls the communications-service chat APIs.

## Embed

```html
<script>
  window.OngoChat = window.OngoChat || { q: [] };
  window.OngoChat.init = function (config) {
    window.OngoChat.q.push(config);
  };
</script>
<script src="https://communications.ongocare.com/widget/ongocare-chat.js" async></script>
<script>
  window.OngoChat.init({ siteKey: "weightloss-main" });
</script>
```

Optional config:

```js
window.OngoChat.init({
  siteKey: "weightloss-main",
  apiBase: "https://communications.ongocare.com",
  pollIntervalMs: 3000,
});
```

## Build

```bash
cd apps/chat-widget
npm install
npm run build
```

Output: `backend/communications-service/public/widget/ongocare-chat.js`

## APIs

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/chat/widget/bootstrap` | Origin allowlist |
| POST | `/api/chat/sessions` | Visitor JWT |
| GET | `/api/chat/sessions/:id/messages` | Visitor JWT |
| POST | `/api/chat/sessions/:id/messages` | Visitor JWT |

`GET .../messages` is required for polling agent replies in v1.
