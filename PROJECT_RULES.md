# PROJECT_RULES

## Platform Goal

Build and operate a scalable healthcare platform for:

- iOS app
- Android app (future)
- Web app (patient + doctor portal)
- Admin panel
- Backend APIs and services
- Automation and scheduler services
- Shared documentation and deployment workflows

Core domains include patients, doctors, appointments, prescriptions, payments, notifications, medical records, and internal admin operations.

## Team Ownership

- iOS Team: SwiftUI app, TestFlight, push notifications, iOS release pipeline
- Web Team: web portal, doctor dashboard, patient dashboard, responsive browser UX
- Admin Team: internal operations, support tooling, CRM workflows, reporting
- Backend Team: API, database, auth, payments, Twilio, Firebase, security
- DevOps Team: VPS deployment, CI/CD, backups, monitoring, uptime

## Branch and Release Policy

- Protected branches:
  - `main` -> production
  - `staging` -> testing
  - `development` -> active development
- No direct commits to `main`
- All changes go through pull requests and code review
- Use branch names:
  - `feature/<name>`
  - `bugfix/<name>`
  - `hotfix/<name>`

## Security and Secrets Policy

Never commit:

- `.env` files
- API keys
- Firebase private keys
- Apple certificates
- Twilio secrets
- SSH keys
- Production credentials

Only commit `.env.example` with placeholder values.

## Delivery Principles

- GitHub is the control center
- No manual production server changes
- Every change must be version-controlled, documented, reviewable, deployable, and recoverable

## Priority Build Order

Phase 1:
1. Backend API
2. Admin Panel
3. iOS App MVP

Phase 2:
4. Web Portal
5. Automation Systems
6. Notification System

Phase 3:
7. Android App
8. Advanced Reporting
9. AI Assistant Features
