
# 📊 PROTOCOLO DE PESQUISA E CENSO PÚBLICO (S.I.E PRO)

Este documento descreve o funcionamento do módulo de **Censo Neural por Link Público**, permitindo a coleta de dados de moradores e membros sem a necessidade de autenticação prévia no sistema.

---

## 1. FLUXO DO ADMINISTRADOR (GERAÇÃO)

Para disponibilizar uma pesquisa para o público externo ou grupo de moradores:

1.  Acesse o módulo **Censo & Pesquisas** no menu lateral.
2.  Localize o card do formulário desejado (ex: "Censo Socioeconômico 2025").
3.  Certifique-se de que o status está como **ACTIVE** (Verde).
4.  Clique no botão **"Link Público"** ou no ícone de compartilhamento (**Share2**).
5.  O sistema gerará uma URL dinâmica no formato: 
    `https://seu-dominio.com/census/{ID_DA_PESQUISA}`
6.  A URL é copiada automaticamente para a área de transferência para envio via WhatsApp ou E-mail.

---

## 2. FLUXO DO USUÁRIO (RESIDENTE)

O acesso público utiliza um protocolo de **Bypass de Autenticação** gerenciado pelo Kernel.

### Etapa 1: Identificação Soberana (CPF)
O usuário deve obrigatoriamente informar o CPF. O sistema executa:
-   **Validação de Algoritmo**: Verifica se o CPF é matematicamente válido.
-   **Normalização**: Remove pontos e traços para busca limpa no banco de dados.

### Etapa 2: Dados de Contato
Se o CPF for validado, o usuário informa Nome, Unidade/Lote e E-mail. Estes dados são usados para vincular a resposta a um perfil de morador no futuro.

### Etapa 3: Questionário Dinâmico
O sistema carrega em tempo real as perguntas configuradas no banco de dados para aquele ID específico, suportando:
-   Campos de Texto, Números e Datas.
-   Seleção Única (Radio) e Múltipla (Checkbox).
-   Escalas de Risco (Mapping Tags).

---

## 3. ARQUITETURA TÉCNICA (SRE CORE)

### Roteamento (Frontend)
O arquivo `App.tsx` contém um interceptor de rota:
```typescript
const isPublicCensus = window.location.pathname.startsWith('/census/');
if (isPublicCensus) return <PublicSenso />;
```
Isso garante que o componente público seja renderizado de forma isolada, sem carregar a barra lateral administrativa ou exigir tokens JWT.

### Endpoints de API (Backend)
-   `GET /api/surveys/public/:id`: Recupera a estrutura da pesquisa e perguntas (Público).
-   `POST /api/surveys/public/:id/submit`: Persiste as respostas no banco de dados.

### Persistência de Dados
As respostas são armazenadas na tabela `survey_responses` em formato **JSON**, permitindo flexibilidade total independente do número ou tipo de perguntas.

---

## 4. SEGURANÇA E PRIVACIDADE (LGPD)

-   **Integridade**: O link público só funciona para pesquisas com status `ACTIVE`.
-   **Sanitização**: Todas as entradas de texto passam por limpeza no Kernel para evitar SQL Injection.
-   **Vinculação Inteligente**: O sistema utiliza o CPF como chave única para evitar duplicidade de respostas para o mesmo censo.

---
**S.I.E PRO - Database Governança V22.4**  
*SRE Operational Security Standard*
