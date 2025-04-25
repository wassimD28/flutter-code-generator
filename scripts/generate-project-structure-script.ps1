# Flutter Template Structure Generator
# This script scans template files and updates the projectStructure section in config.json

# Parameters
param (
    [string]$configPath = "C:\Users\wassi\OneDrive\Documents\Projects\flutter-generator\config.json",
    [string]$templateFolderPath = "C:\Users\wassi\OneDrive\Documents\Projects\flutter-generator\src\templates",
    [switch]$Debug = $false,  # Debug switch
    [switch]$VerboseLog = $false  # More detailed logging
)

# Function to log debug information
function Write-DebugLog {
    param([string]$message)
    if ($Debug) {
        Write-Host "DEBUG: $message" -ForegroundColor Cyan
    }
}

# Function for more verbose logging (showing all files being processed)
function Write-VerboseLog {
    param([string]$message)
    if ($VerboseLog) {
        Write-Host "VERBOSE: $message" -ForegroundColor Gray
    }
}

# Improved function to convert file names to proper Title Case
function Get-PrettyName {
    param (
        [string]$name
    )
    
    # Special cases dictionary for acronyms and technical terms
    $specialCases = @{
        "di" = "Dependency Injection"
        "api" = "API"
        "api_client" = "API Client"
        "ui" = "UI"
        "ui_config" = "UI Configuration"
        "http" = "HTTP"
        "json" = "JSON"
        "xml" = "XML"
        "url" = "URL"
        "uri" = "URI"
        "sdk" = "SDK"
        "jwt" = "JWT"
        "oauth" = "OAuth"
        "rsa" = "RSA"
        "ssl" = "SSL"
        "tls" = "TLS"
        "db" = "Database"
        "app_notification_type" = "App Notification Type"
        "app_config" = "App Configuration"
        "app_typography" = "App Typography"
        "main_routes" = "Main Routes"
        "custom_app_bar" = "Custom App Bar"
        "alert_exit_app" = "Alert Exit"
    }
    
    # First check if the entire name is a special case
    if ($specialCases.ContainsKey($name.ToLower())) {
        return $specialCases[$name.ToLower()]
    }
    
    # Normalize the name: first replace camelCase with snake_case
    $normalizedName = ""
    for ($i = 0; $i -lt $name.Length; $i++) {
        $char = $name[$i]
        # If this is an uppercase letter and not the first character
        # and the previous character is not an uppercase letter or underscore
        if ([char]::IsUpper($char) -and $i -gt 0 -and -not ([char]::IsUpper($name[$i-1]) -or $name[$i-1] -eq '_')) {
            $normalizedName += "_" + $char
        } else {
            $normalizedName += $char
        }
    }
    
    # Convert to lowercase for consistent processing
    $normalizedName = $normalizedName.ToLower()
    
    # Split by underscores
    $words = $normalizedName -split '_'
    
    $result = @()
    foreach ($word in $words) {
        if ($specialCases.ContainsKey($word)) {
            $result += $specialCases[$word]
        } else {
            # Handle general case - capitalize first letter
            if ($word.Length -gt 0) {
                $result += (Get-Culture).TextInfo.ToTitleCase($word)
            }
        }
    }
    
    return ($result -join " ")
}

# Extract the meaningful component from the path for better naming
function Get-ComponentNameFromPath {
    param (
        [string]$path
    )
    
    # First normalize path separators
    $normalizedPath = $path -replace '\\', '/'
    
    # Get the file name without extension
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($normalizedPath)
    
    # Extract feature name from path
    $featureName = ""
    if ($normalizedPath -match 'features/([^/]+)') {
        $featureName = $Matches[1]
        # Normalize feature name (handle camelCase in folder names)
        $featureName = Get-PrettyName -name $featureName
    }
    
    # Get the pretty version of the file name
    $prettyFileName = Get-PrettyName -name $fileName
    
    # If the feature name is already part of the file name, don't repeat it
    if ($prettyFileName -match [regex]::Escape($featureName)) {
        return $prettyFileName
    }
    
    # Otherwise, combine them
    if ($featureName) {
        return "$featureName $prettyFileName"
    }
    
    return $prettyFileName
}

