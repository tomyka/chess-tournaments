$response = Invoke-WebRequest -Uri "http://localhost:3000/api/scrape" -Method POST -UseBasicParsing -Headers @{"Authorization"="Bearer test-secret"}
$json = $response.Content | ConvertFrom-Json
Write-Host "Message: $($json.message)"
Write-Host "Tournaments found: $($json.tournaments.Count)"
$sandrauga = $json.tournaments | Where-Object {$_.name -like "*Sandrauga*"}
if ($sandrauga) {
    Write-Host "FOUND Sandrauga!"
    Write-Host "  Name: $($sandrauga.name)"
    Write-Host "  ID: $($sandrauga.chessResultsId)"
    Write-Host "  Time Control: $($sandrauga.timeControl)"
} else {
    Write-Host "Sandrauga NOT in scrape response"
}
