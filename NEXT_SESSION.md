# Точка продолжения работы — читать в начале новой сессии

Этот файл — сводка для быстрого восстановления контекста в новой сессии Claude Code. Источник истины по архитектуре/требованиям — `specification.md`, второй обязательный документ — `README.txt`. Этот файл даёт быстрый снимок "что сделано / что дальше" без необходимости перечитывать историю чата.

## Что за проект

MVP веб-конструктора заказов на печать одежды (футболки/худи/свитшоты/лонгсливы), встраиваемого вкладкой в карточку сделки Битрикс24 через платформу **VibeCode** (не классический REST+OAuth2, см. `specification.md` раздел 2). Фронтенд собирает параметры заказа + макет принта, бэкенд создаёт/обновляет сделку и грузит файл на Диск Битрикс24.

## Текущий статус

- ✅ **Дизайн — завершён.** Финальный макет — [`design/maket-6.html`](design/maket-6.html), полностью согласован пользователем. Макеты 1–5 — история/точки отката, не удалять (отличия каждой версии — в шапке-комментарии файла).
- ✅ **Живой API VibeCode проверен** (портал `vibecode02.bitrix24.ru`). Результаты — `specification.md`, раздел 2: лимит файла на Диск — 52 МБ, для placements нужен ключ `vibe_app_...` (создаётся программно через `POST /v1/apps`, ещё не создан).
- 🔶 **Этап 1 (Backend/BFF) — в работе.** Реализовано и покрыто тестами (`npm test --workspace apps/backend` — 17/17 зелёных, `npm run build`/`npm run lint` чисто):
  - `apps/backend/src/vibecode/client.ts` — HTTP-клиент к VibeCode API.
  - `apps/backend/src/middleware/identity.ts` — пробрасывает `X-Vibe-Authorization` в `GET /v1/me`.
  - `apps/backend/src/services/deals.ts` — `createOrUpdateDeal`.
  - `apps/backend/src/services/disk.ts` — `uploadFileToDisk` (лимит 52 МБ).
  - `apps/backend/src/routes/order.ts` — `POST /api/order` (multer, валидация, вызывает три сервиса выше), смонтирован в `app.ts` за `identityMiddleware`.
  Все тесты — на моках `fetch`, живых вызовов к VibeCode API ещё не было: `vibecode.bitrix24.tech` недоступен из окружения агента (DNS резолвится, TCP на 443 таймаутит; у пользователя сайт открывается нормально — проблема сетевого пути именно из среды агента). **Первым делом в новой сессии — проверить, восстановилась ли сеть** (шаг 1 ниже).
- ❌ **Этап 2 (Frontend)** — не начат (`apps/frontend/src/App.tsx` — плейсхолдер с Ant Design/Redux Toolkit).

## Дальше — Этап 1 (specification.md, раздел 8)

Код готов (см. выше). Остались только шаги, требующие живой сети/портала:

1. **Проверить сеть**: `curl -s -o /dev/null -w "%{http_code}" https://vibecode.bitrix24.tech/v1/me`. Если не `000` — выполнять живыми запросами шаги 2–3.
2. **Создать 11 UF-полей** через `POST /v1/userfields/deals {fieldName, userTypeId, label}` (по одному или через `POST /v1/batch`):
   `PRODUCT_TYPE`/string/«Тип изделия», `FABRIC`/string/«Ткань», `CARE`/string/«Уход за материалом», `PRINT_METHOD`/string/«Способ нанесения принта», `COLOR_BODY`/string/«Основной цвет», `COLOR_TRIM`/string/«Цвет отделки», `SIZES_JSON`/string/«Размеры и количество (JSON)», `OPTIONS`/string/«Доп. опции», `PRINT_ZONE`/string/«Зона размещения принта», `COMMENT_TEXT`/string/«Комментарий», `LAYOUT_FILE`/file/«Файл макета» (тип `file` — кандидат для прямой привязки на сделке, эмпирически не проверялся). Записать реальные `UF_CRM_*`-коды из ответов и подставить в `packages/shared-types/src/index.ts` (сейчас там плейсхолдеры) — прогнать `npm test`.
