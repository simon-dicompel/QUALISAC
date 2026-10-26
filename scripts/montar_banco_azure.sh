#!/usr/bin/env bash
# =========================================================================================
# SCRIPT DE CRIAÇÃO AUTOMATIZADA DO BANCO DE DADOS NO MICROSOFT AZURE
# PROJETO: QualiSAC Simon Dicompel (ISO 9001 - SAC, Devoluções & Não Conformidades)
# Pode ser executado no Azure Cloud Shell (shell.azure.com) ou no Linux / macOS / Git Bash
# =========================================================================================

set -e

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   🏢 SIMON DICOMPEL - CRIAÇÃO DO BANCO DE DADOS NO MICROSOFT AZURE   ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# 1. Verificação do Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Erro: O Azure CLI ('az') não foi encontrado.${NC}"
    echo "Dica: Você pode rodar este script diretamente no navegador pelo Azure Cloud Shell:"
    echo "👉 Acesse: https://shell.azure.com (já vem com o Azure CLI pré-instalado)"
    exit 1
fi

# 2. Verificação de Autenticação
echo -e "${YELLOW}🔍 Verificando login no Azure...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}🔑 Não autenticado. Iniciando login no Azure...${NC}"
    az login --use-device-code
fi

CURRENT_SUB=$(az account show --query name -o tsv)
SUB_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}✅ Autenticado com sucesso! Assinatura ativa:${NC} $CURRENT_SUB ($SUB_ID)"
echo ""

# 3. Definição de Parâmetros (com valores padrão para a Simon Dicompel)
read -p "Nome do Grupo de Recursos [padrão: rg-qualisac-dicompel]: " INPUT_RG
RESOURCE_GROUP="${INPUT_RG:-rg-qualisac-dicompel}"

read -p "Região do Azure [padrão: brazilsouth (Brasil Sul)]: " INPUT_LOC
LOCATION="${INPUT_LOC:-brazilsouth}"

# Gera um sufixo numérico caso o usuário queira garantir unicidade
RANDOM_SUFFIX=$((RANDOM % 9000 + 1000))
SUGGESTED_SERVER="sql-qualisac-dicompel-${RANDOM_SUFFIX}"

read -p "Nome do Servidor SQL (deve ser globalmente único) [sugestão: ${SUGGESTED_SERVER}]: " INPUT_SERVER
SERVER_NAME="${INPUT_SERVER:-$SUGGESTED_SERVER}"

read -p "Nome do Banco de Dados [padrão: qualisac_db]: " INPUT_DB
DATABASE_NAME="${INPUT_DB:-qualisac_db}"

read -p "Nome do Usuário Administrador [padrão: qualisacadmin]: " INPUT_USER
ADMIN_USER="${INPUT_USER:-qualisacadmin}"

# Solicitação segura de senha
ADMIN_PASSWORD=""
while [ -z "$ADMIN_PASSWORD" ]; do
    read -sp "Digite a Senha do Administrador (mínimo 8 dígitos, maiúsculas, minúsculas e números): " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
        echo -e "${RED}⚠️ A senha deve ter no mínimo 8 caracteres.${NC}"
        ADMIN_PASSWORD=""
    fi
done

echo ""
echo -e "${BLUE}----------------------------------------------------------------------${NC}"
echo "Resumo dos Recursos que serão criados no Azure:"
echo "• Grupo de Recursos : $RESOURCE_GROUP"
echo "• Região Azure      : $LOCATION"
echo "• Servidor SQL      : $SERVER_NAME.database.windows.net"
echo "• Banco de Dados    : $DATABASE_NAME (Camada: Basic)"
echo "• Usuário Admin     : $ADMIN_USER"
echo -e "${BLUE}----------------------------------------------------------------------${NC}"
read -p "Deseja prosseguir com a criação? (s/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ && ! -z "$CONFIRM" ]]; then
    echo "Operação cancelada pelo usuário."
    exit 0
fi

echo ""
# 4. Criar Resource Group
echo -e "${YELLOW}1/5 Criando Grupo de Recursos '${RESOURCE_GROUP}' na região '${LOCATION}'...${NC}"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o table

# 5. Criar Servidor SQL
echo -e "${YELLOW}2/5 Criando Servidor Azure SQL '${SERVER_NAME}'... (Isso pode levar de 1 a 2 minutos)${NC}"
if az sql server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}ℹ️ O servidor SQL '${SERVER_NAME}' já existe. Continuando...${NC}"
else
    az sql server create \
        --name "$SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --admin-user "$ADMIN_USER" \
        --admin-password "$ADMIN_PASSWORD" \
        -o table
    echo -e "${GREEN}✅ Servidor Azure SQL criado com sucesso!${NC}"
