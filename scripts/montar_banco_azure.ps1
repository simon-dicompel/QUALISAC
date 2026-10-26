# =========================================================================================
# SCRIPT POWERSHELL PARA CRIAÇÃO DO BANCO DE DADOS NO MICROSOFT AZURE
# PROJETO: QualiSAC Simon Dicompel (ISO 9001 - SAC, Devoluções & Não Conformidades)
# Execute no Windows PowerShell (como Administrador) ou no Azure Cloud Shell PowerShell
# =========================================================================================

param(
    [string]$ResourceGroup = "rg-qualisac-dicompel",
    [string]$Location = "brazilsouth",
    [string]$ServerName = "sql-qualisac-dicompel-$((Get-Random -Minimum 1000 -Maximum 9999))",
    [string]$DatabaseName = "qualisac_db",
    [string]$AdminUser = "qualisacadmin",
    [string]$AdminPassword = ""
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   🏢 SIMON DICOMPEL - CRIAÇÃO DO BANCO DE DADOS NO AZURE (POWERSHELL)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Verifica se o Azure CLI está instalado
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Erro: O Azure CLI ('az') não foi encontrado no sistema." -ForegroundColor Red
    Write-Host "Instale o Azure CLI ou execute no navegador pelo Azure Cloud Shell: https://shell.azure.com"
    exit 1
}

# 2. Login no Azure
Write-Host "🔍 Verificando autenticação no Azure..." -ForegroundColor Yellow
$account = az account show --output json 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "🔑 Realizando login no Azure..." -ForegroundColor Yellow
    az login --use-device-code | Out-Null
    $account = az account show --output json | ConvertFrom-Json
}

Write-Host "✅ Conectado na assinatura: $($account.name) ($($account.id))" -ForegroundColor Green

# 3. Solicita a senha caso não tenha sido informada
if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    $secPass = Read-Host "Digite a Senha Forte para o Administrador do SQL ($AdminUser)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
    $AdminPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""
Write-Host "Configuração Selecionada:"
Write-Host "• Resource Group : $ResourceGroup"
Write-Host "• Região         : $Location"
Write-Host "• Servidor SQL   : $ServerName.database.windows.net"
Write-Host "• Banco de Dados : $DatabaseName"
Write-Host "• Usuário Admin  : $AdminUser"
Write-Host ""

# 4. Criar Grupo de Recursos
Write-Host "1/4 Criando Resource Group '$ResourceGroup'..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output table

# 5. Criar Servidor SQL
Write-Host "2/4 Criando Servidor Azure SQL '$ServerName'..." -ForegroundColor Yellow
$serverExists = az sql server show --name $ServerName --resource-group $ResourceGroup 2>$null
if (-not $serverExists) {
    az sql server create `
        --name $ServerName `
        --resource-group $ResourceGroup `
        --location $Location `
        --admin-user $AdminUser `
        --admin-password $AdminPassword `
        --output table
    Write-Host "✅ Servidor criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Servidor já existente." -ForegroundColor Green
}

# 6. Regras de Firewall
Write-Host "3/4 Configurando regras de Firewall..." -ForegroundColor Yellow
az sql server firewall-rule create `
    --resource-group $ResourceGroup `
    --server $ServerName `
    --name "AllowAzureServices" `
    --start-ip-address "0.0.0.0" `
    --end-ip-address "0.0.0.0" `
    --output table

try {
    $myIp = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    if ($myIp) {
        Write-Host "Liberando seu IP local ($myIp)..."
        az sql server firewall-rule create `
            --resource-group $ResourceGroup `
            --server $ServerName `
            --name "AllowClientIP" `
            --start-ip-address $myIp `
            --end-ip-address $myIp `
            --output table
    }
} catch {
    Write-Host "Não foi possível detectar o IP público local automaticamente."
}

# 7. Criar Banco de Dados
Write-Host "4/4 Criando Banco de Dados '$DatabaseName' (Camada Basic)..." -ForegroundColor Yellow
$dbExists = az sql db show --name $DatabaseName --server $ServerName --resource-group $ResourceGroup 2>$null
if (-not $dbExists) {
    az sql db create `
        --resource-group $ResourceGroup `
        --server $ServerName `
        --name $DatabaseName `
        --service-objective "Basic" `
        --max-size "2GB" `
        --output table
    Write-Host "✅ Banco de dados criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Banco de dados já existente." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   🎉 BANCO DE DADOS NO AZURE CONFIGURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Adicione ao seu arquivo .env:" -ForegroundColor Cyan
Write-Host "AZURE_DB_HOST=`"$ServerName.database.windows.net`""
Write-Host "AZURE_DB_PORT=1433"
Write-Host "AZURE_DB_NAME=`"$DatabaseName`""
Write-Host "AZURE_DB_USER=`"$AdminUser`""
Write-Host "AZURE_DB_PASSWORD=`"$AdminPassword`""
Write-Host "AZURE_DB_SSL=true"
Write-Host ""
Write-Host "Para aplicar as tabelas:"
Write-Host "Abra o Portal Azure -> Banco de Dados SQL -> $DatabaseName -> Editor de Consultas -> Cole o arquivo azure_sql_setup.sql -> Clique em Executar."
