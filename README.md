# 歧路 Web

歧路第一版前端产品外壳。项目基于 Next.js、React 和 Tailwind CSS，当前只实现 MVP 所需的认证、登录态恢复和首页应用壳。

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

前端通过 `NEXT_PUBLIC_API_BASE_URL` 读取后端地址，不在组件中硬编码接口域名。

```bash
cp .env.example .env.local
```

按本地后端端口修改 `.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## 已实现页面

- `/login`：邮箱和密码登录，成功后保存 JWT token 到 localStorage 并跳转首页。
- `/register`：昵称、邮箱和密码注册，成功后跳转登录页。
- `/`：首页应用壳，加载时通过 `/users/me` 恢复登录态，失败时清除 token 并跳转登录页。

## 目录

```text
src/app              App Router 页面
src/components/auth 认证页结构组件
src/components/ui   基础 UI 组件
src/lib/api.ts      API 请求层
src/lib/auth.ts     token 读写与清除
src/lib/cx.ts       className 拼接工具
```

## 验证

```bash
yarn lint
yarn build
```
