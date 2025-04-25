# Script to replace 'store_go' package names with '{{ snakeCase appName }}' in .dart.hbs files
# Usage: Run this script from the command line with PowerShell

# Define the root directory path - change this to your actual path
$templatesDir = "C:\Users\wassi\OneDrive\Documents\Projects\flutter-generator\src\templates"

# Check if the directory exists
if (-not (Test-Path -Path $templatesDir -PathType Container)) {
    Write-Error "Directory not found: $templatesDir"
    exit 1
}

# Counter variables to track our progress
$filesProcessed = 0
$filesModified = 0
$replacementsCount = 0

# Get all .dart.hbs files in the templates directory and its subdirectories
Write-Host "Searching for .dart.hbs files in $templatesDir..."
$dartHbsFiles = Get-ChildItem -Path $templatesDir -Filter "*.dart.hbs" -Recurse

# Check if any files were found
if ($dartHbsFiles.Count -eq 0) {
    Write-Host "No .dart.hbs files found in the directory."
    exit 0
}

Write-Host "Found $($dartHbsFiles.Count) .dart.hbs files."

# Process each file
foreach ($file in $dartHbsFiles) {
    $filesProcessed++
    Write-Host "Processing file ($filesProcessed/$($dartHbsFiles.Count)): $($file.FullName)"
    
    # Read the file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if the file contains 'store_go' as a package name
    if ($content -match "package:store_go/") {
        # Replace all occurrences of 'package:store_go/' with 'package:{{ snakeCase appName }}/'
        $newContent = $content -replace "package:store_go/", "package:{{ snakeCase appName }}/"
        
        # Count the number of replacements
        $matchResults = [regex]::Matches($content, "package:store_go/")
        $currentReplacements = $matchResults.Count
        $replacementsCount += $currentReplacements
        
        # Write the modified content back to the file
        Set-Content -Path $file.FullName -Value $newContent
        
        $filesModified++
        Write-Host "  Modified file with $currentReplacements replacements." -ForegroundColor Green
    } else {
        Write-Host "  No 'store_go' package imports found in this file." -ForegroundColor Yellow
    }
}

# Final summary
Write-Host "`nOperation completed successfully!" -ForegroundColor Cyan
Write-Host "Files processed: $filesProcessed"
Write-Host "Files modified: $filesModified"
Write-Host "Total replacements made: $replacementsCount"