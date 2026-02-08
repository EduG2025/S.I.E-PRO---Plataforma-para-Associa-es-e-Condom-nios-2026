
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER SEEDS HYDRATION V253.0
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CARGOS HIERÁRQUICOS
TRUNCATE TABLE `roles`;
INSERT INTO `roles` (`id`, `label`) VALUES 
('ADMIN', 'Administrador Master (SRE)'),
('PRESIDENT', 'Presidente / Síndico'),
('TREASURER_1', 'Tesoureiro Principal'),
('SECRETARY_1', 'Primeiro Secretário'),
('RESIDENT', 'Morador / Associado');

-- 2. AI PROMPTS (ATUALIZADO COM MODELO DE DECLARAÇÃO SRE STRICT)
TRUNCATE TABLE `ai_prompts`;
INSERT INTO `ai_prompts` (`title`, `category`, `role_restriction`, `content`, `is_favorite`) VALUES
('DECLARAÇÃO DE RESIDÊNCIA (OCR)', 'DOCUMENTOS', 'ALL', 'ATUE COMO: Agente Administrativo de Compliance.\nOBJETIVO: Redigir corpo de DECLARAÇÃO DE RESIDÊNCIA.\nFONTE DE DADOS: Utilize EXCLUSIVAMENTE os dados extraídos do anexo (OCR) fornecido abaixo.\n\nDIRETRIZES OBRIGATÓRIAS:\n1. Extraia: Nome Completo, CPF e Endereço Completo.\n2. Se algum dado estiver ilegível, substitua por "[DADO ILEGÍVEL]". NÃO INVENTE DADOS.\n3. Estruture em HTML simples (<p>, <strong>).\n4. Mantenha tom formal e impessoal.\n5. NÃO inclua cabeçalhos, rodapés, assinaturas gráficas ou explicações.\n6. Mantenha as variáveis {entidade}, {cidade} e {data_atual} LITERAIS para interpolação posterior.\n\nSAÍDA ESPERADA (HTML):\n<p style="text-align: justify; line-height: 1.6; font-size: 12pt;">Declaramos, para os devidos fins de direito e a quem possa interessar, que <strong>[NOME EXTRAÍDO]</strong>, inscrito(a) no CPF sob o nº <strong>[CPF EXTRAÍDO]</strong>, reside e domicilia-se no endereço: <strong>[ENDEREÇO COMPLETO EXTRAÍDO]</strong>.</p>\n<p style="text-align: justify; line-height: 1.6; font-size: 12pt;">Por ser expressão da verdade, a {entidade} firma a presente declaração.</p>\n<p style="text-align: center; margin-top: 30px;">{cidade}, {data_atual}.</p>', 1),
('CONVOCAÇÃO ASSEMBLEIA', 'DOCUMENTOS', 'PRESIDENT', 'Aja como um Secretário Jurídico. Redija uma convocação formal para Assembleia Geral Ordinária. Inclua pautas sobre aprovação de contas e eleição de conselho. Use tom solene e cite o Código Civil.', 0),
('EDITAL DE LICITAÇÃO', 'DOCUMENTOS', 'SECRETARY_1', 'Redija um edital de licitação para contratação de serviços de vigilância armada. Especifique critérios de seleção, prazos de entrega de propostas e requisitos técnicos SRE.', 0),
('NOTIFICAÇÃO EXTRAJUDICIAL', 'DOCUMENTOS', 'ADMIN', 'Gere uma notificação extrajudicial para um membro inadimplente há mais de 90 dias. Use tom firme porém mediador, oferecendo canais para acordo antes da judicialização.', 1),
('RELATÓRIO DE GESTÃO', 'DOCUMENTOS', 'PRESIDENT', 'Estruture um relatório semestral de prestação de contas do Presidente. Foque nas benfeitorias realizadas, metas ESG atingidas e saúde financeira do cluster.', 0);

-- 3. CONFIGURAÇÕES SINGLETON
UPDATE `settings` SET 
`name` = 'S.I.E — SISTEMA INTELIGENTE ATIVO PARA ASSOCIAÇÕES, CONDOMÍNIOS E GESTÃO COLETIVA',
`shortName` = 'S.I.E PRO',
`module_metadata` = '{"dashboard": {"title": "COMANDO CENTRAL", "slogan": "INTELIGÊNCIA OPERACIONAL EM TEMPO REAL"}}'
WHERE `id` = 1;

SET FOREIGN_KEY_CHECKS = 1;
