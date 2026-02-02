# 🏛️ Console Master Soberano — S.I.E PRO

O **Console Master Soberano** é o núcleo de alta criticidade do cluster S.I.E, operando sob o protocolo **SRE V10.0**. Ele centraliza seis camadas de governança estratégica, permitindo a gestão em tempo real de identidade, recursos de interface, inteligência artificial, mensageria, semântica visual e matriz de acesso.

---

## 🏗️ Camada 1: IDENTIDADE CORPORATIVA
**Resource:** `INFO`
**Objetivo:** Definir a personalidade jurídica, representação legal e a estética visual global do cluster.

### Campos de Registro da Entidade:
| Campo | Descrição Técnica | Tipo de Controle |
| :--- | :--- | :--- |
| **Razão Social** | Nome completo da Associação ou Condomínio. | Input Texto (Upper) |
| **Sigla Comercial** | Nome curto para exibição em headers e notificações. | Input Texto (Short) |
| **CNPJ Oficial** | Documento fiscal único para faturamento e contratos. | Input Mascarado |
| **Endereço Sede** | Localização física da administração central. | Input Texto (Longo) |
| **E-mail Administrativo** | Ponto de contato oficial para notificações do sistema. | Input Email |
| **WhatsApp Suporte** | Número de contato para suporte direto aos moradores. | Input Telefone |

### Campos de Representação Legal (Presidência):
| Campo | Descrição Técnica | Tipo de Controle |
| :--- | :--- | :--- |
| **Nome do Presidente** | Nome completo do representante eleito. | Input Texto (Upper) |
| **CPF do Presidente** | Documento de identificação do representante. | Input Mascarado |
| **Início da Gestão** | Data da posse conforme ata de eleição. | Date Picker |
| **Término da Gestão** | Data prevista para encerramento do mandato. | Date Picker |

### Configurações de Interface & Assinatura:
*   **Logotipo (Sovereign Storage):** Upload de imagem com conversão automática para Base64, garantindo independência de servidores de arquivos externos.
*   **Assinatura Digitalizada:** Upload de imagem (PNG) da assinatura manuscrita do Presidente, utilizada pelo Ghostwriter para assinar atas e ofícios automaticamente.
*   **Theming Engine (Primary Color):** Seletor hexadecimal reativo que altera variáveis CSS globais (`--sie-primary`) em tempo de execução.

---

## 🎨 Camada 2: MÓDULOS (MANIFEST DE INTERFACE)
**Resource:** `INTERFACE`
**Objetivo:** Governança de recursos granulares para o nível de acesso "RESIDENT".

### Toggles de Controle (On/Off):
*   **Financeiro:** Habilita o portal de faturas, histórico Ledger e pagamentos via PIX/Boleto.
*   **Reservas:** Ativa o motor de agendamento de áreas comuns (Churrasqueiras, Salões).
*   **Mural:** Controla o feed de comunicados oficiais e informativos urgentes.
*   **IA Advisor:** Permite o uso do assistente neural por moradores para consulta de regimento interno.

**Comportamento:** As alterações nesta camada atualizam o objeto JSON `resident_ui_settings` no Kernel, impactando sessões ativas sem necessidade de reload de servidor.

---

## 🧠 Camada 3: INTELIGÊNCIA (NEURAL POOL)
**Resource:** `AI_PROVIDERS`
**Objetivo:** Gestão do pool de redundância neural (Failover Architecture).

### Campos de Registro e Controle:
*   **Identificação do Token:** Rótulo descritivo (ex: "Gemini Production A").
*   **API KEY Secreta:** Chave de acesso ao provedor de IA (Google Gemini).
*   **Modelo Alvo:** Seleção entre `gemini-3-flash` (Velocidade) ou `gemini-3-pro` (Complexidade).
*   **Nível / Tier:** Definição entre `FREE` (Cota limitada) ou `PAID` (Alta disponibilidade).
*   **Prioridade (Failover):** Valor numérico que define a ordem de uso no cluster.
*   **Monitor de Saúde:** Contador automático de falhas (`error_count`) e timestamp do último handshake bem-sucedido.

---

## 💬 Camada 4: MESSENGER (JENNYAI BRIDGE V8.0)
**Resource:** `WHATSAPP`
**Objetivo:** Gateway de comunicação ativa e disparo massivo via WhatsApp.

### Configurações de Gateway:
*   **Bridge API KEY:** Chave de autenticação com o servidor JennyAI.
*   **Sender ID:** Identificador da instância de disparo ativa.
*   **Assinatura de Rodapé:** Texto fixo inserido em todas as mensagens oficiais.

### Motor de Automação:
*   **Template de Boas-Vindas:** Editor de texto com suporte a tags reativas `{nome}`, `{unidade}`, `{sigla}`, `{senha}`.
*   **Technical HUD:** Visualização de endpoints de Webhook (Inbound) e Gateway (Outbound) para diagnóstico de SRE.

---

## ⚖️ Camada 5: GOVERNANÇA (MANIFESTO DE TÍTULOS)
**Resource:** `GOVERNANCE`
**Objetivo:** Controle semântico e rebranding imediato de módulos.

### Campos de Controle por Módulo:
*   **Título do Header:** Altera o título principal exibido no topo de cada módulo (ex: Mudar "Users" para "Famílias Associadas").
*   **Slogan / Subtítulo:** Altera a descrição de apoio do módulo, personalizando o contexto para a realidade do cluster.

**Finalidade:** Eliminar strings "hardcoded", permitindo que o sistema se adapte a associações, condomínios verticais ou clubes esportivos através de metadados.

---

## 🛡️ Camada 6: RBAC (MATRIZ DE PERMISSÕES)
**Resource:** `PERMISSIONS`
**Objetivo:** Segurança perimetral e controle de acesso baseado em papéis.

### Mecanismos de Controle:
*   **Matriz Dinâmica:** Grade que cruza Cargos (Admin, Resident, Council, etc.) com Permissões (view_finances, manage_users, use_ai).
*   **Sincronia MySQL:** Persistência instantânea na tabela `role_permissions`.
*   **Security Lock:** O cargo `ADMIN` possui override bloqueado no front-end, impedindo que administradores se auto-removam permissões críticas de sistema.

---
**Status da Documentação:** 🟢 Homologada V10.0
**Integridade do Cluster:** Protegida contra degradação.