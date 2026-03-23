# 🔒 Security Guidelines

## API Keys and Secrets Management

### ⚠️ CRITICAL: Never Commit Secrets

**Never commit the following to Git:**
- `.env` files (all variants: `.env`, `.env.local`, `.env.production`, etc.)
- API keys (OpenAI, DeepSeek, Claude, etc.)
- JWT secrets and passwords
- Database connection strings with passwords
- Private keys and certificates

### ✅ Proper Secret Management

#### 1. Environment Variables

All secrets must be stored in environment variables:

```bash
# Local development - create .env file (DO NOT COMMIT)
cp .env.example .env
# Edit .env with your real values
```

#### 2. Production Deployment

Use Docker secrets or environment injection:

```bash
# Docker Compose
export DEEPSEEK_API_KEY="your-secret-key"
docker compose up -d
```

#### 3. Database-Stored Settings

API keys for AI providers can be configured via Admin UI:
- Navigate to: `/admin/settings`
- Keys are encrypted with AES-256
- Only Admin role can access

### 🛡️ Security Features

#### Pre-commit Hook

Automatically checks for secrets before each commit:

```bash
# Install hook
chmod +x .husky/pre-commit

# Bypass (use with caution!)
git commit --no-verify
```

#### Secret Scanning

```bash
# Scan repository for secrets
./scripts/scan-secrets.sh

# Setup security tools
./scripts/setup-security.sh
```

### 🚨 If You Accidentally Committed Secrets

#### Step 1: Rotate the Secret Immediately

Change the compromised key at the provider:
- OpenAI: https://platform.openai.com/api-keys
- DeepSeek: https://platform.deepseek.com
- Claude: https://console.anthropic.com

#### Step 2: Remove from Git History

```bash
# Remove file from history
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' HEAD

# Or use BFG Repo-Cleaner for large repos
# https://rtyley.github.io/bfg-repo-cleaner/
```

#### Step 3: Force Push (DANGEROUS - coordinate with team)

```bash
git push origin --force --all
```

### 📋 Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` uses placeholder values only
- [ ] No hardcoded secrets in source code
- [ ] API keys rotated regularly
- [ ] Pre-commit hooks installed
- [ ] Repository scanned for secrets

### 🔐 File Structure

```
project/
├── .env                  # ❌ NEVER COMMIT - local secrets
├── .env.example          # ✅ Template with placeholders
├── .env.production       # ❌ NEVER COMMIT - production secrets
├── .env.production.example # ✅ Template with placeholders
├── .gitignore            # ✅ Must include .env*
├── .husky/
│   └── pre-commit        # ✅ Secret detection hook
└── scripts/
    ├── scan-secrets.sh   # ✅ Manual scanner
    └── setup-security.sh # ✅ Security setup
```

### 📞 Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Contact maintainers privately
3. Provide detailed reproduction steps
4. Allow time for patch before disclosure

---

**Last Updated:** 2026-03-23
