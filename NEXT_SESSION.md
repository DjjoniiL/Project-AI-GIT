# Точка продолжения работы — читать в начале новой сессии

Этот файл — сводка для быстрого восстановления контекста в новой сессии Claude Code. Источник истины по архитектуре/требованиям — `specification.md`, второй обязательный документ — `README.txt`. Этот файл даёт быстрый снимок "что сделано / что дальше" без необходимости перечитывать историю чата.

## Что за проект

MVP веб-конструктора заказов на печать одежды (футболки/худи/свитшоты/лонгсливы), встраиваемого вкладкой в карточку сделки Битрикс24 через платформу **VibeCode** (не классический REST+OAuth2, см. `specification.md` раздел 2). Фронтенд собирает параметры заказа + макет принта, бэкенд создаёт/обновляет сделку и грузит файл на Диск Битрикс24.

## Текущий статус

- ✅ **Дизайн — завершён.** Финальный макет — [`design/maket-6.html`](design/maket-6.html), полностью согласован пользователем. Макеты 1–5 — история/точки отката, не удалять (отличия каждой версии — в шапке-комментарии файла).
- ✅ **Живой API VibeCode проверен и полностью используется** (портал `vibecode02.bitrix24.ru`). Результаты разведки — `specification.md`, раздел 2.
- ✅ **Сетевая проблема с доступом к `vibecode.bitrix24.tech` — решена и понята.** Причина была НЕ в коде/ключах: у пользователя на машине активен Outline VPN, и его точка выхода (сервер) периодически не пропускала трафик до этого хоста (TCP иногда проходил, иногда нет; один раз дошло до TLS ClientHello и зависло — похоже на нестабильность/фильтрацию именно на этом VPN-сервере, не блокировку по домену в принципе, т.к. с другого сервера VPN всё сразу заработало). **Решение: переключить точку выхода Outline VPN на другую страну (сработало — Италия).** Если снова не будет коннекта — первым делом попробовать переключить/переподключить VPN, а не тратить время на диагностику кода. Диагностика: `curl` и `Test-NetConnection`/PowerShell могут вести себя по-разному (Bash-песочница агента вообще не видит VPN-интерфейс `outline-tap0`, поэтому для реальной проверки сети из этого проекта надёжнее гонять `curl.exe` именно через PowerShell-инструмент, не через Bash).
- ✅ **UF-поля созданы на портале** (11 штук, `POST /v1/userfields/deals`) — коды подтверждены живым `GET /v1/userfields/deals`, **полностью совпадают** с тем, что уже было в `packages/shared-types/src/index.ts` (специально подобраны имена полей под существующие плейсхолдеры: `PRODUCT_TYPE`, `FABRIC`, `CARE`, `PRINT_METHOD`, `BODY_COLOR`, `TRIM_COLOR`, `SIZES_JSON`, `OPTIONS`, `PRINT_ZONE`, `COMMENT`, `DESIGN_FILE_ID` — последнее с `userTypeId: "file"`). Правка `shared-types` не понадобилась — **важное открытие**: Bitrix24 создаёт код поля как `UF_CRM_` + ровно тот `fieldName`, что передан в запросе (не случайный ID) — предсказуемо для будущих полей.
- ✅ **Ключ `vibe_app_...` создан** (`POST /v1/apps`, scopes `crm`+`disk`+`placement`, app id `e7709e0a-6788-471e-b733-37ff9526d885`) и сохранён в локальный `.env` (не в git). `VIBE_APP_KEY` в `.env` — актуальный.
- ✅ **Папка на Диске под макеты создана** — id `91` ("Макеты конструктора" в "Общем диске", storageId 3), записана в `.env` как `VIBE_LAYOUT_FOLDER_ID=91`.
- ✅ **Важный фикс архитектуры бэкенда**: `packages/shared-types` раньше не собирался (`main`/`types` указывали прямо на `src/index.ts`) — локально это незаметно работало на Node 24 (нативная поддержка TS), но **сломало бы деплой**, так как VibeCode даёт только `node20` рантайм (без нативного TS). Добавлена сборка (`tsc`, `main`/`types` → `dist/`), порядок в корневом `npm run build` исправлен (shared-types собирается первым). Проверено: `node apps/backend/dist/index.js` реально стартует на чистой сборке.
- ✅ **Бэкенд задеплоен и работает на живой инфраструктуре VibeCode.** Сервер `galaxyApp`, id `801496ff-f700-4dd0-9bec-571adbc7efcb`, appUrl `https://app-2a2f90ace69d.vibecode.bitrix24.tech`, статус `running`/`CONNECTED`. `GET /api/health` подтверждён живым запросом (`{"status":"ok"}`, через временный access-token — `accessPolicy` оставлен `OWNER_ONLY`, не менять без явного запроса пользователя, это осознанное решение безопасности). Архив для деплоя — root `package.json`+`package-lock.json`+`tsconfig.base.json` + `packages/shared-types` + `apps/backend` (без `apps/frontend` — не нужен для бэкенда, workspaces-glob `apps/*` спокойно резолвится и без него). `install`: `npm install && npm run build --workspace packages/shared-types && npm run build --workspace apps/backend`. `start`: `node apps/backend/dist/index.js`.
- ✅ **Puppeteer/headless Chromium эмпирически подтверждён РАБОЧИМ** на этой инфраструктуре — САМЫЙ ГЛАВНЫЙ снятый риск проекта. `npm install puppeteer` ставится без проблем (Debian 12, root, ~40с). Первый запуск падал (`libglib-2.0.so.0` и другие системные библиотеки отсутствуют в минимальном образе) — исправлено через `apt-get install -y libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2` (мы root, apt доступен). После этого headless-Chromium стартовал, отрендерил HTML в PDF (`--no-sandbox --disable-dev-shm-usage --disable-gpu --single-process`, `--max-old-space-size=256` на Node) за ~5.6с, уложившись в подтверждённый лимит контейнера **512 МБ RAM** (`cat /sys/fs/cgroup/memory.max` → `536870912` байт, 2 CPU). **Вывод: fallback на `pdf-lib` больше не нужен — реальный экспорт PDF через Puppeteer возможен**, но список apt-пакетов выше нужно добавить в `install`-команду будущего боевого деплоя (сейчас они стоят только на этом тестовом сервере, при передеплое слетят, если не добавить в install).
- ✅ **`placements/bind` выполнен — Этап 1 ПОЛНОСТЬЮ ЗАВЕРШЁН.** OAuth-флоу пройден пользователем в браузере (ссылка `/v1/oauth/authorize?app_key=...&state=...&redirect_uri=https://vibecode.bitrix24.tech/oauth/complete`), после чего сессия была получена агентом через **`GET /v1/oauth/poll?state=<state>&app_key=<urlencoded rawKey>`** (заголовок `X-Api-Key: vibe_app_...`) — вернул `{"success":true,"status":"complete","access_token":"vibe_session_...","user":{...},"expires_in":86399}`. Дальше `POST /v1/placements/bind` с этим `access_token` как `Authorization: Bearer` прошёл успешно. Подтверждено: `GET /v1/apps/e7709e0a-6788-471e-b733-37ff9526d885` → `"placements":["CRM_DEAL_DETAIL_TAB"]`. **Это была единственная часть, требовавшая участия пользователя (переход по ссылке и вход в портал) — сам bind-запрос и получение токена сделал агент.**
- ✅ **Этап 1 (Backend/BFF) — 100% ЗАВЕРШЁН**, живьём на реальном портале `vibecode02.bitrix24.ru`: код (`apps/backend/src/{vibecode/client.ts, middleware/identity.ts, services/deals.ts, services/disk.ts, routes/order.ts}`, 17/17 тестов зелёных) + вся инфраструктура выше (UF-поля, ключ, папка на Диске, деплой, Puppeteer, placement) — всё сделано и проверено.
- 🔶 **Этап 2 (Frontend) — основной конструктор реализован и проверен в браузере (dev-режим), НЕ задеплоен.** UI из `design/maket-6.html` перенесён в реальные React-компоненты (Ant Design + Redux Toolkit), полностью проверен через `preview_*` инструменты (не только `npm test`) — переключение зон/вида, цвета, опции, размеры, таблица размеров, отправка формы (реальный 401 от бэкенда корректно отобразился пользователю). 10/10 фронтенд-тестов зелёные. Что реализовано:
  - `features/order/orderSlice.ts` — состояние формы + бизнес-правила (ткань↔уход синхронизация, доступные опции по типу изделия, зона→вид).
  - `features/order/{labels,previewZones,placementContext,submitOrder}.ts` — справочники, парсинг `placement_options`, отправка на `POST /api/order`.
  - `components/*Card.tsx` — все карточки выбора (ткань/уход, цвета, опции, размеры+модалка, тип+способ, зона печати, комментарий), на Ant Design (Radio.Group/Segmented/ColorPicker/Upload.Dragger/Modal — как рекомендовано `design/handoff.md`, не самописный JS).
  - `components/PreviewPanel.tsx` — полный SVG (только худи, как и в макете), включая живой рендер загруженного `.png`/`.jpg`/`.pdf` в зоне печати (`hooks/useFilePreviewUrl.ts`, `pdf.js`).
  - `components/LayoutUploadCard.tsx` — Drag&Drop, лимит 52 МБ с понятным сообщением при превышении.
  - **Осознанно НЕ реализовано в этом проходе**: адаптивное AVIF-сжатие объёмных растровых макетов (specification.md раздел 4.1) — большая отдельная WASM-задача (`@jsquash/avif`), оставлена на следующий заход; сейчас оверсайз-файл любого формата просто отклоняется с сообщением, без кнопки «Сжать файл».
  - **PDF-экспорт бланка заказа** (кнопка в макете) — тоже не перенесён в этом проходе (в макете был client-side jsPDF демо, реальный бэкенд-экспорт через Puppeteer уже проверен и готов — раздел выше, но сама кнопка/вызов на фронтенде ещё не подключены).
  - Известная проблема совместимости (не критично, не мной внесена): antd v5 официально поддерживает React 16–18, проект на React 19 — консоль показывает предупреждение `[antd: compatible]`, всё работает корректно несмотря на предупреждение, стек зафиксирован — не пересматривать без запроса.
  - `.claude/launch.json` создан для `mcp__Claude_Preview` (конфиги `backend`/`frontend`, порты 3001/5173) — можно сразу стартовать оба сервера через `preview_start`.
  - **Не задеплоено**: фронтенд пока живёт только в dev (`npm run dev:frontend`), на реальном сервере (`app-2a2f90ace69d...`) по-прежнему отдаётся только API бэкенда. Вкладка `CRM_DEAL_DETAIL_TAB` в портале уже привязана, но реального конструктора там пока не видно.