fi

# 6. Configurar Regras de Firewall
echo -e "${YELLOW}3/5 Configurando regras de firewall para acesso seguro...${NC}"
# Permite que serviços do Azure (Web Apps, Functions, GitHub Actions) acessem o SQL
az sql server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$SERVER_NAME" \
    --name "AllowAzureServices" \
    --start-ip-address "0.0.0.0" \
    --end-ip-address "0.0.0.0" \
    -o table || true

# Libera o IP atual do usuário
MY_IP=$(curl -s https://api.ipify.org || echo "")
if [ -n "$MY_IP" ]; then
    echo -e "Liberando seu IP atual (${MY_IP})..."
    az sql server firewall-rule create \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SERVER_NAME" \
        --name "AllowMyCurrentIP" \
        --start-ip-address "$MY_IP" \
        --end-ip-address "$MY_IP" \
        -o table || true
fi

# 7. Criar Banco de Dados SQL
echo -e "${YELLOW}4/5 Criando o Banco de Dados '${DATABASE_NAME}' na camada Basic econômica...${NC}"
if az sql db show --name "$DATABASE_NAME" --server "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}ℹ️ O banco de dados '${DATABASE_NAME}' já existe.${NC}"
else
    az sql db create \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SERVER_NAME" \
        --name "$DATABASE_NAME" \
        --service-objective "Basic" \
        --max-size "2GB" \
        -o table
    echo -e "${GREEN}✅ Banco de Dados '${DATABASE_NAME}' criado com sucesso!${NC}"
fi

# 8. Execução do Script DDL (Tabelas, Índices e Dados Iniciais)
echo -e "${YELLOW}5/5 Aplicando o schema com todas as tabelas (azure_sql_setup.sql)...${NC}"
SQL_FILE="azure_sql_setup.sql"
if [ ! -f "$SQL_FILE" ]; then
    # Procura na pasta raiz ou diretório superior
    if [ -f "../$SQL_FILE" ]; then
        SQL_FILE="../$SQL_FILE"
    fi
fi

if [ -f "$SQL_FILE" ] && command -v sqlcmd &> /dev/null; then
    echo "Executando via sqlcmd..."
    sqlcmd -S "${SERVER_NAME}.database.windows.net" -d "$DATABASE_NAME" -U "$ADMIN_USER" -P "$ADMIN_PASSWORD" -i "$SQL_FILE"
    echo -e "${GREEN}✅ Todas as tabelas, índices e dados da Simon Dicompel foram inseridos com sucesso!${NC}"
else
    echo -e "${YELLOW}ℹ️ Dica para aplicar o script das tabelas:${NC}"
    echo "1. Acesse o portal Azure: https://portal.azure.com"
    echo "2. Entre em: Bancos de dados SQL > '${DATABASE_NAME}' > 'Editor de consultas (versão prévia)'"
    echo "3. Faça login com o usuário '${ADMIN_USER}' e sua senha."
    echo "4. Cole o conteúdo do arquivo '${SQL_FILE}' e clique em 'Executar'."
fi

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}   🎉 BANCO DE DADOS NO AZURE CONFIGURADO COM SUCESSO!                ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo "Copie e cole estas variáveis no seu arquivo .env local ou nas configurações da nuvem:"
echo ""
echo -e "${BLUE}# Configuração de Banco de Dados Azure SQL (Simon Dicompel)${NC}"
echo "AZURE_DB_HOST=\"${SERVER_NAME}.database.windows.net\""
echo "AZURE_DB_PORT=1433"
echo "AZURE_DB_NAME=\"${DATABASE_NAME}\""
echo "AZURE_DB_USER=\"${ADMIN_USER}\""
echo "AZURE_DB_PASSWORD=\"${ADMIN_PASSWORD}\""
echo "AZURE_DB_SSL=true"
echo ""
echo -e "${BLUE}String de Conexão JDBC / ADO.NET:${NC}"
echo "Server=tcp:${SERVER_NAME}.database.windows.net,1433;Initial Catalog=${DATABASE_NAME};Persist Security Info=False;User ID=${ADMIN_USER};Password=********;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
echo ""
echo -e "${GREEN}Tudo pronto para conectar!${NC}"
