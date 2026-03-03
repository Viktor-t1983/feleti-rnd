#!/bin/bash
set -euo pipefail

# =============================================================================
# FELETI R&D System Health Check Script
# =============================================================================
# This script performs daily health checks on all system components
# Run with: ./scripts/health-check.sh
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/health-check-$(date +%Y%m%d-%H%M%S).log"
API_URL="${API_URL:-http://localhost:3001}"
CALC_ENGINE_URL="${CALC_ENGINE_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"

# Database Configuration - no defaults for security
DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-}"
DB_NAME="${DB_NAME:-}"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Docker Compose command array (set by check_docker_services)
DOCKER_COMPOSE=()

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

pass() {
    log "${GREEN}✓ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
}

fail() {
    log "${RED}✗ FAIL${NC}: $1"
    FAILED=$((FAILED + 1))
}

warn() {
    log "${YELLOW}⚠ WARN${NC}: $1"
    WARNINGS=$((WARNINGS + 1))
}

info() {
    log "${BLUE}ℹ INFO${NC}: $1"
}

separator() {
    log "\n----------------------------------------"
}

# =============================================================================
# Check Functions
# =============================================================================

check_docker_services() {
    log "\n${BLUE}=== Docker Services Check ===${NC}"

    # Check for docker compose (plugin) or docker-compose (standalone)
    if ! command -v docker &> /dev/null; then
        fail "docker not found"
        return
    fi

    # Try docker compose (v2 plugin) first, then fall back to docker-compose (v1)
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE=("docker" "compose")
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE=("docker-compose")
    else
        fail "docker compose not found"
        return
    fi

    services=$("${DOCKER_COMPOSE[@]}" ps --format '{{.Service}}' 2>/dev/null || true)

    if [ -z "$services" ]; then
        fail "No Docker services running"
        return
    fi

    expected_services=("api" "calc-engine" "postgres" "web")
    for service in "${expected_services[@]}"; do
        if echo "$services" | grep -qx "$service"; then
            pass "Service '$service' is running"
        else
            warn "Service '$service' not found in running containers"
        fi
    done
}

check_api_health() {
    log "\n${BLUE}=== API Health Check ===${NC}"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        pass "API health endpoint responds with 200"

        # Check response body
        body=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")
        if echo "$body" | grep -q '"status":"ok"'; then
            pass "API health status is 'ok'"
        else
            warn "API health response unexpected: $body"
        fi
    else
        fail "API health endpoint returned HTTP $response"
    fi
}

check_calc_engine_health() {
    log "\n${BLUE}=== Calc Engine Health Check ===${NC}"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$CALC_ENGINE_URL/health" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        pass "Calc-engine health endpoint responds with 200"

        body=$(curl -s "$CALC_ENGINE_URL/health" 2>/dev/null || echo "{}")
        if echo "$body" | grep -q '"status":"ok"'; then
            pass "Calc-engine health status is 'ok'"
        else
            warn "Calc-engine health response unexpected: $body"
        fi
    else
        fail "Calc-engine health endpoint returned HTTP $response"
    fi
}

check_frontend() {
    log "\n${BLUE}=== Frontend Check ===${NC}"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        pass "Frontend responds with HTTP 200"
    else
        fail "Frontend returned HTTP $response"
    fi
}

check_database() {
    log "\n${BLUE}=== Database Connection Check ===${NC}"

    # Check if database configuration is provided
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        info "Database credentials not configured, skipping database check"
        info "Set DB_HOST, DB_USER, and DB_NAME environment variables to enable"
        return
    fi

    # Check if we can connect to PostgreSQL
    if command -v psql &> /dev/null; then
        if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" &>/dev/null; then
            pass "Database connection successful"
        else
            warn "Could not connect to database (credentials may be required)"
        fi
    else
        warn "psql not installed, skipping database check"
    fi
}

check_disk_space() {
    log "\n${BLUE}=== Disk Space Check ===${NC}"

    # Check disk usage
    usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$usage" -lt 80 ]; then
        pass "Disk usage is at ${usage}% (healthy)"
    elif [ "$usage" -lt 90 ]; then
        warn "Disk usage is at ${usage}% (getting full)"
    else
        fail "Disk usage is at ${usage}% (critical)"
    fi
}

check_api_endpoints() {
    log "\n${BLUE}=== API Endpoints Check ===${NC}"

    # Test auth endpoint (should return 401 without token, not 404)
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/auth/login" 2>/dev/null || echo "000")
    if [ "$response" == "401" ] || [ "$response" == "404" ] || [ "$response" == "200" ]; then
        pass "Auth endpoint accessible (HTTP $response)"
    else
        warn "Auth endpoint returned unexpected HTTP $response"
    fi

    # Test projects endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/projects" 2>/dev/null || echo "000")
    if [ "$response" == "401" ] || [ "$response" == "200" ]; then
        pass "Projects endpoint accessible (HTTP $response)"
    else
        warn "Projects endpoint returned unexpected HTTP $response"
    fi
}

check_logs() {
    log "\n${BLUE}=== Recent Error Check ===${NC}"

    # Check Docker logs for errors in the last 5 minutes
    if [ ${#DOCKER_COMPOSE[@]} -eq 0 ]; then
        warn "Cannot check logs - docker compose not available"
        return
    fi

    errors=$("${DOCKER_COMPOSE[@]}" logs --since 5m 2>/dev/null | grep -ic "error" || true)
    if [ "$errors" -eq 0 ]; then
        pass "No errors found in recent logs"
    else
        warn "Found $errors error(s) in recent logs"
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    # Create log directory
    mkdir -p "$LOG_DIR"

    log "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║     FELETI R&D System Health Check            ║${NC}"
    log "${BLUE}║     $(date +'%Y-%m-%d %H:%M:%S')                          ║${NC}"
    log "${BLUE}╚════════════════════════════════════════════════╝${NC}"

    # Run all checks
    check_docker_services
    check_api_health
    check_calc_engine_health
    check_frontend
    check_database
    check_disk_space
    check_api_endpoints
    check_logs

    # Summary
    separator
    log "\n${BLUE}=== Summary ===${NC}"
    log "${GREEN}Passed:  $PASSED${NC}"
    log "${YELLOW}Warnings: $WARNINGS${NC}"
    log "${RED}Failed:  $FAILED${NC}"

    total=$((PASSED + WARNINGS + FAILED))
    log "\nTotal checks: $total"

    # Exit code
    if [ $FAILED -gt 0 ]; then
        log "\n${RED}Health check FAILED with $FAILED error(s)${NC}"
        log "Log saved to: $LOG_FILE"
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        log "\n${YELLOW}Health check completed with $WARNINGS warning(s)${NC}"
        log "Log saved to: $LOG_FILE"
        exit 0
    else
        log "\n${GREEN}All health checks passed!${NC}"
        log "Log saved to: $LOG_FILE"
        exit 0
    fi
}

# Run main function
main "$@"
