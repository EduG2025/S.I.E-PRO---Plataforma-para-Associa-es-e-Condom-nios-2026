
# 🏛️ DICIONÁRIO DE DADOS S.I.E PRO (V250.0)

Este documento detalha a arquitetura de persistência do cluster S.I.E PRO, servindo como guia para auditorias de SRE e migrações seguras.

---

## 🏗️ EIXO 1: NÚCLEO E CONFIGURAÇÃO (CORE)

### `settings` (Singleton ID: 1)
Gerencia a identidade corporativa e parâmetros de sistema.
- `license_status`: (ENUM) ACTIVE | SUSPENDED. Controla o Kill Switch global.
- `module_metadata`: JSON (Títulos, Slogans, Layout Sidebar).
- `coordinates`: JSON {lat, lng}. Epicentro geográfico do cluster.

### `wiki_entries` (Knowledge Base & RAG Source)
Alimenta o motor de IA Advisor.
- `is_system`: (TINYINT) Protege artigos vitais de deleção.

---

## ⚖️ EIXO 2: GOVERNANÇA E IDENTIDADE
### `users` (Ledger Central)
- `coordinates`: JSON {lat, lng}. Localização exata da unidade para filtros de mapa.
- `socialData`: JSON. Respostas consolidadas do Censo para BI Territorial.
- `voting_rights`: (TINYINT) Define elegibilidade em assembleias digitais.

---

## 🛡️ EIXO 3: OPERAÇÕES E SEGURANÇA (WATCHDOG)
### `incidents`
- `coordinates`: JSON. Ponto de origem do evento.
- `radius`: (DECIMAL) Raio de pânico para disparo de alertas geo-fenced.

---

## 💰 EIXO 4: FINANCEIRO E PATRIMÔNIO (LEDGER)
- `financials`: Registro de débitos e créditos.
- `plans` & `subscriptions`: Gestão de recorrência e arrecadação.

---
**Status da Auditoria:** 🟢 SINCRONIZADO (Migração de Schema Protegida)