# Function to extract file name without extension
function Get-SafeFileName {
    param (
        [string]$name
    )
    
    try {
        # Try the standard method first
        return [System.IO.Path]::GetFileNameWithoutExtension($name)
    }
    catch {
        Write-DebugLog "Error extracting filename from '$name': $_"
        # Fallback to regex-based extraction
        $cleanName = $name -replace '\.hbs$|\.dart$|\.yaml$|\.json$|\.txt$|\.md$', ''
        # Remove any remaining file extensions
        $cleanName = $cleanName -replace '\.[^.]+$', ''
        # Replace illegal characters
        $cleanName = $cleanName -replace '[\\/:*?"<>|]', '_'
        Write-DebugLog "Cleaned filename: '$cleanName'"
        return $cleanName
    }
}

# Enhanced function to categorize a file based on its name and path
function Get-FileCategory {
    param (
        [string]$fileName,
        [string]$filePath
    )
    
    $lowerFileName = $fileName.ToLower()
    $lowerPath = $filePath.ToLower()
    
    # Check for specific files you mentioned as missing
    $specificFiles = @{
        "app_notification_type" = "core"
        "app_config" = "core"
        "app_typography" = "theme"
        "custom_app_bar" = "widgets"
        "main_routes" = "core"
    }
    
    # First check for exact matches of specific files
    foreach ($key in $specificFiles.Keys) {
        if ($lowerFileName -eq $key) {
            return $specificFiles[$key]
        }
    }
    
    # Check for config files first - they should be categorized as core
    if ($lowerPath -match '/config/' -or $lowerFileName -match 'config') {
        return "core"
    }
    
    # Then check for specific patterns in the file name
    if (($lowerFileName -eq "main") -and ($lowerPath -match "^lib/main\.dart$")) {
        return "entry"  # Only exact match for lib/main.dart should be entry
    }
    elseif ($lowerFileName -match 'screen' -or $lowerFileName -match 'page' -or $lowerFileName -match 'view') {
        return "screens"
    }
    elseif ($lowerFileName -match 'widget' -or $lowerFileName -match 'component' -or $lowerFileName -match 'app_bar') {
        # Decide between shared_widgets and widgets
        if ($lowerPath -match '/shared/' -or $lowerPath -match '/common/') {
            return "shared_widgets"
        }
        return "widgets"
    }
    elseif ($lowerFileName -match 'button') {
        return "button_components"
    }
    elseif ($lowerFileName -match 'controller') {
        # Decide between shared_controllers and controllers
        if ($lowerPath -match '/shared/' -or $lowerPath -match '/common/') {
            return "shared_controllers"
        }
        return "controllers"
    }
    elseif ($lowerFileName -match 'model' -or $lowerFileName -match 'dto' -or $lowerFileName -match 'entity') {
        return "models"
    }
    elseif ($lowerFileName -match 'repository' -or $lowerFileName -match 'repo') {
        return "repositories"
    }
    elseif ($lowerFileName -match 'service' -or $lowerFileName -match 'provider') {
        return "services"
    }
    elseif ($lowerFileName -match 'binding' -or $lowerFileName -match 'binder') {
        return "bindings"
    }
    elseif ($lowerFileName -match 'theme' -or $lowerFileName -match 'style' -or $lowerFileName -match 'color' -or $lowerFileName -match 'typography') {
        return "theme"
    }
    elseif ($lowerFileName -match 'util' -or $lowerFileName -match 'helper' -or $lowerFileName -match 'formatter' -or $lowerFileName -match 'extension') {
        return "utils"
    }
    elseif ($lowerFileName -match 'di' -or $lowerFileName -match 'injection' -or $lowerFileName -match 'locator') {
        return "dependency_injection"
    }
    elseif ($lowerFileName -match 'main' -or $lowerFileName -match 'app') {
        return "entry"
    }
    elseif ($lowerFileName -match 'config' -or $lowerFileName -match 'pubspec' -or $lowerFileName -match 'manifest') {
        return "project_config"
    }
    
    # Then check paths (lower priority)
    if ($lowerPath -match '/screen/' -or $lowerPath -match '/page/' -or $lowerPath -match '/views/') {
        return "screens"
    }
    elseif ($lowerPath -match '/widget/' -or $lowerPath -match '/component/') {
        if ($lowerPath -match '/shared/' -or $lowerPath -match '/common/') {
            return "shared_widgets"
        }
        return "widgets"
    }
    elseif ($lowerPath -match '/button') {
        return "button_components"
    }
    elseif ($lowerPath -match '/controller/') {
        if ($lowerPath -match '/shared/' -or $lowerPath -match '/common/') {
            return "shared_controllers"
        }
        return "controllers"
    }
    elseif ($lowerPath -match '/model/' -or $lowerPath -match '/dto/') {
        return "models"
    }
    elseif ($lowerPath -match '/repository/' -or $lowerPath -match '/repo/') {
        return "repositories"
    }
    elseif ($lowerPath -match '/service/' -or $lowerPath -match '/provider/') {
        return "services"
    }
    elseif ($lowerPath -match '/binding/') {
        return "bindings"
    }
    elseif ($lowerPath -match '/theme/' -or $lowerPath -match '/style/') {
        return "theme"
    }
    elseif ($lowerPath -match '/util/' -or $lowerPath -match '/helper/') {
        return "utils"
    }
    elseif ($lowerPath -match '/di/' -or $lowerPath -match '/injection/') {
        return "dependency_injection"
    }
    elseif ($lowerPath -match '/core/') {
        return "core"
    }
    
    # Default category
    return "core"
}

