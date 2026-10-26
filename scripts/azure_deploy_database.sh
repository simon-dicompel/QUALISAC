#!/usr/bin/env bash
# =========================================================================================
# SCRIPT DE CRIAÇÃO E CONFIGURAÇÃO DO BANCO DE DADOS NO AZURE (Simon Dicompel QualiSAC)
# Pode ser executado diretamente no Azure Cloud Shell, Linux, Mac ou no GitHub Actions
# =========================================================================================

set -e

# Configurações Padrão
RESOURCE_GROUP="${1:-rg-qualisac-dicompel}"
LOCATION="${2:-brazilsouth}"
SERVER_NAME="${3:-sql-qualisac-dicompel}"
DATABASE_NAME="${4:-qualisac_db}"
ADMIN_USER="${5:-qualisacadmin}"

echo "=================================================================="
echo "  IMPLANTAÇÃO DE BANCO DE DADOS NO AZURE - SIMON DICOMPEL QUALISAC"
echo "=================================================================="
echo "Resource Group : $RESOURCE_GROUP"
echo "Região         : $LOCATION"
echo "Servidor       : $SERVER_NAME"
echo "Banco de Dados : $DATABASE_NAME"
echo "Administrador  : $ADMIN_USER"
echo "=================================================================="

# Verifica se o Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo "❌ Erro: O Azure CLI ('az') não está instalado neste ambiente."
    echo "Instale o Azure CLI ou utilize o Azure Cloud Shell (https://shell.azure.com)."
    exit 1
fi

# Verifica se o usuário está logado no Azure
echo "🔍 Verificando autenticação no Azure..."
if ! az account show &> /dev/null; then
    echo "⚠️ Usuário não autenticado. Iniciando login no Azure..."
    az login --use-device-code
fi

echo "✅ Autenticado com sucesso no Azure!"

# 1. Criação do Resource Group
echo "📦 Criando / Verificando Resource Group: $RESOURCE_GROUP..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Solicita a senha se não fornecida como variável de ambiente
if [ -z "$ADMIN_PASSWORD" ]; then
    read -sp "Digite a Senha do Administrador do Banco (mínimo 8 dígitos com letras e números): " ADMIN_PASSWORD
    echo ""
fi

# 2. Criação do Servidor Azure SQL
echo "⚙️ Criando / Verificando Servidor Azure SQL: $SERVER_NAME..."
if ! az sql server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    az sql server create \
        --name "$SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --admin-user "$ADMIN_USER" \
        --admin-password "$ADMIN_PASSWORD"
    echo "✅ Servidor Azure SQL criado com sucesso!"
else
    echo "ℹ️ Servidor Azure SQL $SERVER_NAME já existe."
fi

# 3. Liberação do Firewall
echo "🛡️ Configurando regras de firewall..."
az sql server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$SERVER_NAME" \
    --name "AllowAzureServices" \
    --start-ip-address "0.0.0.0" \
    --end-ip-address "0.0.0.0" || true

MY_IP=$(curl -s https://api.ipify.org || echo "0.0.0.0")
if [ "$MY_IP" != "0.0.0.0" ]; then
    echo "Liberando seu IP atual ($MY_IP)..."
    az sql server firewall-rule create \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SERVER_NAME" \
        --name "AllowClientIP" \
        --start-ip-address "$MY_IP" \
        --end-ip-address "$MY_IP" || true
fi

# 4. Criação do Banco de Dados
echo "🗄️ Criando Banco de Dados: $DATABASE_NAME..."
if ! az sql db show --name "$DATABASE_NAME" --server "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    az sql db create \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SERVER_NAME" \
        --name "$DATABASE_NAME" \
        --service-objective "Basic" \
        --max-size "2GB"
    echo "✅ Banco de dados $DATABASE_NAME criado com sucesso!"
else
    echo "ℹ️ Banco $DATABASE_NAME já existe."
fi

# 5. Execução do Script SQL inicial (azure_sql_setup.sql)
if [ -f "azure_sql_setup.sql" ]; then
    echo "📜 Executando script SQL inicial (azure_sql_setup.sql)..."
    if command -v sqlcmd &> /dev/null; then
        sqlcmd -S "${SERVER_NAME}.database.windows.net" -d "$DATABASE_NAME" -U "$ADMIN_USER" -P "$ADMIN_PASSWORD" -i azure_sql_setup.sql
        echo "✅ Tabelas, índices e dados iniciais criados com sucesso!"
    else
        echo "ℹ️ O utilitário 'sqlcmd' não está instalado localmente. Você pode colar o conteúdo de 'azure_sql_setup.sql' no Query Editor do Portal Azure para criar as tabelas."
    fi
fi

echo ""
echo "=================================================================="
echo "🎉 BANCO DE DADOS AZURE PRONTO PARA USO!"
echo "=================================================================="
echo "Host: ${SERVER_NAME}.database.windows.net"
echo "Porta: 1433"
echo "Banco: ${DATABASE_NAME}"
echo "Usuário: ${ADMIN_USER}"
echo "=================================================================="
