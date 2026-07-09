# 丽江古城游 · Ubuntu 部署指南

## 前置条件

```bash
# Ubuntu 22.04 / 24.04
sudo apt update
sudo apt install -y git curl nginx
```

### Node.js（推荐 20 LTS）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # >= 20
npm -v
```

---

## 1. 部署后端

### 1.1 复制项目

```bash
git clone <仓库地址> /opt/lijiang-tour
cd /opt/lijiang-tour/server
npm install
```

### 1.2 配置环境

不需要额外配置。后端默认监听 `0.0.0.0:3001`。

首次启动自动建表 + 灌种子数据（`seedIfNeeded` 检测空库时触发）。

### 1.3 使用 PM2 管理进程

```bash
npm install -g pm2

# 启动
pm2 start index.js --name lijiang-server --cwd /opt/lijiang-tour/server

# 开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs lijiang-server
```

### 1.4 验证

```bash
curl http://localhost:3001/api/v1/notifications?staffId=s1
# 返回: {"ok":true,"data":{...}}
```

---

## 2. 部署前端

### 2.1 构建静态文件

```bash
cd /opt/lijiang-tour
npm install
npx vite build
```

产物在 `dist/` 目录。

### 2.2 配置 Nginx

创建 `/etc/nginx/sites-available/lijiang-tour`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    root /opt/lijiang-tour/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/lijiang-tour /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 2.3 验证

浏览器访问 `http://your-domain.com` 或 `http://<服务器IP>`。

---

## 3. 修改前端 API 地址

如果前端和后端不在同一台机器上，需要修改 API 地址。

编辑 `src/api/client.ts`：

```typescript
// 开发环境
const BASE_URL = "http://localhost:3001/api/v1"

// 生产环境（改成你的服务器域名或IP）
const BASE_URL = "https://your-domain.com/api/v1"
```

修改后重新构建：

```bash
npx vite build
```

---

## 4. 数据迁移

### 4.1 导出数据（从现有 Mac 开发机）

```bash
# SQLite 数据库文件
rsync -avz /path/to/lijiang-tour/server/db/data.db user@ubuntu:/opt/lijiang-tour/server/db/

# 上传文件
rsync -avz /path/to/lijiang-tour/server/uploads/ user@ubuntu:/opt/lijiang-tour/server/uploads/
```

### 4.2 完整迁移步骤

```bash
# 1. 在 Mac 上打包
cd /path/to/lijiang-tour
tar czf lijiang-tour.tar.gz \
  server/db/data.db \
  server/uploads/ \
  --exclude=node_modules

# 2. 发送到 Ubuntu
scp lijiang-tour.tar.gz user@ubuntu:/opt/

# 3. 在 Ubuntu 上解压
cd /opt/lijiang-tour
tar xzf ../lijiang-tour.tar.gz
chmod 644 server/db/data.db

# 4. 重启后端（数据已存在时 seed 自动跳过）
pm2 restart lijiang-server
```

### 4.3 备份数据

```bash
# 每日备份
0 3 * * * cp /opt/lijiang-tour/server/db/data.db /opt/backups/data-$(date +\%Y\%m\%d).db
```

---

## 5. 端口与防火墙

```bash
# 开放 80 端口
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 6. 故障排查

| 问题 | 检查 |
|------|------|
| 502 Bad Gateway | `pm2 status` 确认后端运行, `nginx -t` 确认配置 |
| 前端白屏 | 浏览器 F12 看 Network 请求, `npx vite build` 是否有报错 |
| 数据不显示 | `curl http://localhost:3001/api/v1/orders` 测试 API |
| 种子数据未生成 | 删掉 `server/db/data.db` 重启 `pm2 restart lijiang-server` |