# Function to normalize path separators
function Get-NormalizedPath {
    param (
        [string]$path
    )
    
    # Replace backslashes with forward slashes for consistency
    return $path -replace '\\', '/'
}

# Function to check for specific missing files
function Test-SpecificFiles {
    param (
        [string]$templatePath,
        [array]$filesList
    )
    
    # Files to specifically check for
    $filesToCheck = @(
        "lib/app/core/config/app_notification_type.dart.hbs",
        "lib/app/core/config/app_config.dart.hbs",
        "lib/app/core/theme/app_typography.dart.hbs",
        "lib/features/home/views/widgets/custom_app_bar.dart.hbs",
        "lib/app/core/config/main_routes.dart.hbs"
        "lib/app/core/utils/alert_exit_app.dart"
    )
    
    Write-Host "Checking for specific files:" -ForegroundColor Yellow
    
    foreach ($fileToCheck in $filesToCheck) {
        $fullPath = Join-Path -Path $templatePath -ChildPath $fileToCheck
        
        if (Test-Path $fullPath) {
            Write-Host "  - File exists: $fileToCheck" -ForegroundColor Green
            
            # Check if it's in the processed list
            $found = $false
            foreach ($file in $filesList) {
                $relativePath = $file.FullName.Substring($templatePath.Length + 1)
                $normalizedPath = Get-NormalizedPath -path $relativePath
                
                if ($normalizedPath -eq $fileToCheck) {
                    $found = $true
                    Write-Host "    - File is in processing list" -ForegroundColor Green
                    break
                }
            }
            
            if (-not $found) {
                Write-Host "    - WARNING: File exists but is NOT in processing list!" -ForegroundColor Red
            }
        } else {
            Write-Host "  - File NOT found: $fileToCheck" -ForegroundColor Red
        }
    }
}

