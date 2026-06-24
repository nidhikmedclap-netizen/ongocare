# CONTRIBUTING

## Workflow

1. Create/update an issue describing the change.
2. Branch from `development` using:
   - `feature/<scope>`
   - `bugfix/<scope>`
   - `hotfix/<scope>`
3. Implement and test your change.
4. Open a pull request to the correct target branch.
5. Address review feedback and merge after approval.

## Pull Request Requirements

- Clear title and description
- Linked issue/ticket
- Test evidence (logs, screenshots, or CI output)
- Risk notes for data, auth, payments, and notifications
- Rollback notes for production-impacting changes

## Commit Convention

Use concise, intent-focused messages. Recommended prefixes:

- `feat:` new functionality
- `fix:` bug fix
- `refactor:` internal restructuring without behavior change
- `docs:` documentation-only change
- `chore:` maintenance/config/build updates
- `test:` tests added or updated

Examples:

- `feat: add appointment booking endpoint`
- `fix: prevent duplicate prescription submission`

## Testing Expectations

- Run applicable unit/integration tests before PR
- Validate lint/format checks
- For UI changes, include visual verification notes
- For backend changes, validate auth, data validation, and error handling

## Security Requirements

Do not commit:

- `.env` files
- Credentials or secrets
- Private keys/certificates

Use `.env.example` for required environment variable documentation.