## Дальше — довести Этап 2 до конца

1. **Реальное AVIF-сжатие** объёмных растровых макетов (specification.md раздел 4.1) — WASM-кодирование (`@jsquash/avif` — кандидат), адаптивный подбор качества под потолок 48 МБ, конвертация в PDF (потолок 52 МБ). Сейчас вместо этого — простой отказ с сообщением.
2. **Кнопка экспорта бланка заказа в PDF** на фронтенде (сводная спецификация параметров) — подключить к реальному бэкенд-эндпоинту с Puppeteer (нужно сначала реализовать сам эндпоинт — в `apps/backend` пока нет роута для этого, только `/api/order`).
3. **Задеплоить фронтенд** и связать с уже задеплоенным бэкендом (либо собрать `apps/frontend` статикой и отдавать её тем же Express-сервером через `express.static`, либо отдельный `static`-рантайм VibeCode) — тогда вкладка `CRM_DEAL_DETAIL_TAB` реально покажет конструктор в карточке сделки.
4. Тест полного цикла внутри настоящего Битрикс24 iframe (сейчас проверено только в dev-браузере вне iframe).

## Технический стек (зафиксирован, не пересматривать без явного запроса)

- Фронтенд: React 19 + TypeScript + Redux Toolkit + Ant Design 5 + Vite (antd официально поддерживает React 16–18, но с 19 всё работает, только предупреждение в консоли — см. статус Этапа 2).
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

