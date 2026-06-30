# Script para configurar Git local
$gitPath = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $gitPath = "C:\Program Files\Git\cmd\git.exe"
}

Write-Host "Utilizando o Git em: $gitPath"

# Inicializa
& $gitPath init

# Configura o remote
& $gitPath remote remove origin 2>$null
& $gitPath remote add origin https://github.com/leonardodonadoni168-hue/Sabotagem-sintaxe.git

# Configura email e nome locais se não existirem no global
$hasEmail = $null
try {
    $hasEmail = & $gitPath config --global user.email
} catch {}

if (-not $hasEmail) {
    & $gitPath config user.email "aluno@computacao.edu.br"
    & $gitPath config user.name "AlgoBot Developer"
    Write-Host "Configurado e-mail e nome local temporários para o commit."
}

# Staging e Commit
& $gitPath add .
& $gitPath commit -m "Initial commit: Jogo educacional AlgoBot - Sabotagem e Sintaxe"
& $gitPath branch -M main

Write-Host "Repositório inicializado e commit de início concluído localmente!"
