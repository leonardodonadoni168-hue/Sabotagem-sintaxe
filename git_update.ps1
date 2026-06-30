# Script para commitar as atualizações do GDD no repositório local
$gitPath = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $gitPath = "C:\Program Files\Git\cmd\git.exe"
}

Write-Host "Utilizando o Git em: $gitPath"

# Adiciona arquivos e commita
& $gitPath add .
& $gitPath commit -m "Update SyntaxError: Implementação completa das mecânicas do GDD, habilidades de cargos, chaves e portas, e relatórios didáticos pós-partida."

Write-Host "Arquivos commitados com sucesso localmente!"
