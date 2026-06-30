# Script para realizar push para o GitHub
$gitPath = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $gitPath = "C:\Program Files\Git\cmd\git.exe"
}
& $gitPath push -u origin main
