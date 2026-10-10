# Formulista CRM

Локальная заготовка админки для соседнего проекта `hair-analyzer-backend`.
React + TypeScript + Refine + Ant Design, сборка через Vite.

## Запуск

Нужна Node.js 22.12+ (ветка 22) или 24+. В репозитории есть `.nvmrc`:

```bash
nvm install
nvm use
npm ci
npm run dev
```

Открой http://localhost:5173. Для входа нужен запущенный `hair-analyzer-backend` с настроенными `CRM_ADMIN_LOGIN`, `CRM_ADMIN_PASSWORD_HASH`, `CRM_ORIGIN=http://localhost:5173` и созданной таблицей `crm_sessions` (`npm run init:db`). Порт CRM фиксированный: если он занят, Vite сообщит об этом.

По умолчанию CRM обращается к `http://localhost:3000`. Другой адрес backend можно задать в `.env.local` через `VITE_CRM_API_URL` (образец в `.env.example`). После изменения переменной перезапусти Vite. Для production без этой переменной запросы идут на тот же origin по пути `/api/crm`; если backend расположен отдельно, укажи его HTTPS-origin в `VITE_CRM_API_URL` и настрой `CRM_ORIGIN` на backend.


## Страницы

- `/login` — стандартная страница входа Refine (`AuthPage`) с полями Login и Password. Форма отправляет данные в `POST /api/crm/auth/login`.
- `/dashboard` — защищенная страница в стандартном `ThemedLayout` Refine. Содержимое собрано из обычных `Card`, `Statistic`, `Row` и `Empty` Ant Design; выход находится в боковом меню.
- `/users` — таблица пользователей из `GET /api/crm/users` с серверной пагинацией (10–100 строк на страницу) и поиском по username или Telegram ID. Показывает Telegram ID и username, статус анкеты и подписки, срок оплаты и доступные разборы обоих видов.
- `/users/:id` — стандартная страница просмотра Refine с данными пользователя, анкетой, доступом и платежами из `GET /api/crm/users/:id`. Открывается по клику на строку списка.

Сессия проверяется запросом `GET /api/crm/auth/me`, выход вызывает `POST /api/crm/auth/logout`. Все запросы используют `credentials: "include"`; токен хранится только в `HttpOnly` cookie, которую выдаёт backend. При посещении дашборда без сессии открывается вход; после входа открывается дашборд.

## Команды

```bash
npm run typecheck  # строгая проверка TypeScript
npm run lint       # ESLint
npm run build      # проверка типов и production-сборка в dist/
npm run preview    # просмотр сборки на http://localhost:4173
```

## Структура

```text
src/
  App.tsx                     # стандартные компоненты Refine и маршруты
  main.tsx                    # точка входа и совместимость Ant Design с React 19
  pages/dashboard.tsx         # дашборд-заглушка
  pages/users.tsx             # список пользователей
  providers/auth-provider.ts  # запросы авторизации к backend
  providers/data-provider.ts  # получение пользователей с пагинацией
  components/login-form.tsx   # поля Login и Password внутри AuthPage
```

## Данные дашборда

Вход, выход и список пользователей подключены к backend. Для карточек дашборда API пока не подключён: они намеренно не содержат выдуманных чисел.

Клиентские настройки можно хранить в `.env.local`; `.gitignore` исключает env-файлы, зависимости, сборку и кеши, но сохраняет `package-lock.json` и `.env.example`.
Переменные Vite с префиксом `VITE_` доступны в браузере, поэтому в них нельзя хранить серверные ключи и пароли.

Ant Design закреплен на версии 5, совместимой с `@refinedev/antd` 6; для React 19 подключен официальный `@ant-design/v5-patch-for-react-19`.
Используются стандартная тема, шрифт и цвета Ant Design. Базовый размер шрифта увеличен с 14 до 16 px через токен `fontSize` в `ConfigProvider`.
Все тексты интерфейса на английском; стандартная форма Refine использует свою локализацию по умолчанию.
Телеметрия Refine отключена.

В `overrides` обновлен транзитивный `path-to-regexp` у `@ant-design/pro-layout` до исправленной версии 8.4+; upstream пока закрепляет уязвимую 8.2.0. После обновления upstream этот override можно удалить.

Документация: [Refine + Ant Design](https://refine.dev/core/docs/ui-integrations/ant-design/introduction/), [Ant Design 5 + React 19](https://5x-ant-design.antgroup.com/docs/react/v5-for-19).
