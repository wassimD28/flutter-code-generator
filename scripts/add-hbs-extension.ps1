# Define the path to your templates directory
# Update this path to match your actual templates directory location
$templatesPath = "C:\Users\wassi\OneDrive\Documents\Projects\flutter-generator\src\templates"

# Get all files in the templates directory and its subdirectories that don't end with .hbs
$filesToRename = Get-ChildItem -Path $templatesPath -Recurse -File | Where-Object { $_.Extension -ne ".hbs" }

# Initialize counters for reporting
$totalFiles = $filesToRename.Count
$renamedCount = 0

Write-Host "Found $totalFiles files that need .hbs extension added."

# For each file, rename it to add the .hbs extension
foreach ($file in $filesToRename) {
    $newName = $file.FullName + ".hbs"
    
    try {
        # Rename the file
        Rename-Item -Path $file.FullName -NewName $newName -ErrorAction Stop
        $renamedCount++
        
        # Show progress
        Write-Host "Renamed: $($file.FullName) to $newName" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to rename: $($file.FullName). Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Report results
Write-Host "`nRenaming complete!" -ForegroundColor Cyan
Write-Host "Successfully renamed $renamedCount out of $totalFiles files." -ForegroundColor Cyan
