# 🚀 Guia Completo: Como Montar o Banco de Dados no Microsoft Azure & Configuração SMTP

Este documento apresenta **4 opções práticas** para você montar o banco de dados no Microsoft Azure para o **QualiSAC Simon Dicompel (ISO 9001)**, desde o modo mais simples (100% pelo navegador sem instalar nada) até a automação por scripts e GitHub Actions.

---

## 🌟 OPÇÃO 1: Pelo Portal Azure Web (100% no Navegador - Mais Fácil e Recomendado)

Não requer a instalação de nenhum programa. Você faz tudo diretamente em **[portal.azure.com](https://portal.azure.com)**:

### Passo 1: Criar o Banco de Dados SQL
1. Acesse o **[Portal do Azure](https://portal.azure.com)** com sua conta.
2. Na barra de busca no topo, digite **Bancos de dados SQL** (SQL Databases) e clique nele.
3. Clique no botão **+ Criar** (ou *Create*).

### Passo 2: Configurações Básicas
* **Assinatura**: Selecione sua assinatura ativa.
* **Grupo de recursos**: Clique em **Criar novo** e digite: `rg-qualisac-dicompel`.
* **Nome do banco de dados**: Digite: `qualisac_db`.
* **Servidor**: Clique em **Criar novo** (veja o Passo 3).

### Passo 3: Configurar o Servidor SQL
Na janela lateral que se abre para criar o servidor:
* **Nome do servidor**: `sql-qualisac-dicompel` *(deve ser único; se já existir, adicione números, ex: `sql-qualisac-dicompel-2026`)*.
* **Localização**: Selecione `(South America) Brazil South` ou `(US) East US`.
* **Método de autenticação**: Selecione **Usar autenticação do SQL**.
* **Logon de administrador**: Digite `qualisacadmin`.
* **Senha**: Digite uma senha forte (mínimo 8 caracteres com maiúsculas, minúsculas, números e símbolos, ex: `Dicompel#Sql2026!`).
* Clique em **OK**.

### Passo 4: Escalonamento Econômico (Reduzir Custos)
* Em **Computação + armazenamento**, clique em **Configurar banco de dados**.
* Selecione a camada **Básico** (Basic) — limite de 2 GB, custo aproximado de R$ 30/mês ou gratuito no período de teste do Azure.
* Clique em **Aplicar**.

### Passo 5: Configurar Regras de Firewall (Importante!)
* Clique na aba superior **Rede** (Networking):
  * Em **Método de conectividade**: selecione *Ponto de extremidade público*.
  * Em **Regras de firewall**:
    * **Permitir que serviços e recursos do Azure acessem este servidor**: marque **SIM** (permite que aplicações Web e nuvem conectem).
    * **Adicionar endereço IP do cliente atual**: marque **SIM** (libera o IP do seu computador atual).
* Clique em **Revisar + Criar** e depois em **Criar**.
* Aguarde de 2 a 3 minutos até a conclusão da implantação.

### Passo 6: Aplicar o Script SQL de Tabelas (Editor de Consultas)
1. No portal Azure, abra o recurso criado: **qualisac_db**.
2. No menu lateral esquerdo, clique em **Editor de consultas (versão prévia)** / *Query editor*.
3. Faça login com o usuário `qualisacadmin` e a senha definida no Passo 3.
4. No sistema QualiSAC, clique em **Configurações** > aba **Banco Azure** > botão **"Ver Script SQL Completo"** (ou abra o arquivo `azure_sql_setup.sql`).
5. Copie todo o código, cole no editor de consultas do Azure e clique no botão azul **Executar** (*Run*).
6. **Pronto!** Todas as tabelas, chaves primárias, índices, usuários padrão e produtos Simon Dicompel foram criados com sucesso.

---

## ⚡ OPÇÃO 2: Execução Automática via Azure Cloud Shell (1 Linha)

O Azure Cloud Shell é um terminal Linux que roda dentro do próprio navegador com o Azure CLI já configurado:

1. Acesse: **[shell.azure.com](https://shell.azure.com)** e selecione o ambiente **Bash**.
2. Execute o script nativo incluído no projeto:
```bash
bash scripts/montar_banco_azure.sh
```
3. O script interativo:
   - Valida seu login no Azure;
   - Cria o Resource Group `rg-qualisac-dicompel`;
   - Cria o Servidor SQL gerenciado;
   - Configura as regras de firewall liberando o acesso na nuvem e o IP local;
   - Cria o banco `qualisac_db`;
   - Aplica o schema de tabelas `azure_sql_setup.sql`;
   - Imprime as variáveis prontas para o seu arquivo `.env`.

---

## 🪟 OPÇÃO 3: No Windows via PowerShell

Se você usa Windows com o Azure CLI instalado:

1. Abra o **Windows PowerShell** como Administrador.
2. Navegue até a pasta do projeto e execute:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\montar_banco_azure.ps1
```
3. O script criará toda a infraestrutura no Azure de forma automática e exibirá as credenciais de conexão ao final.

---

## 🤖 OPÇÃO 4: Criar no Azure através do GitHub Actions (CI/CD)

O repositório já contém o arquivo `.github/workflows/deploy-azure-database.yml`.

### 1. Gerar a Credencial do Azure
No terminal ou no Azure Cloud Shell, rode:
```bash
az ad sp create-for-rbac --name "github-actions-qualisac" --role contributor --sdk-auth
```
Copie o JSON retornado.

### 2. Cadastrar Secret no GitHub
1. No seu repositório no GitHub, vá em **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
2. Nome: `AZURE_CREDENTIALS`
3. Valor: Cole o JSON obtido no passo anterior.

### 3. Rodar o Workflow
1. No GitHub, vá na aba **Actions**.
2. Selecione o fluxo **"Provisionar e Configurar Banco de Dados Azure"**.
3. Clique em **Run workflow**.

---

## ⚙️ Variáveis de Ambiente para o `.env`

Após montar o banco no Azure por qualquer uma das opções, adicione no seu arquivo `.env`:

```env
# Conexão com Azure SQL Server
AZURE_DB_HOST="sql-qualisac-dicompel.database.windows.net"
AZURE_DB_PORT=1433
AZURE_DB_NAME="qualisac_db"
AZURE_DB_USER="qualisacadmin"
AZURE_DB_PASSWORD="SuaSenhaForteAqui!"
AZURE_DB_SSL=true
```

---

## 📧 SOLUÇÃO: Erro SMTP Outlook `535 5.7.3 Authentication unsuccessful`

O erro `Invalid login: 535 5.7.3 Authentication unsuccessful [outlook.com]` ocorre porque o Microsoft 365 / Exchange Online desativa por padrão o **SMTP Autenticado** nas contas de e-mail corporativas.

### Como liberar o envio em 3 passos para `sac@dicompel.com.br`:

1. **Ativar SMTP Autenticado no Admin Center:**
   - Acesse: [admin.microsoft.com](https://admin.microsoft.com) com um administrador do Microsoft 365.
   - Vá em **Usuários** > **Usuários ativos** > clique em **`sac@dicompel.com.br`**.
   - Na aba lateral, clique em **Email** > **Gerenciar aplicativos de email**.
   - Marque a caixa **SMTP Autenticado** (Authenticated SMTP) e clique em **Salvar alterações**.

2. **Se a organização exigir MFA / Duplo Fator (Senha de Aplicativo):**
   - Acesse [mysignins.microsoft.com/security-info](https://mysignins.microsoft.com/security-info) logado com `sac@dicompel.com.br`.
   - Clique em **Adicionar método** > **Senha de aplicativo** (*App Password*).
   - Dê o nome `QualiSAC Simon Dicompel` e copie a senha gerada de 16 caracteres.
   - Use essa senha no seu arquivo `.env` como `SMTP_PASS`.

3. **Configuração no `.env`:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sac@dicompel.com.br
SMTP_PASS="sua_senha_ou_senha_de_app"
SMTP_FROM="Simon Dicompel SAC <sac@dicompel.com.br>"
```
