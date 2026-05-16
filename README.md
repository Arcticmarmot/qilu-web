# 歧路 Web

歧路第一版前端产品外壳。项目基于 Next.js、React 和 Tailwind CSS，当前实现 MVP 所需的认证、登录态恢复、内容流首页和个人中心。

## 运行

```bash
yarn install
yarn dev
```

默认访问地址：

```text
http://localhost:3000
```

## API Base URL

前端通过 `NEXT_PUBLIC_API_BASE_URL` 访问后端，开发环境默认走本机 nginx 代理。

```bash
cp .env.example .env.local
```

如需覆盖默认代理地址，修改 `.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost/api
```

## 已实现页面

- `/login`：邮箱和密码登录，成功后保存 JWT token 到 localStorage 并跳转首页。
- `/register`：昵称、邮箱和密码注册，成功后跳转登录页。
- `/`：登录后的内容流首页，加载时通过 `/users/me` 恢复登录态，失败时清除 token 并跳转登录页。
- `/profile`：个人中心，通过 `/users/me` 展示当前用户信息。

## 请求层

- `src/lib/http.ts` 封装统一 `fetch` 请求入口。
- 通过 `NEXT_PUBLIC_API_BASE_URL` 配置 `baseURL`，默认 `http://localhost/api`。
- 注册、登录之外的请求默认注入 `Authorization: Bearer <token>`。
- 响应统一处理 `{ code, message, data }`，并在 401 时清除本地 token。

## 目录

```text
src/app              App Router 页面
src/components/product-shell.tsx  登录后产品主界面组件
src/components/auth 认证页结构组件
src/components/ui   基础 UI 组件
src/lib/http.ts     fetch 请求封装和错误处理
src/lib/api.ts      业务 API 方法
src/lib/auth.ts     token 读写与清除
src/lib/use-current-user.ts 登录态恢复 hook
src/lib/cx.ts       className 拼接工具
```

## 验证

```bash
yarn lint
yarn build
```
