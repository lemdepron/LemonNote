$i = 0
Get-Content src/lib/locales/zh.json | ForEach-Object { 
    $i++
    if ($_ -match '"insert":') { 
        Write-Host "${i}: $_" 
    } 
} | Select-Object -First 10