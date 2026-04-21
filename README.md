# Cloud Notes

一个支持富文本编辑、标签管理的云笔记项目。默认可本地使用，配置 Supabase 后可跨设备持久化。

## 本地启动

```bash
npm install
npm run dev
```

## 启用云端持久化（跨设备同步）

1. 在 Supabase 创建项目，获取 `Project URL` 和 `anon public` Key。
2. 在项目根目录创建 `.env` 文件，写入：

```env
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的ANON_KEY
```

3. 在 Supabase 的 SQL Editor 中执行迁移脚本：

- `supabase/migrations/20260421010000_public_notes.sql`

执行成功后，刷新网页即可启用云端持久化。没有配置 `Supabase` 时会自动使用本地存储。

## 部署到 GitHub Pages

推送到 `main` 分支后，GitHub Actions 会自动构建并部署。

如果需要云端持久化，请在 GitHub 仓库里设置 Secrets：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
