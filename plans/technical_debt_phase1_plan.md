# ПЛАН: Фаза 1 - Критические исправления (Technical Debt)

## Анализ текущего состояния

### Проблема 1: Formula Evaluator RCE

- **Файл:** `formula-evaluator.ts`
- **Уязвимость:** Использует `new Function()` без sandboxing
- **Риск:** Remote Code Execution (RCE)

### Проблема 2: Backup Strategy

- **Статус:** Скрипты отсутствуют
- **Риск:** Потеря данных

### Проблема 3: Analytics userId filter

- **Анализ:** Большинство методов уже правильно используют `userId` фильтр
- **Находка:** `compareProjects` в routes НЕ использует `userId`!
- **Риск:** Утечка данных при сравнении проектов

---

## План выполнения

### ПРОБЛЕМА 1: Formula Evaluator RCE

| #   | Задача                       | Файл/Действие                                     |
| --- | ---------------------------- | ------------------------------------------------- |
| 1.1 | Установить vm2               | `npm install --workspace=apps/api vm2 @types/vm2` |
| 1.2 | Создать SafeFormulaEvaluator | `safe-formula-evaluator.ts`                       |
| 1.3 | Обновить CalculationsService | Заменить импорт на safeFormulaEvaluator           |
| 1.4 | Создать тесты                | `safe-formula-evaluator.test.ts`                  |
| 1.5 | Запустить тесты              | `npm run test:engineering`                        |
| 1.6 | Deprecated старый evaluator  | Добавить @deprecated в formula-evaluator.ts       |

### ПРОБЛЕМА 2: Backup Strategy

| #   | Задача                  | Файл/Действие                  |
| --- | ----------------------- | ------------------------------ |
| 2.1 | Создать backup скрипт   | `scripts/backup-db.sh`         |
| 2.2 | Создать restore скрипт  | `scripts/restore-db.sh`        |
| 2.3 | Обновить docker-compose | Добавить volume `/backups`     |
| 2.4 | Cron job setup          | `scripts/setup-backup-cron.sh` |
| 2.5 | npm scripts             | Обновить package.json          |
| 2.6 | Тест backup             | `npm run backup:db`            |

### ПРОБЛЕМА 3: Analytics userId filter

| #   | Задача                    | Детали                                            |
| --- | ------------------------- | ------------------------------------------------- |
| 3.1 | Анализ методов            | Проверено - большинство уже используют userId     |
| 3.2 | Исправить compareProjects | `analytics.routes.ts:134` - НЕ использует userId! |
| 3.3 | Тесты изоляции            | `data-isolation.test.ts`                          |
| 3.4 | Запустить тесты           | `npm run test -- data-isolation`                  |

---

## Критерии успеха

- SafeFormulaEvaluator работает
- Все security тесты проходят (зеленые)
- RCE уязвимость устранена
- Backup скрипт создает файлы
- Restore скрипт работает
- Analytics userId filter применен
- Data isolation тесты проходят
- Нет утечки данных между пользователями
- Все существующие тесты проходят
- Health check показывает HEALTHY

---

## Ожидаемое время выполнения

Многодневная задача с тестированием. Рекомендуется разбить на подзадачи.

---

## Следующие шаги

После утверждения плана - переход в Code mode для реализации.
