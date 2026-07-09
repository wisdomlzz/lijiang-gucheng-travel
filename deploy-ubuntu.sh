#!/bin/bash
# 丽江古城游 Ubuntu 部署脚本（端口可配置版）
# 用法: bash deploy-ubuntu.sh
set -e

SERVER="lzz@192.168.31.230"
PASS="lzzz1998"
REMOTE_DIR="/home/lzz/lijiang-tour"
LOCAL_DIR="/Users/lzz/Desktop/Projects/丽江古城游"

FRONTEND_PORT=10001
BACKEND_PORT=20001

echo "=============================="
echo " 丽江古城游 · Ubuntu 部署"
echo " 前端: ${FRONTEND_PORT} | 后端: ${BACKEND_PORT}"
echo "=============================="

# ============================================================
# 1. 上传项目
# ============================================================
echo "[1/5] 上传项目..."
sshpass -p "$PASS" rsync -avz --exclude node_modules --exclude dist --exclude '.git' --exclude '*.db' \
  "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

# ============================================================
# 2. 远程构建 + 部署
# ============================================================
echo "[2/5] 远程部署..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$SERVER" bash << REMOTE_SCRIPT
set -e
cd "$REMOTE_DIR"

echo "--- Node.js ---"
if ! command -v node &>/dev/null; then
  sudo apt update -qq
  sudo apt install -y -qq curl
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
  sudo apt install -y nodejs
fi

# 删除 mac 专用依赖避免 x86 构建失败
sed -i '/@rollup\/rollup-darwin-arm64/d' package.json

echo "--- 构建前端 ---"
/usr/bin/npm install @rollup/rollup-linux-x64-gnu 2>/dev/null
/usr/bin/npm install --ignore-scripts 2>/dev/null
/usr/bin/npm rebuild esbuild 2>/dev/null
/usr/bin/npm install 2>&1 | tail -3
/usr/bin/npx vite build 2>&1 | tail -3
echo "  前端构建完成"

echo "--- 后端 ---"
cd "$REMOTE_DIR/server"
rm -rf node_modules/better-sqlite3
/usr/bin/npm install 2>&1 | tail -3
/usr/bin/npm install better-sqlite3 2>&1 | tail -3
echo "  后端依赖安装完成"

echo "--- 停止旧服务 ---"
# 停止旧后端（任何端口）
pkill -f "node.*index.js" 2>/dev/null || true
sleep 1

echo "--- 启动后端 (端口 ${BACKEND_PORT}) ---"
# 修改后端端口
sed -i "s/const PORT = process.env.PORT || [0-9]*/const PORT = process.env.PORT || ${BACKEND_PORT}/" index.js

# 启动
/usr/bin/node index.js &
sleep 3

echo "--- 配置 Nginx (前端 ${FRONTEND_PORT} / 后端 ${BACKEND_PORT}) ---"
sudo tee /etc/nginx/sites-available/lijiang-tour > /dev/null << NGINX
server {
    listen ${FRONTEND_PORT};
    server_name _;

    root $REMOTE_DIR/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
    }
}
NGINX

# 保留原 80 端口配置（旧版兼容或重定向用）
# 直接使用新端口
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/lijiang-tour /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "=== 服务状态 ==="
curl -s -o /dev/null -w "  前端: %{http_code}\n"  "http://localhost:${FRONTEND_PORT}"
curl -s -o /dev/null -w "  API : %{http_code}\n"  "http://localhost:${BACKEND_PORT}/api/v1/notifications?staffId=s1"
REMOTE_SCRIPT

# ============================================================
# 3. 验证
# ============================================================
echo "[3/5] 验证服务..."
sleep 2
echo -n "  前端 http://192.168.31.230:${FRONTEND_PORT} → "
curl -s -o /dev/null -w "%{http_code}\n" "http://192.168.31.230:${FRONTEND_PORT}"
echo -n "  API  http://192.168.31.230:${FRONTEND_PORT}/api/v1/notifications?staffId=s1 → "
curl -s -o /dev/null -w "%{http_code}\n" "http://192.168.31.230:${FRONTEND_PORT}/api/v1/notifications?staffId=s1"

echo ""
echo "=============================="
echo " ✅ 部署完成"
echo "=============================="
echo " 前端: http://192.168.31.230:${FRONTEND_PORT}"
echo " 后端: http://192.168.31.230:${FRONTEND_PORT}/api/ (通过nginx代理)"
echo " 直连: http://192.168.31.230:${BACKEND_PORT}/api/v1/"
echo ""
echo " 配置控制:"
echo "   FRONTEND_PORT=${FRONTEND_PORT}  后端端口"
echo "   BACKEND_PORT=${BACKEND_PORT}   前端端口"
echo "=============================="