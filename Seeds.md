# 🧪 SCRIPT DE HIDRATAÇÃO SQL S.I.E PRO (WIKI MASTER V3 - FULL DOCUMENTATION)

Este script carrega o manual completo de operação do cluster. Essencial para que a IA (Advisor Mentor) saiba explicar cada botão e regra do sistema.

```sql
-- PROTOCOLO SRE: LIMPEZA E REIDRATAÇÃO COMPLETA
TRUNCATE TABLE `wiki_entries`;

INSERT INTO `wiki_entries` (`category`, `title`, `slug`, `content`, `is_system`) VALUES 
-- EIXO 1: ESTRATÉGICO
('CORE', 'Arquitetura de Missão Crítica', 'core-architecture', 'O S.I.E PRO opera sob o protocolo SRE (Site Reliability Engineering). O Kernel é dividido em: 1. Ledger Central (Usuários), 2. Motor Neural (IA), 3. Gateway de Mensagens (WhatsApp) e 4. BI Territorial (Mapas). Toda ação gera um log imutável na tabela audit_logs.', 1),
('CORE', 'Controle de Acesso RBAC 2.0', 'rbac-system', 'O sistema utiliza controle de acesso baseado em papéis. Administradores têm wildcard (*), enquanto Moradores e Diretores têm permissões granulares gerenciadas no Console Master. O acesso é biográfico e biométrico.', 1),

-- EIXO 2: FINANCEIRO (LEDGER)
('FINANCE', 'Ledger Financeiro e Fluxo de Caixa', 'finance-ledger', 'O módulo Financeiro utiliza o conceito de Ledger (Livro-razão). Entradas (Incomes) e Saídas (Expenses) são categorizadas. Inadimplência gera bloqueios automáticos em áreas comuns e disparos de lembretes via Messenger Bridge a cada 24h de atraso.', 1),

-- EIXO 3: OPERACIONAL & SEGURANÇA
('OPERATIONAL', 'Watchdog Vision: Monitoramento', 'watchdog-vision', 'Central de vigilância ativa. Suporta feeds RTSP/HTTP. Possui modos Solo (foco), Grid (mosaico) e Patrulha (alternância automática). Integrado ao Face-ID para reconhecimento biométrico de membros na portaria.', 1),
('OPERATIONAL', 'Concierge: Portaria e Acesso', 'concierge-protocol', 'Registro forense de visitantes e encomendas. Todo visitante deve ser vinculado a uma unidade. Encomendas geram notificações automáticas para o WhatsApp do morador titular.', 1),
('OPERATIONAL', 'Gestão de Ativos e Patrimônio', 'asset-management', 'Inventário digital de todos os bens do cluster. Permite cálculo de depreciação, registro de manutenções corretivas e vinculação de responsáveis por equipamentos específicos.', 1),

-- EIXO 4: GOVERNANÇA & CENSO
('GOVERNANCE', 'Censo Neural e Mapeamento', 'surveys-neural', 'O Censo coleta dados socioeconômicos e de saúde. Perguntas podem ser geradas por IA (Neural Architect). O Link Público permite coleta sem login, utilizando validação de CPF para evitar duplicidade.', 1),
('GOVERNANCE', 'Hub de Documentos e Ghostwriter', 'document-hub', 'Repositório de atas, ofícios e regimentos. O Ghostwriter IA redige documentos baseados em contextos (atas de reunião, multas). Suporta moldes visuais (papel timbrado) customizáveis no Studio Lab.', 1),
('GOVERNANCE', 'Assembleia Digital e Votação', 'digital-assembly', 'Plataforma de deliberação online. Suporta chat em tempo real, cálculo automático de quórum e votação secreta ou aberta. Gera atas automáticas ao final da sessão.', 1),

-- EIXO 5: COMUNIDADE & ESG
('COMMUNITY', 'Marketplace Comunitário', 'marketplace-local', 'Fomento à economia circular dentro do cluster. Moradores podem anunciar bens e serviços. O contato é direto via WhatsApp Bridge sem intermediação financeira do sistema.', 1),
('COMMUNITY', 'Messenger Bridge: WhatsApp Gateway', 'messenger-bridge', 'Ponte de comunicação ativa via JennyAI. Envia faturas, avisos de urgência e boas-vindas. Utiliza templates neurais com variáveis dinâmicas como {nome} e {unidade}.', 1),
('ESG', 'S.I.E GREEN: Sustentabilidade', 'sie-green-esg', 'Monitoramento de eficiência hídrica e energética. Relatórios de pegada de carbono e metas de reciclagem. O cluster é auditado mensalmente para certificação ESG interna.', 1),

-- EIXO 6: DESIGN & UI
('DESIGN', 'Studio Lab: Identidade Visual', 'studio-lab-guide', 'Controle total da estética. Permite alterar cores master, raios de borda, tipografia e manifestos de botões. O S.I.E é 100% responsivo, adaptando-se de telas móveis 360px a monitores 4K.', 1);
```

---
**Status:** 🟢 Base de Conhecimento Integral Hidratada.