- PDF-экспорт бланка заказа и AVIF-сжатие макетов — см. "Дальше — довести Этап 2" выше, оба пункта на бэкенде технически подтверждены рабочими (Puppeteer), на фронтенде ещё не подключены/не реализованы.
- Зона печати "Спина" и вид сзади/спереди в SVG-превью — реализованы только для типа "худи" (и в макете, и теперь в React-компоненте `PreviewPanel`); для остальных типов — заглушка-подпись "шаблон появится позже" (осознанное ограничение MVP, реальные шаблоны — следующая итерация Этапа 2).

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
.claude/launch.json         — конфиги preview_start для mcp__Claude_Preview (backend:3001, frontend:5173)
apps/frontend/src/
  features/order/           — orderSlice, labels, previewZones, placementContext, submitOrder (+ *.test.ts)
  components/                — карточки конструктора + PreviewPanel (реализованы, задеплоено ещё не)
  hooks/useFilePreviewUrl.ts — живой предпросмотр png/jpg/pdf в зоне печати
apps/backend/src/
  vibecode/client.ts, middleware/identity.ts, services/deals.ts, services/disk.ts, routes/order.ts — реализованы и протестированы
  (+ *.test.ts рядом с каждым файлом)
packages/shared-types/       — общие TS-типы, UF_CRM_* маппинг (коды подтверждены на живом портале), собирается через tsc в dist/
.env                          — реальные секреты (VIBE_APP_KEY, VIBE_LAYOUT_FOLDER_ID), НЕ в git
```

## Живой тестовый сервер (galaxyApp)

- id `801496ff-f700-4dd0-9bec-571adbc7efcb`, appUrl `https://app-2a2f90ace69d.vibecode.bitrix24.tech`, accessPolicy `OWNER_ONLY`.
- Для проверки живьём без браузера — минтить временный токен: `POST /v1/infra/servers/801496ff-f700-4dd0-9bec-571adbc7efcb/access-tokens {"mode":"api-bearer"}` (личным `vibe_api_` ключом), потом `Authorization: Bearer <token>` на запросах к appUrl.
- Логи: `GET /v1/infra/servers/801496ff-f700-4dd0-9bec-571adbc7efcb/logs?lines=100`.
- Для передеплоя после новых правок в коде — заново собрать архив (root package.json+package-lock.json+tsconfig.base.json + packages/shared-types + apps/backend, без apps/frontend) и `POST /v1/infra/servers/801496ff-f700-4dd0-9bec-571adbc7efcb/deploy` (не создавать новый сервер через `POST /v1/infra/servers` — это создаст второй, отдельный).
