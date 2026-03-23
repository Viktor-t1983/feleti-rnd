#!/bin/bash
# Setup security tools for the project

echo "🔒 Setting up security protections..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Make pre-commit hook executable
if [ -f ".husky/pre-commit" ]; then
    chmod +x .husky/pre-commit
    echo "${GREEN}✅ Pre-commit hook installed${NC}"
else
    echo "${YELLOW}⚠️  Pre-commit hook not found${NC}"
fi

# Check for .env file
if [ -f ".env" ]; then
    echo "${YELLOW}⚠️  .env file exists - make sure it's not committed!${NC}"
    echo "   It should be in .gitignore: $(grep -c '^\.env$' .gitignore) occurrence(s)"
fi

# Verify .env.example doesn't have secrets
echo ""
echo "🔍 Scanning .env.example for potential secrets..."
if grep -iE '(sk-[a-z0-9]{20,}|api[_-]?key.*=[^C].{10,}|password.*=[^C].{8,})' .env.example 2>/dev/null; then
    echo "${YELLOW}⚠️  Found potential secrets in .env.example - should use placeholders${NC}"
else
    echo "${GREEN}✅ .env.example looks clean${NC}"
fi

echo ""
echo "${GREEN}✅ Security setup complete!${NC}"
echo ""
echo "Quick security guide:"
echo "  1. Never commit .env or .env.* files"
echo "  2. Use .env.example as template with placeholder values"
echo "  3. Pre-commit hook will check for secrets automatically"
echo "  4. To bypass hook: git commit --no-verify (use with caution!)"
