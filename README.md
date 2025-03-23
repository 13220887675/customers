# 会员管理系统

这是一个基于Next.js和Supabase开发的会员管理系统，用于管理健身房会员、课程和教练等信息。

## 系统入口

### 管理员入口

- 路径：`/admin/login`
- 默认账号：admin
- 默认密码：admin

### 会员入口

- 路径：`/login`
- 账号：会员手机号
- 密码：手机号后6位

## 功能模块

### 管理界面
- 数据分析看板：`/admin/analytics`
- 会员管理：`/admin/members`（含新增、续费、课程记录）
- 课程记录：`/admin/class-records`
- 财务管理：`/admin/finance`
- 教练管理：`/admin/coaches`
- 数据库管理：`/admin/database`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
