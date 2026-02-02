# 🚀 PROTOCOLO DE DEPLOY S.I.E PRO V242.0 (SRE)

## 1. PREPARAÇÃO DO SISTEMA
```bash
# Atualizar pacotes
sudo apt update && sudo apt install -y build-essential git curl nginx

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. RESOLUÇÃO DE PERMISSÕES
```bash
# SRE INTEGRITY FIX
sudo chown -R $USER:$USER /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space
sudo chmod -R 755 /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space
```

## 3. CONFIGURAÇÃO DO REVERSE PROXY (NGINX VHOST)
Edite `/etc/nginx/sites-available/admcacaria.jennyai.space`:

```nginx
server {
    listen 80;
    server_name admcacaria.jennyai.space;
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name admcacaria.jennyai.space;

    root /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/admcacaria.jennyai.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admcacaria.jennyai.space/privkey.pem;

    # API Bridge
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # MICRO-FRONTEND ID (SRE BRIDGE)
    location /id/ {
        alias /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space/id/dist/;
        index index.html;
        try_files $uri $uri/ /id/index.html;

        # Segurança de Contexto
        add_header Content-Security-Policy "frame-ancestors 'self' https://admcacaria.jennyai.space" always;
        add_header X-Frame-Options "SAMEORIGIN" always;

        # Correção de MIME Type para Assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf)$ {
            add_header Cache-Control "public, max-age=31536000";
            access_log off;
        }
    }

    # App Principal SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 4. ONE-LINER DE MIGRAÇÃO E BUILD
```bash
cd /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space
npm install && npm run build-all && pm2 restart sie-kernel || pm2 start server.js --name "sie-kernel"
```

## 5. MONITORAMENTO
```bash
pm2 monit
pm2 logs sie-kernel
```