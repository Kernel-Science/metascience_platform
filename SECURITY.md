# Security Policy

## Supported Versions

We are committed to the security of the Metascience Platform. Currently, we support the latest stable version of the platform.

| Version | Supported          |
| ------- | ------------------ |
| v1.x.x  | :white_check_mark: |
| < v1.x  | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability, please report it immediately to the maintainers at **gabreiele.battimelli@kernel-science.com**.

Please include the following information in your report:

- **Type of issue** (e.g., SQL injection, XSS, etc.)
- **Location of the vulnerability** (file, endpoint, etc.)
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Any proof-of-concept code** (if available)

We aim to respond to all security reports within 48-72 hours. We will work with you to understand the issue and provide a timeline for a fix.

## Security Best Practices

When using Metascience Platform:

1. **Never commit API keys** - Always use environment variables.
2. **Keep dependencies updated** - Run security audits regularly (`pnpm audit`, `pip list --outdated`).
3. **Use HTTPS in production** - Deploy behind a reverse proxy with SSL/TLS.
4. **Enable authentication** - Don't expose endpoints publicly without auth.
5. **Validate inputs** - Never trust user input on the frontend or backend.
6. **Use Supabase RLS** - Enable Row Level Security on all database tables.

## Known Security Considerations

- **In-Memory Storage**: Current backend implementation doesn't persist data. For production, migrate to Supabase.
- **External API Keys**: Protect your Anthropic and Google API keys - they have usage costs.
- **Rate Limiting**: Consider implementing rate limiting to prevent abuse of external APIs (Semantic Scholar, OpenAlex).

## Disclosure Policy

We follow responsible disclosure practices:
1. We will acknowledge receipt of your report.
2. We will investigate the issue and communicate our findings.
3. We will fix the issue privately before public disclosure.
4. We will announce the fix and provide credit to the researcher (if desired).

---

Thank you for helping us keep the Metascience Platform secure!
