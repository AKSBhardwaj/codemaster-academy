param([string]$BaseUrl = 'http://localhost:5080')

$ErrorActionPreference = 'Stop'
$api = $BaseUrl.TrimEnd('/') + '/api/books'
$createdId = $null

function Send-Request {
    param([string]$Method, [string]$Uri, [object]$Body = $null)
    $parameters = @{ Uri = $Uri; Method = $Method; UseBasicParsing = $true; ErrorAction = 'Stop' }
    if ($null -ne $Body) {
        $parameters.ContentType = 'application/json'
        $parameters.Body = $Body | ConvertTo-Json -Compress
    }
    try {
        $response = Invoke-WebRequest @parameters
        return [pscustomobject]@{
            Status = [int]$response.StatusCode
            Content = $response.Content
            Headers = $response.Headers
        }
    }
    catch {
        if ($null -eq $_.Exception.Response) { throw }
        return [pscustomobject]@{
            Status = [int]$_.Exception.Response.StatusCode
            Content = $_.ErrorDetails.Message
            Headers = @{}
        }
    }
}

function Assert-Status {
    param([object]$Response, [int]$Expected, [string]$Step)
    if ($Response.Status -ne $Expected) {
        throw "$Step expected HTTP $Expected, received $($Response.Status). $($Response.Content)"
    }
    Write-Output "PASS: $Step (HTTP $Expected)"
}

try {
    Assert-Status (Send-Request 'GET' ($BaseUrl.TrimEnd('/') + '/health')) 200 'API liveness'
    Assert-Status (Send-Request 'GET' $api) 200 'List books from Oracle'
    Assert-Status (Send-Request 'POST' $api @{ title = ''; isRead = $false }) 400 'Reject empty title'
    Assert-Status (Send-Request 'POST' $api @{ title = '   '; isRead = $false }) 400 'Reject spaces-only title'
    Assert-Status (Send-Request 'POST' $api @{ title = ('x' * 121); isRead = $false }) 400 'Reject long title'
    Assert-Status (Send-Request 'GET' "$api/0") 400 'Reject nonpositive ID'

    $title = "Learner's book " + [guid]::NewGuid().ToString('N').Substring(0, 8)
    $created = Send-Request 'POST' $api @{ title = $title; isRead = $false }
    Assert-Status $created 201 'Create book with an apostrophe'
    $book = $created.Content | ConvertFrom-Json
    $createdId = [long]$book.id
    if ($createdId -le 0) { throw 'The API did not return a positive generated ID.' }
    if ($book.title -ne $title -or $book.isRead -ne $false) { throw 'Created book did not match the request.' }
    if ([string]$created.Headers['Location'] -notmatch "/api/books/$createdId$") {
        throw 'Create did not return the expected Location header.'
    }

    Assert-Status (Send-Request 'GET' "$api/$createdId") 200 'Read the created book'
    Assert-Status (Send-Request 'PUT' "$api/$createdId" @{ title = $title; isRead = $true }) 204 'Mark book as read'
    $read = Send-Request 'GET' "$api/$createdId"
    Assert-Status $read 200 'Read the updated book'
    if (($read.Content | ConvertFrom-Json).isRead -ne $true) { throw 'The update was not stored.' }

    Assert-Status (Send-Request 'DELETE' "$api/$createdId") 204 'Delete only the test book'
    Assert-Status (Send-Request 'GET' "$api/$createdId") 404 'Deleted book is absent'
    Assert-Status (Send-Request 'PUT' "$api/$createdId" @{ title = $title; isRead = $true }) 404 'Update missing book'
    Assert-Status (Send-Request 'DELETE' "$api/$createdId") 404 'Delete missing book'
    $createdId = $null
    Write-Output 'All API checks passed against this Oracle setup.'
}
finally {
    if ($null -ne $createdId) {
        # Best-effort cleanup of this script's own record after a later check fails.
        try {
            $cleanup = Send-Request 'DELETE' "$api/$createdId"
            if ($cleanup.Status -notin @(204, 404)) {
                Write-Warning "Cleanup of test book $createdId returned HTTP $($cleanup.Status). Check the list."
            }
        }
        catch { Write-Warning "Could not remove this script's test book $createdId. Check the list." }
    }
}