3. **Создать ключ `vibe_app_...`**: `POST /v1/apps {"title":"Конструктор заказов","scopes":["crm","disk","placement"]}` личным ключом `vibe_api_...` (appUrl не указывать — добавить позже через `PATCH /v1/apps/:id`). **Сохранить `rawKey` сразу** — показывается один раз, только для живых запросов, не класть в файлы репозитория кроме `.env`.
4. **Получить реальный `folderId`** Диска (`GET /v1/storages` → `rootFolderId`) и задать `VIBE_LAYOUT_FOLDER_ID` в `.env` — сейчас `POST /api/order` требует эту переменную и вернёт `500 FOLDER_NOT_CONFIGURED` без неё (осознанное упрощение MVP, см. комментарий в `routes/order.ts`).
5. Задеплоить на `vibecode02.bitrix24.ru` (режим `galaxyApp`, раздел 2 спецификации) и эмпирически проверить Puppeteer/headless Chromium (fallback `pdf-lib` наготове).
6. `POST /v1/placements/bind` ключом `vibe_app_`, полный flow встраивания `CRM_DEAL_DETAIL_TAB`.

## Технический стек (зафиксирован, не пересматривать без явного запроса)

- Фронтенд: React 18 + TypeScript + Redux Toolkit + Ant Design + Vite.
- Бэкенд: Node.js + Express + TypeScript, деплой на BlackHole VibeCode в режиме `galaxyApp` (общий хост, ~512 МБ RAM) — портал работает в `resolvedDeployMode: "galaxies-only"`, выделенный VM недоступен.
- Тесты: Vitest + React Testing Library (фронтенд), Vitest + supertest (бэкенд).
- Монорепо: npm workspaces — `apps/frontend`, `apps/backend`, `packages/shared-types`.
- Node.js на машине пользователя — v24.18.0. Прямое скачивание с nodejs.org/winget не работает из песочницы инструментов агента (исходящий HTTPS для произвольных сайтов блокируется), но `npm install` через реестр npm — работает.
- Если при `npm install` вылезет ошибка типов в `vite.config.ts` (`No overload matches this call`) — это конфликт версий vite/vitest, решение — выровнять их мажорные версии (уже решено один раз апгрейдом vitest до `^4.0.0`).

## Секреты — важно

Ключи `vibe_api_...`/`vibe_app_...` — **никогда не класть в файлы репозитория кроме `.env`** (в `.gitignore`), никогда в специфкацию/README/коммиты. Если пользователь присылает ключ в чат — использовать только для живых API-запросов в рамках сессии, не сохранять в память/файлы.

## Согласованный порядок работы (пользователь явно просил соблюдать)

1. Дизайн → полировка → код (дизайн уже пройден полностью).
2. После каждой согласованной итерации — обновлять `specification.md` и `README.txt`.
3. Коммитить с понятным сообщением перед push; пуш — по запросу или когда логично.
4. Не откатывать/не удалять предыдущие версии макетов (`design/maket-*.html`) — точки отката.
5. Каждую крупную функцию — покрывать тестами, прогонять `npm test` после правок.
6. Аудит кибербезопасности — после реализации ~70% функциональности (ещё рано).

## Известные открытые архитектурные решения (не потерять)

- PDF-экспорт бланка заказа (кнопка «Скачать файл заказа в PDF») в макете — client-side демо на jsPDF, ВРЕМЕННО. Реальный экспорт — бэкенд + Puppeteer/HTML-шаблон или fallback `pdf-lib` (см. Этап 1, шаг 5 выше). AVIF→PDF пайплайн сжатия макетов (specification.md, раздел 4.1) — тоже пока клиентская имитация, реальное AVIF-кодирование (`@jsquash/avif` — кандидат) — Этап 2.
- Зона печати "Спина" и вид сзади/спереди в SVG-превью — реализованы только для типа "худи"; для остальных типов — заглушка-подпись "шаблон появится позже" (осознанное ограничение MVP, реальные шаблоны — Этап 2).

## Файловая карта проекта

```
specification.md          — источник истины по требованиям/архитектуре
README.txt                — второй обязательный документ, обновляется синхронно
NEXT_SESSION.md            — этот файл
design/
  maket-1.html … maket-6.html  — история версий макета, maket-6 — ФИНАЛЬНАЯ (не удалять)
  handoff.md                    — developer handoff spec (Ant Design соответствия, токены, edge cases)
package.json, tsconfig.base.json, eslint.config.js, .prettierrc.json  — корень монорепо
.env.example               — шаблон переменных окружения (без секретов)
apps/frontend/              — Vite + React + TS + Redux Toolkit + Ant Design (пока плейсхолдер)
apps/backend/src/
  vibecode/client.ts, middleware/identity.ts, services/deals.ts, services/disk.ts, routes/order.ts — реализованы и протестированы
  (+ *.test.ts рядом с каждым файлом)
packages/shared-types/       — общие TS-типы, UF_CRM_* маппинг (коды-плейсхолдеры до создания реальных UF-полей)
```
