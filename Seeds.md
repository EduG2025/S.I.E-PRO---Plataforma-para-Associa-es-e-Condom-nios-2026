# 🧪 SCRIPT DE HIDRATAÇÃO SQL S.I.E PRO (WIKI & NEURAL ASSETS V252)

Este script carrega o manual de operação e a **Biblioteca de Ativos Neurais** consolidada.

```sql
-- PROTOCOLO SRE: LIMPEZA E REIDRATAÇÃO COMPLETA DE WIKI
TRUNCATE TABLE `wiki_entries`;

INSERT INTO `wiki_entries` (`category`, `title`, `slug`, `content`, `is_system`) VALUES 
('CORE', 'Arquitetura de Missão Crítica', 'core-architecture', 'O S.I.E PRO opera sob o protocolo SRE (Site Reliability Engineering). O Kernel é dividido em: 1. Ledger Central (Usuários), 2. Motor Neural (IA), 3. Gateway de Mensagens (WhatsApp) e 4. BI Territorial (Mapas). Toda ação gera um log imutável na tabela audit_logs.', 1),
('FINANCE', 'Ledger Financeiro e Fluxo de Caixa', 'finance-ledger', 'O módulo Financeiro utiliza o conceito de Ledger (Livro-razão). Inadimplência gera bloqueios automáticos em áreas comuns e disparos de lembretes via Messenger Bridge.', 1);

-- PROTOCOLO SRE: INJEÇÃO DE BIBLIOTECA NEURAL (GHOSTWRITER & ADVISOR)
TRUNCATE TABLE `ai_prompts`;

-- 1. DOCUMENTOS (GHOSTWRITER)
INSERT INTO `ai_prompts` (`title`, `category`, `role_restriction`, `content`, `is_favorite`) VALUES
('CONVOCAÇÃO ASSEMBLEIA', 'DOCUMENTOS', 'PRESIDENT', 'Aja como um Secretário Jurídico. Redija uma convocação formal para Assembleia Geral Ordinária. Inclua pautas sobre aprovação de contas e eleição de conselho. Use tom solene e cite o Código Civil.', 1),
('EDITAL DE LICITAÇÃO', 'DOCUMENTOS', 'SECRETARY_1', 'Redija um edital de licitação para contratação de serviços de vigilância armada. Especifique critérios de seleção, prazos de entrega de propostas e requisitos técnicos SRE.', 0),
('NOTIFICAÇÃO EXTRAJUDICIAL', 'DOCUMENTOS', 'ADMIN', 'Gere uma notificação extrajudicial para um membro inadimplente há mais de 90 dias. Use tom firme porém mediador, oferecendo canais para acordo antes da judicialização.', 1),
('RELATÓRIO DE GESTÃO', 'DOCUMENTOS', 'PRESIDENT', 'Estruture um relatório semestral de prestação de contas do Presidente. Foque nas benfeitorias realizadas, metas ESG atingidas e saúde financeira do cluster.', 0),
('CERTIDÃO DE QUITAÇÃO', 'DOCUMENTOS', 'TREASURER_1', 'Emita um modelo de Certidão Negativa de Débitos Condominiais. O texto deve declarar que, até a presente data, a unidade não possui pendências no ledger.', 0);

-- 2. MENTOR (ADVISOR)
INSERT INTO `ai_prompts` (`title`, `category`, `role_restriction`, `content`, `is_favorite`) VALUES
('CONSULTA REGIMENTAL', 'MENTOR', 'ADMIN', 'Interprete o regimento interno sobre o uso de áreas comuns para eventos comerciais. Verifique a legalidade perante a convenção e sugira taxas de ocupação.', 1),
('MEDIAÇÃO DE CONFLITOS', 'MENTOR', 'PRESIDENT', 'Sugira um roteiro de mediação para um conflito entre vizinhos por barulho excessivo. O foco deve ser a resolução amigável e o cumprimento das normas de silêncio.', 0);
```