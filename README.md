# OngoCare Monorepo

OngoCare is a multi-developer healthcare platform repository designed to support iOS, Android (future), web, admin, backend services, and shared infrastructure in one place.

## Repository Structure

```text
ongocare/
├── apps/
│   ├── ios-app/
│   ├── android-app/
│   ├── web-app/
│   ├── admin-panel/
│   └── landing-site/
├── backend/
│   ├── api/
│   ├── auth-service/
│   ├── notification-service/
│   ├── scheduler-service/
│   └── integrations/
├── database/
│   ├── migrations/
│   ├── schema/
│   ├── seeders/
│   └── backups/
├── shared/
│   ├── ui-components/
│   ├── shared-types/
│   ├── utils/
│   └── constants/
├── docs/
│   ├── api-docs/
│   ├── deployment/
│   ├── architecture/
│   ├── onboarding/
│   └── SOPs/
├── devops/
│   ├── docker/
│   ├── nginx/
│   ├── github-actions/
│   ├── codemagic/
│   └── monitoring/
├── scripts/
│   ├── deployment/
│   ├── backup/
│   └── maintenance/
├── .env.example
├── README.md
├── PROJECT_RULES.md
├── CONTRIBUTING.md
└── codemagic.yaml
```

## Branch Strategy

- `main`: production (protected)
- `staging`: testing (protected)
- `development`: active development (protected)
- feature work on `feature/*`, `bugfix/*`, and `hotfix/*` branches only

## Security Rules

Never commit secrets:

- `.env` files
- API keys and credentials
- Firebase private keys
- Apple certificates/profiles
- Twilio secrets
- SSH private keys

Use `.env.example` for documented environment variables.

## Governance

See:

- `PROJECT_RULES.md` for ownership and delivery policy
- `CONTRIBUTING.md` for PR workflow and contribution standards
