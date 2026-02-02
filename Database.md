# 🏛️ DICIONÁRIO DE DADOS S.I.E PRO (V248.5)

Este documento detalha a arquitetura de persistência do cluster S.I.E PRO, servindo como guia para auditorias de SRE e expansão do Kernel.

---

## 🏗️ EIXO 1: NÚCLEO E CONFIGURAÇÃO (CORE)

### `settings` (Singleton ID: 1)
Gerencia a identidade corporativa e parâmetros de sistema.
- `module_metadata`: JSON (Títulos, Slogans, Layout Sidebar).
- `dictionary`: JSON (Traduções de termos técnicos).
- `context_rules`: Campo Legado (Substituído pela Wiki Hub para RAG).

### `wiki_entries` (Knowledge Base & RAG Source)
**CRÍTICO:** Esta tabela alimenta o motor de IA Advisor. 
- `category`: CORE | AI | DESIGN | OPERATIONAL | LEGAL | FINANCE | ESG.
- `title`: Título do manual.
- `content`: Conteúdo em Markdown/HTML (Consumido pela IA como contexto).
- `is_system`: (TINYINT) Protege artigos vitais de deleção acidental.

---

## ⚖️ EIXO 2: GOVERNANÇA E IDENTIDADE
- `users`: Ledger central com biometria facial e dados sociais.
- `roles` & `role_permissions`: Matriz RBAC V2.0.

---

## 🛡️ EIXO 3: OPERAÇÕES E SEGURANÇA (WATCHDOG)
- `incidents`: Ocorrências georreferenciadas.
- `visitors` & `deliveries`: Log forense de acesso.
- `cameras`: Feeds de CFTV unificados.

---

## 💰 EIXO 4: FINANCEIRO E PATRIMÔNIO (LEDGER)
- `financials`: Fluxo de caixa e inadimplência.
- `assets`: Inventário de ativos fixos.

---
**Status da Auditoria:** 🟢 SINCRONIZADO (Protocolo RAG Ativo)