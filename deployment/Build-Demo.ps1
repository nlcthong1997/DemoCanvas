$ErrorActionPreference = 'Stop'
$solutionProject = Join-Path $PSScriptRoot 'XCLProfilePhoto\XCLProfilePhoto.cdsproj'
& dotnet build $solutionProject --configuration Release -p:SolutionPackageType=Unmanaged
if ($LASTEXITCODE -ne 0) { throw 'Solution build failed.' }
$packagePath = Join-Path $PSScriptRoot 'XCLProfilePhoto\bin\Release\XCLProfilePhoto.zip'
Get-Item -LiteralPath $packagePath | Select-Object FullName, Length, LastWriteTime
