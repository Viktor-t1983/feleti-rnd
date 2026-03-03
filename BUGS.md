# FELETI R&D - Known Issues & Test Results

## Last Updated: 2026-03-02

---

## 🚨 Critical Issues

### 1. Database Connection in Tests

**Status:** 🔴 **BLOCKING**  
**Affected:** Integration tests, Seed verification tests  
**Error:**

```
PrismaClientInitializationError: Authentication failed against database server,
the provided database credentials for `(not available)` are not valid.
```

**Solution:**

- Set `DATABASE_URL` environment variable in `.env` file
- Ensure PostgreSQL container is running: `docker-compose up -d postgres`
- Run migrations: `cd apps/api && npx prisma migrate deploy`

---

## ⚠️ High Priority Issues

### 2. Auth Service Unit Tests - Prisma Mock Issues

**Status:** 🟡 **FAILED** - 4 tests  
**File:** `apps/api/src/modules/auth/tests/auth.service.test.ts`  
**Issues:**

- `prisma.user.findFirst is not a function` - Mock not set up correctly
- Password comparison spy not receiving expected arguments
- ConflictError not being thrown properly

**Solution:**

- Update Prisma mock to include `findFirst` method
- Fix password comparison test assertions
- Ensure proper error class instantiation

### 3. Projects Service Test - Data Structure Mismatch

**Status:** 🟡 **FAILED** - 1 test  
**File:** `apps/api/src/modules/projects/tests/projects.service.test.ts`  
**Error:**

```
Expected: "data": ObjectContaining {...}
Received: "data": { additional fields present }
```

**Solution:**

- Update test expectations to include new fields:
  - `description`, `priority`, `spent`, `status`
  - `startDate`, `endDate`, `targetDate`
  - `email` in owner select

### 4. Password Reset Tests - Mock Issues

**Status:** 🟡 **FAILED** - 4 tests  
**File:** `apps/api/src/modules/auth/__tests__/password-reset.test.ts`  
**Issues:**

- Test timeout (5000ms exceeded)
- `sendPasswordResetEmail` is not a spy
- bcrypt `hash` export not defined on mock

**Solution:**

- Increase test timeout
- Properly mock email service
- Fix bcrypt mock to include `hash` method

---

## 📝 Medium Priority Issues

### 5. Web Frontend Tests - Missing Providers

**Status:** 🟡 **FAILED** - 14 tests  
**Files:**

- `apps/web/src/components/auth/tests/LoginForm.test.tsx` (3 tests)
- `apps/web/src/components/layout/tests/Header.test.tsx` (11 tests)

**Issues:**

- **LoginForm:** `BrowserRouter` export not defined on mock
- **Header:** `No QueryClient set, use QueryClientProvider to set one`

**Solution:**

- Update react-router-dom mock in LoginForm tests
- Wrap Header tests with `QueryClientProvider`

---

## ✅ Working Components

### API Tests (Unit Tests)

- **Test Files:** 12 passed / 20 total
- **Tests:** 167 passed / 192 total
- **Pass Rate:** ~87%

### Web Tests

- **Test Files:** 6 passed / 8 total
- **Tests:** 29 passed / 43 total
- **Pass Rate:** ~67%

### Docker Services

- ✅ API (port 3001) - Healthy
- ✅ Calc Engine (port 8000) - Healthy
- ✅ PostgreSQL (port 5432) - Healthy
- ✅ Frontend (port 80) - Running

---

## 📊 Test Summary

| Component         | Tests Passed | Tests Failed | Pass Rate |
| ----------------- | ------------ | ------------ | --------- |
| API Unit Tests    | 167          | 25           | 87%       |
| Web Tests         | 29           | 14           | 67%       |
| Integration Tests | 0            | 17           | 0%\*      |

\*Integration tests require database connection

---

## 🔧 Created Artifacts

### 1. E2E System Health Tests

**File:** `apps/api/src/__tests__/e2e/system-health.test.ts`  
**Coverage:**

- Health check endpoint
- Authentication endpoints
- Projects API
- Engineering Platform
- Rules Engine
- RBAC Admin endpoints
- Calc Engine health

### 2. Calc Engine Python Tests

**File:** `apps/calc-engine/tests/test_calculators.py`  
**Coverage:**

- NPV Calculator
- IRR Calculator
- ROI Calculator
- Payback Calculator
- Engineering calculations (thermal balance, shaft stress, ventilation)

### 3. Health Check Script

**File:** `scripts/health-check.sh`  
**Features:**

- Docker services check
- API health check
- Calc Engine health check
- Frontend check
- Database connection check
- Disk space check
- API endpoints check
- Error log check
- Colored output with summary

---

## 🚀 Next Steps

1. **Fix Database Connection**
   - Configure DATABASE_URL in test environment
   - Set up test database or use SQLite for tests

2. **Fix Mock Issues**
   - Update Prisma mocks in auth tests
   - Fix react-router-dom mock in LoginForm tests
   - Add QueryClientProvider to Header tests

3. **Update Test Expectations**
   - Sync project creation test with actual data structure

4. **Run Full Test Suite**

   ```bash
   # API tests
   cd apps/api && npm test

   # Web tests
   cd apps/web && npm test

   # Calc Engine tests
   cd apps/calc-engine && python -m pytest tests/

   # E2E tests
   cd apps/api && npm test -- src/__tests__/e2e/
   ```

5. **Schedule Health Checks**
   ```bash
   # Add to crontab for daily checks
   0 9 * * * /path/to/scripts/health-check.sh
   ```

---

## 📞 Contact

For questions about these issues, contact the development team.
