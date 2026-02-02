
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER SEEDS HYDRATION V243.0 (HIERARCHY UPDATE)
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CARGOS HIERÁRQUICOS (DOTAÇÃO OFICIAL)
TRUNCATE TABLE `roles`;
INSERT INTO `roles` (`id`, `label`) VALUES 
('ADMIN', 'Administrador Master (SRE)'),
('PRESIDENT', 'Presidente / Síndico'),
('VICE_PRESIDENT', 'Vice-Presidente'),
('SECRETARY_1', '1º Secretário'),
('SECRETARY_2', '2º Secretário'),
('TREASURER_1', '1º Tesoureiro'),
('TREASURER_2', '2º Tesoureiro'),
('RESIDENT', 'Morador / Associado');

-- 2. MATRIZ DE PERMISSÕES SRE (DOTAÇÃO INICIAL DE GOVERNANÇA)
TRUNCATE TABLE `role_permissions`;
INSERT INTO `role_permissions` (`role`, `permission_id`) VALUES 
('ADMIN', '*'),
('PRESIDENT', '*'),
('VICE_PRESIDENT', 'view_dashboard'),
('VICE_PRESIDENT', 'view_operations'),
('VICE_PRESIDENT', 'view_documents'),
('TREASURER_1', 'view_dashboard'),
('TREASURER_1', 'view_finances'),
('TREASURER_1', 'manage_finances'),
('TREASURER_2', 'view_dashboard'),
('TREASURER_2', 'view_finances'),
('RESIDENT', 'view_dashboard'),
('RESIDENT', 'use_marketplace'),
('RESIDENT', 'use_reservations'),
('RESIDENT', 'view_timeline'),
('RESIDENT', 'send_suggestions');

-- 3. CONFIGURAÇÕES SINGLETON (SYNC LABELS)
UPDATE `settings` SET 
`name` = 'S.I.E PRO - SISTEMA INTELIGENTE ATIVO',
`shortName` = 'S.I.E PRO',
`module_metadata` = '{
  "dashboard": {"title": "COMANDO CENTRAL", "slogan": "INTELIGÊNCIA OPERACIONAL EM TEMPO REAL"},
  "users": {"title": "MEMBROS & IDENTIDADES", "slogan": "BASE CADASTRAL SOBERANA"},
  "finance": {"title": "TESOURARIA SINCRO", "slogan": "CONTROLE DE FLUXO DE CAIXA LEDGER"},
  "surveys": {"title": "CENSO & INTELIGÊNCIA", "slogan": "MAPEAMENTO MULTISSETORIAL ATIVO"}
}'
WHERE `id` = 1;

SET FOREIGN_KEY_CHECKS = 1;
