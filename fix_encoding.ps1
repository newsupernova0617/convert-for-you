# Fix encoding issues in HTML files - Simple version
$files = @(
    "public\aac.html",
    "public\admin.html", 
    "public\mov.html",
    "public\mp3.html",
    "public\mp4.html",
    "public\video-compress.html",
    "public\video-gif.html",
    "public\webm.html"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        try {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            
            # Simple string replacements
            $content = $content.Replace('bitrate/p>', 'bitrate</p>')
            $content = $content.Replace('Format 理/p>', 'Latest Format</p>')
            $content = $content.Replace('Office ??', 'Office to')
            
            # Save with UTF-8 BOM
            $utf8 = New-Object System.Text.UTF8Encoding $true
            [System.IO.File]::WriteAllText($filePath, $content, $utf8)
            
            Write-Host "Fixed: $file" -ForegroundColor Green
        }
        catch {
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
}

Write-Host "Done!" -ForegroundColor Green
