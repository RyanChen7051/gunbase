#!/usr/bin/env bash
# =====================================================================
# GunBase 火械基地 — 一键发布 / 同步脚本
#
# 用途：你在后台 admin.html 改完产品、导出新的 products.js 后，
#       在 gunbase-pwa 目录下运行 ./deploy.sh 即可把更新推送到
#       GitHub Pages，所有客户打开同一个链接就看到最新内容。
#
# 前置：仓库已关联 origin（首次部署时配置一次即可）。
#       若本机需要走代理，请在 ~/.gitconfig 或本仓库 .git/config
#       里设置 http.proxy / https.proxy（脚本本身不写死代理）。
# =====================================================================
set -e
cd "$(dirname "$0")"

echo "==> 1. 暂存全部改动"
git add -A

if git diff --cached --quiet; then
  echo "没有需要发布的改动，目录已是最新。"
  exit 0
fi

TS=$(date "+%Y-%m-%d %H:%M")
echo "==> 2. 提交改动 ($TS)"
git commit -m "Update GunBase catalog: $TS"

echo "==> 3. 推送到 GitHub（自动触发 Pages 重新发布）"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
git push -u origin "$BRANCH"

echo ""
echo "✅ 发布完成！GitHub Pages 通常 1 分钟内重新生成。"
echo "   客户打开网站链接即可看到最新产品（PWA 会自动刷新缓存）。"
echo "   若客户浏览器仍显示旧内容，让他们下拉刷新一次即可。"
