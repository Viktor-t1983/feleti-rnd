Write-Host " FELETI R&D Assistant Setup" -ForegroundColor Cyan
Write-Host "Project path: D:\Projects\feleti-rnd" -ForegroundColor Yellow
Write-Host ""

# Проверка зависимостей
Write-Host " Node.js: v24.13.0" -ForegroundColor Green
Write-Host " Python: Python 3.11.9" -ForegroundColor Green
Write-Host " Docker: Docker version 29.1.3, build f52814d" -ForegroundColor Green
Write-Host ""

# Создание .gitignore
if (!(Test-Path ".gitignore")) {
    'node_modules/
.venv/
venv/
.env
dist/
build/
*.db' | Out-File .gitignore -Encoding UTF8
    Write-Host " .gitignore created" -ForegroundColor Green
}

# Инициализация Git
if (!(Test-Path ".git")) {
    git init | Out-Null
    git add . | Out-Null
    git commit -m "Initial commit" --quiet
    Write-Host " Git repository initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host " Setup complete!" -ForegroundColor Green
Write-Host "Next: Install Roo Cline extension in VS Code" -ForegroundColor Yellow
