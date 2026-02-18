# FELETI R&D Code Style Guide

## TypeScript Rules

### ❌ ЗАПРЕЩЕНО

```typescript
// NO any
function process(data: any) { }

// NO console.log
console.log('debug');

// NO забытый await
async function getData() {
  fetch('/api'); // ❌ должен быть await
}

// NO index как key
{items.map((item, index) => <div key={index} />)}
```

### ✅ ПРАВИЛЬНО

```typescript
// ALWAYS указывай типы
function process(data: ProcessInput): ProcessOutput { }

// ALWAYS используй logger
logger.debug('debug message');

// ALWAYS await promises
async function getData() {
  await fetch('/api');
}

// ALWAYS уникальный key
{items.map((item) => <div key={item.id} />)}

// ALWAYS используй singleton Prisma
import { prisma } from '@/lib/prisma';
```

## Именование

- **Files**: kebab-case (user-service.ts)
- **Components**: PascalCase (UserCard.tsx)
- **Functions**: camelCase (getUserById)
- **Constants**: UPPER_CASE (MAX_RETRIES)
- **Interfaces**: PascalCase (UserData)
- **Types**: PascalCase (UserId)

## Структура файлов

```typescript
// 1. Импорты (внешние)
import { FastifyInstance } from 'fastify';

// 2. Импорты (внутренние)
import { prisma } from '@/lib/prisma';
import { UserService } from '@/modules/user/user.service';

// 3. Типы
interface CreateUserInput {
  email: string;
  password: string;
}

// 4. Константы
const MAX_RETRIES = 3;

// 5. Функции/Классы
export class UserController { }
```

## React Components

```tsx
// ✅ ПРАВИЛЬНО
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps): JSX.Element {
  const handleClick = (): void => {
    onEdit?.(user.id);
  };

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      {onEdit && <button onClick={handleClick}>Edit</button>}
    </div>
  );
}
```

## ESLint Правила

### Критические правила (ошибки)

- `@typescript-eslint/no-explicit-any`: ❌ ЗАПРЕТ any типов
- `@typescript-eslint/no-unused-vars`: ❌ ЗАПРЕТ неиспользуемых переменных
- `@typescript-eslint/explicit-function-return-type`: ✅ ОБЯЗАТЕЛЬНО указывать return type
- `@typescript-eslint/no-floating-promises`: ❌ ЗАПРЕТ забытых await
- `no-console`: ❌ ЗАПРЕТ console.log (разрешены warn и error)

### Архитектурные правила

- `import/order`: ✅ Порядок импортов (builtin → external → internal → parent → sibling → index)
- `newlines-between`: ✅ Пустая строка между группами импортов
- `alphabetize`: ✅ Алфавитный порядок внутри групп

### Безопасность

- `no-eval`: ❌ ЗАПРЕТ eval
- `@typescript-eslint/no-unsafe-assignment`: ❌ ЗАПРЕТ небезопасных присваиваний
- `@typescript-eslint/no-unsafe-call`: ❌ ЗАПРЕТ небезопасных вызовов

### Соглашения об именовании (ESLint)

- `@typescript-eslint/naming-convention`: ✅ Правильное именование (PascalCase, camelCase, UPPER_CASE)

## React Правила

- `react/jsx-no-leaked-render`: ❌ {count && &lt;div&gt;} должно быть {count > 0 && &lt;div&gt;}
- `react/jsx-key`: ✅ key в списках обязателен
- `react/no-array-index-key`: ⚠️ не использовать index как key
- `react-hooks/rules-of-hooks`: ✅ Правила использования хуков
- `react-hooks/exhaustive-deps`: ⚠️ Проверка зависимостей хуков

## Доступность (a11y)

- `jsx-a11y/alt-text`: ✅ alt текст для изображений обязателен
- `jsx-a11y/anchor-is-valid`: ✅ Валидные ссылки
- `jsx-a11y/click-events-have-key-events`: ✅ Кликабельные элементы должны иметь keyboard события

## Prettier Конфигурация

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## TypeScript Strict Mode

Все проекты используют строгий режим TypeScript:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true
}
```

## Pre-commit Hooks

Перед каждым коммитом автоматически запускается:

1. ESLint с автофиксом
2. Prettier форматирование

## Команды для проверки качества кода

```bash
# Lint всего проекта
npm run lint --workspaces

# Format всего проекта
npm run format --workspaces

# Type check
npm run build --workspaces

# Auto-fix ESLint
npm run lint --workspace=apps/api -- --fix
npm run lint --workspace=apps/web -- --fix
```

## VS Code Настройки

- `editor.formatOnSave`: true
- `editor.defaultFormatter`: esbenp.prettier-vscode
- `editor.codeActionsOnSave.source.fixAll.eslint`: true
- `editor.codeActionsOnSave.source.organizeImports`: true
