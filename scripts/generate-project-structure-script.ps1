# Flutter Template Structure Generator
# This script scans template files and updates the projectStructure section in config.json

# Parameters
param (
    [string]$configPath = "C:\Users\wassi\OneDrive\Documents\Projects\flutter-generator\config.json",
    [string]$templateFolderPath = "C:\Users\wassi\OneDrive\Documents\Projects\flutter-generator\src\templates",
    [switch]$Debug = $false  # Debug switch
)

# Function to log debug information
function Write-DebugLog {
    param([string]$message)
    if ($Debug) {
        Write-Host "DEBUG: $message" -ForegroundColor Cyan
    }
}

# Fixed function to convert file names to proper Title Case
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

# Function to categorize a file based on its name and path
function Get-FileCategory {
    param (
        [string]$fileName,
        [string]$filePath
    )
    
    $lowerFileName = $fileName.ToLower()
    $lowerPath = $filePath.ToLower()
    
    # Specifically check for main.dart to categorize as entry
    # All other files should be categorized differently
    if (($lowerFileName -eq "main") -and ($lowerPath -match "^lib/main\.dart$")) {
        return "entry"  # Only exact match for lib/main.dart should be entry
    }
    elseif ($lowerFileName -match 'screen' -or $lowerFileName -match 'page' -or $lowerFileName -match 'view') {
        return "screens"
    }
    elseif ($lowerFileName -match 'widget' -or $lowerFileName -match 'component') {
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
    elseif ($lowerFileName -match 'theme' -or $lowerFileName -match 'style' -or $lowerFileName -match 'color') {
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
    
    Write-Host "Found $totalFiles files to process"
    
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
        
        # Remove .hbs extension if present
        $normalizedPath = $normalizedPath -replace '\.hbs$', ''
        
        # Generate better name using both the feature name and component type
        $prettyName = Get-ComponentNameFromPath -path $normalizedPath
        
        # Create item with pretty name
        $item = @{
            name = $prettyName
            path = $normalizedPath
        }
        
        Write-DebugLog "Processing file: $($file.Name) -> $($item.name) at $normalizedPath"
        
        # Get file name without extension for categorization
        $fileName = Get-SafeFileName $file.Name
        
        # Categorize the file
        $category = Get-FileCategory -fileName $fileName -filePath $normalizedPath
        
        # Add to appropriate category BUT protect entry from being overwritten
        if ($category -eq "entry") {
            # Option 1: Skip adding other files as entry
            Write-DebugLog "Found a main entry file but using default entry configuration"
            # Do not modify the entry property
        } else {
            $projectStructure[$category] += $item
            Write-DebugLog "Added to $category : $($item.path)"
        }
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