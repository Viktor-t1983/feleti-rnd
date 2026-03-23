#!/bin/bash
# Scan repository for potential secrets in history

echo "🔍 Scanning repository for secrets..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Patterns to search for
PATTERNS=(
    # OpenAI API keys
    'sk-[a-zA-Z0-9]{48}'
    # Generic API keys
    'api[_-]?key[[:space:]]*[:=][[:space:]]*[a-zA-Z0-9_-]{16,}'
    # JWT secrets
    'jwt[_-]?secret[[:space:]]*[:=][[:space:]]*[a-zA-Z0-9_-]{20,}'
    # Database URLs with passwords
    'postgresql://[^:]+:[^@]+@'
    'mysql://[^:]+:[^@]+@'
    # Generic passwords
    'password[[:space:]]*[:=][[:space:]]*[^[:space:]]{8,}'
    # Private keys
    '-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----'
    # AWS keys
    'AKIA[0-9A-Z]{16}'
    # GitHub tokens
    'ghp_[a-zA-Z0-9]{36}'
    'gho_[a-zA-Z0-9]{36}'
    # Generic tokens
    'bearer[[:space:]]+[a-zA-Z0-9_\-\.]{20,}'
    # Slack tokens
    'xox[baprs]-[0-9a-zA-Z_-]{10,48}'
)

# Files to exclude from scan
EXCLUDE="*.lock|*.json|node_modules|.git|*.md|*.png|*.jpg|*.gif|*.svg"

echo "${BLUE}Scanning files...${NC}"
FOUND_COUNT=0

# Search in current files
for PATTERN in "${PATTERNS[@]}"; do
    MATCHES=$(grep -riE "$PATTERN" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.env*" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo ""
        echo "${RED}⚠️  Potential secret found:${NC}"
        echo "$MATCHES" | head -10
        FOUND_COUNT=$((FOUND_COUNT + 1))
    fi
done

# Check for committed .env files
echo ""
echo "${BLUE}Checking git history for .env files...${NC}"
ENV_COMMITS=$(git log --all --full-history --source --name-only --pretty=format: | grep -E '^\.env' | sort -u || true)
if [ -n "$ENV_COMMITS" ]; then
    echo "${YELLOW}⚠️  Found .env files in git history:${NC}"
    echo "$ENV_COMMITS"
    echo ""
    echo "${YELLOW}To remove from history (use with caution!):${NC}"
    echo "  git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' HEAD"
    FOUND_COUNT=$((FOUND_COUNT + 1))
fi

# Summary
echo ""
if [ $FOUND_COUNT -eq 0 ]; then
    echo "${GREEN}✅ No secrets found in repository!${NC}"
    exit 0
else
    echo "${YELLOW}⚠️  Found $FOUND_COUNT potential issues${NC}"
    echo "${YELLOW}Review the matches above carefully${NC}"
    exit 1
fi
