# Per-organization assets

Drop tenant-specific images here. Each organization owns a subfolder named
after its slug, e.g.:

```
public/organizations/medclap1/logo.png
public/organizations/medclap1/og.png
public/organizations/medclap2/logo.png
...
```

Reference these from `data/organizations.js`:

```js
import { organizations } from "@/data/organizations";

organizations.medclap1.branding.logoSrc = "/organizations/medclap1/logo.png";
organizations.medclap1.seo.ogImage     = "/organizations/medclap1/og.png";
```

Until real assets land here, the registry points to the existing site logo
so each tenant page still renders.