# Function to scan template files
function Get-TemplateFiles {
    param (
        [string]$templateFolderPath
    )

    # Check if template folder exists
    if (-not (Test-Path $templateFolderPath)) {
        Write-Error "Template folder not found at path: $templateFolderPath"
        exit 1
    }

    Write-Host "Scanning template files in: $templateFolderPath"

    # Get all files recursively
    $files = Get-ChildItem -Path $templateFolderPath -File -Recurse
    
    # Check for specific files we want to ensure are processed
    Test-SpecificFiles -templatePath $templateFolderPath -filesList $files

    # Create structure exactly as specified
    $projectStructure = @{
        core = @()
        services = @()
        theme = @()
        utils = @()
        dependency_injection = @()
        shared_controllers = @()
        shared_widgets = @()
        button_components = @()
        controllers = @()
        models = @()
        repositories = @()
        bindings = @()
        screens = @()
        widgets = @()
        project_config = @()
        entry = @{
            name = "Main"
            path = "lib/main.dart"
        }  # Initialize with correct values directly
    }
    
    $totalFiles = $files.Count
    $processedCount = 0
    $missingFiles = @(
        "lib/app/core/config/app_notification_type.dart",
        "lib/app/core/config/app_config.dart",
        "lib/app/core/theme/app_typography.dart",
        "lib/features/home/views/widgets/custom_app_bar.dart",
        "lib/app/core/config/main_routes.dart"
        "lib/app/core/utils/alert_exit_app.dart"
    )
    
    # Track found files from the missing list
    $foundMissingFiles = @{}
    foreach ($file in $missingFiles) {
        $foundMissingFiles[$file] = $false
    }
    
    Write-Host "Found $totalFiles files to process"
    
    # Track processed paths to verify everything is included
    $processedPaths = @{}
    
    foreach ($file in $files) {
        $processedCount++
        
        # Show progress every 10 files
        if ($processedCount % 10 -eq 0 -or $processedCount -eq $totalFiles) {
            Write-Host "Processed $processedCount of $totalFiles files ($(($processedCount*100)/$totalFiles)%)"
        }
        
        # Get the relative path from the template folder
        $relativePath = $file.FullName.Substring($templateFolderPath.Length + 1)
        
        # Normalize path separators for consistency
        $normalizedPath = Get-NormalizedPath -path $relativePath
        
        # Check if this is one of our missing files
        $pathWithoutHbs = $normalizedPath -replace '\.hbs$', ''
        foreach ($missingFile in $missingFiles) {
            if ($pathWithoutHbs -eq $missingFile) {
                Write-Host "Found missing file: $missingFile" -ForegroundColor Green
                $foundMissingFiles[$missingFile] = $true
            }
        }
        
        # Track processed paths
        $processedPaths[$normalizedPath] = $true
        
        # Remove .hbs extension if present
        $normalizedPath = $normalizedPath -replace '\.hbs$', ''
        
        # Generate better name using both the feature name and component type
        $prettyName = Get-ComponentNameFromPath -path $normalizedPath
        
        # Create item with pretty name
        $item = @{
            name = $prettyName
            path = $normalizedPath
        }
        
        Write-VerboseLog "Processing file: $($file.Name) -> $($item.name) at $normalizedPath"
        
        # Get file name without extension for categorization
        $fileName = Get-SafeFileName $file.Name
        
        # Categorize the file
        $category = Get-FileCategory -fileName $fileName -filePath $normalizedPath
        
        # Add to appropriate category BUT protect entry from being overwritten
        if ($category -eq "entry" -and $normalizedPath -eq "lib/main.dart") {
            # Set the entry explicitly
            $projectStructure.entry = @{
                name = "Main"
                path = "lib/main.dart"
            }
            Write-DebugLog "Set main entry file: $($item.path)"
        } 
        elseif ($category -eq "entry") {
            # Skip other "entry" categorized files
            Write-DebugLog "Found another entry-like file but using default entry configuration: $($item.path)"
        }
        else {
            $projectStructure[$category] += $item
            Write-DebugLog "Added to $category : $($item.path)"
        }
    }
    
    # Check and report any missing files that were not found
    $stillMissing = $false
    foreach ($key in $foundMissingFiles.Keys) {
        if (-not $foundMissingFiles[$key]) {
            Write-Host "WARNING: Still missing file: $key" -ForegroundColor Red
            $stillMissing = $true
        }
    }
    
    if (-not $stillMissing) {
        Write-Host "All previously missing files were found and processed!" -ForegroundColor Green
    }
    
    # Print category summary
    Write-Host "Categorization summary:"
    foreach ($category in $projectStructure.Keys | Sort-Object) {
        if ($category -eq "entry") {
            Write-Host "- Entry: $(if ($projectStructure.entry) { '1' } else { '0' }) file"
        } else {
            Write-Host "- $((Get-Culture).TextInfo.ToTitleCase($category.Replace('_', ' '))): $($projectStructure[$category].Count) files"
        }
    }
    
    # Verify all specific files are categorized
    Write-Host "Verifying specific files categorization:" -ForegroundColor Yellow
    $specificPaths = @(
        @{ Path = "lib/app/core/config/app_notification_type.dart"; ExpectedCategory = "core" },
        @{ Path = "lib/app/core/config/app_config.dart"; ExpectedCategory = "core" },
        @{ Path = "lib/app/core/theme/app_typography.dart"; ExpectedCategory = "theme" },
        @{ Path = "lib/features/home/views/widgets/custom_app_bar.dart"; ExpectedCategory = "widgets" },
        @{ Path = "lib/app/core/config/main_routes.dart"; ExpectedCategory = "core" }
        @{ Path = "lib//app/core/utils/alert_exit_app.dart"; ExpectedCategory = "widgets" }
    )
    
    foreach ($specificPath in $specificPaths) {
        $path = $specificPath.Path
        $expectedCategory = $specificPath.ExpectedCategory
        $found = $false
        
        foreach ($item in $projectStructure[$expectedCategory]) {
            if ($item.path -eq $path) {
                Write-Host "  - Found correctly categorized: $path in $expectedCategory" -ForegroundColor Green
                $found = $true
                break
            }
        }
        
        if (-not $found) {
            Write-Host "  - NOT found in expected category: $path in $expectedCategory" -ForegroundColor Red
            
            # Search other categories
            foreach ($category in $projectStructure.Keys) {
                if ($category -eq "entry") { continue }
                
                foreach ($item in $projectStructure[$category]) {
                    if ($item.path -eq $path) {
                        Write-Host "    - Found instead in: $category" -ForegroundColor Yellow
                    }
                }
            }
        }
    }
    
    # Add missing specific files if needed
    foreach ($specificPath in $specificPaths) {
        $path = $specificPath.Path
        $expectedCategory = $specificPath.ExpectedCategory
        $found = $false
        
        foreach ($item in $projectStructure[$expectedCategory]) {
            if ($item.path -eq $path) {
                $found = $true
                break
            }
        }
        
        if (-not $found) {
            Write-Host "Adding missing specific file: $path to $expectedCategory" -ForegroundColor Yellow
            $fileName = [System.IO.Path]::GetFileNameWithoutExtension($path)
            $prettyName = Get-PrettyName -name $fileName
            
            $newItem = @{
                name = $prettyName
                path = $path
            }
            
            $projectStructure[$expectedCategory] += $newItem
        }
    }
    
    return $projectStructure
}

