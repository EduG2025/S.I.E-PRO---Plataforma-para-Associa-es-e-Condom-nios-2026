
#!/bin/bash
# 🚀 S.I.E PRO - VPS DEPLOYMENT PROTOCOL V240.5 (SRE)
# Protocolo de Resiliência de Instalação e Build.

echo "--------------------------------------------------------"
echo "  S.I.E PRO - SISTEMA INTELIGENTE ATIVO V240.5"
echo "  PROTOCOLO SRE DE DEPLOY EM AMBIENTE DE MISSÃO CRÍTICA"
echo "--------------------------------------------------------"

# 1. Auditoria de Permissões
echo "🔍 [1/5] Auditando permissões de diretório..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# 2. Instalação de Dependências
echo "📦 [2/5] Sincronizando dependências (Clean Install)..."
if [ "$1" == "--clean" ]; then
    echo "🧹 Limpeza de cache node_modules solicitada..."
    rm -rf node_modules package-lock.json
fi
npm install

# 3. Compilação do Frontend
echo "🏗️ [3/5] Gerando build otimizado (Vite)..."
npm run build

# 4. Verificação de Integridade .env
echo "🛡️ [4/5] Verificando variáveis de ambiente..."
if [ ! -f .env ]; then
    echo "❌ ERRO CRÍTICO: Arquivo .env não localizado!"
    exit 1
fi
echo "✅ Ambiente validado."

# 5. Orquestração via PM2
echo "⚙️ [5/5] Reiniciando Kernel via PM2..."
# Verifica se o processo já existe para decidir entre restart ou start
if pm2 list | grep -q "sie-kernel"; then
    pm2 restart sie-kernel --update-env
else
    pm2 start server.js --name "sie-kernel"
fi
pm2 save

echo "--------------------------------------------------------"
echo "🚀 CLUSTER OPERACIONAL!"
echo "📈 Use: 'pm2 monit' para telemetria em tempo real."
echo "📝 Use: 'pm2 logs sie-kernel' para auditoria de rede."
echo "--------------------------------------------------------"
