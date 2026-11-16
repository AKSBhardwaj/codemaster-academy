$ErrorActionPreference = 'Stop'
$projectPath = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot '../ReadingListApi/ReadingListApi.csproj'))
if (-not (Test-Path -LiteralPath $projectPath -PathType Leaf)) {
    throw 'ReadingListApi.csproj was not found. Keep this script inside the sample scripts folder.'
}
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw 'Install the 64-bit .NET 10 SDK before running this script.'
}

$securePassword = Read-Host 'The reading_app password you chose in Oracle setup' -AsSecureString
$plainPassword = $null
$connectionString = $null
$settings = $null
try {
    $plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
    # Match the simple password alphabet described by the SQL setup.
    # No quotes, semicolons or ampersands can enter the connection string.
    if ($plainPassword -cnotmatch '^[A-Za-z0-9!_]{12,30}$') {
        throw 'For this local exercise, use the same 12–30 character Oracle password made from letters, numbers, ! or _.'
    }
    $connectionString = "User Id=reading_app;Password=$plainPassword;Data Source=localhost:1521/FREEPDB1;"
    $settings = @{ 'ConnectionStrings:Oracle' = $connectionString } | ConvertTo-Json -Compress
    # With no key/value arguments, user-secrets reads JSON from stdin.
    # The password is not placed in command arguments, source files or typed shell history.
    $settings | & dotnet user-secrets set --project $projectPath
    if ($LASTEXITCODE -ne 0) { throw 'dotnet user-secrets did not save the setting.' }
    Write-Output 'Local Oracle setting saved. Development user-secrets are not encrypted.'
}
finally {
    if ($null -ne $securePassword) { $securePassword.Dispose() }
    $plainPassword = $null
    $connectionString = $null
    $settings = $null
    # .NET strings cannot be securely erased; keep this as a local development helper.
}