# Main execution begins here
try {
    Write-Host "Starting template scanner..." -ForegroundColor Green
    
    # Check if config file exists
    $configExists = Test-Path $configPath
    $originalConfig = $null

    if ($configExists) {
        # Read existing config
        $originalConfigText = Get-Content -Path $configPath -Raw
        try {
            $originalConfig = $originalConfigText | ConvertFrom-Json
            Write-Host "Reading existing config file: $configPath"
        } catch {
            Write-Host "Error parsing existing config JSON, will create new: $_" -ForegroundColor Yellow
            $originalConfig = [PSCustomObject]@{}
        }
    } else {
        Write-Host "Config file does not exist. Will create a new one: $configPath"
        $originalConfig = [PSCustomObject]@{}
    }

    # Scan template files
    Write-Host "Scanning template files in $templateFolderPath..."
    $projectStructure = Get-TemplateFiles -templateFolderPath $templateFolderPath
    Write-Host "Template scan completed successfully" -ForegroundColor Green

    # Create PSCustomObject for JSON serialization
    $psProjectStructure = [PSCustomObject]@{}
    foreach ($key in $projectStructure.Keys) {
        $value = $projectStructure[$key]
        if ($key -eq "entry") {
            # Special handling for entry which is an object, not an array
            $psProjectStructure | Add-Member -MemberType NoteProperty -Name $key -Value $value
        }
        elseif ($value -is [System.Collections.IEnumerable] -and $value -isnot [string]) {
            # Process arrays
            $psObjects = foreach ($item in $value) {
                if ($null -ne $item) {
                    [PSCustomObject]@{
                        name = $item.name
                        path = $item.path
                    }
                }
            }
            $psProjectStructure | Add-Member -MemberType NoteProperty -Name $key -Value $psObjects
        } 
        else {
            $psProjectStructure | Add-Member -MemberType NoteProperty -Name $key -Value $value
        }
    }
    # This ensures entry has correct values even if something went wrong
    $projectStructure.entry = @{
        name = "Main"
        path = "lib/main.dart"
    }
    Write-DebugLog "Final validation: Setting entry to Main at lib/main.dart"

    # Create or update projectStructure property
    $originalConfig | Add-Member -MemberType NoteProperty -Name "projectStructure" -Value $psProjectStructure -Force

    # Convert to JSON and save back
    Write-Host "Writing updated config to $configPath..."
    $originalConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath

    Write-Host "Done! Template structure has been successfully updated in config.json" -ForegroundColor Green
} catch {
    Write-Error "An error occurred: $_"
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}