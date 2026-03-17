# Block 6: UI Pages

Write-Host "=== BLOCK 6: UI PAGES ===" -ForegroundColor Cyan

$paths = @("/", "/login", "/projects", "/engineering/calculators")

foreach ($path in $paths) {
    Write-Host "`nChecking: $path..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost$path" -Method Get -UseBasicParsing
        Write-Host "    Status: $($response.StatusCode) - OK"
        if ($response.StatusCode -ne 200) {
            Write-Host "    WARN: Expected 200, got $($response.StatusCode)"
        }
    } catch {
        Write-Host "    ERROR: $($_.Exception.Response.StatusCode)"
    }
}

Write-Host "`n=== BLOCK 6: UI PAGES - COMPLETED ===" -ForegroundColor Green
