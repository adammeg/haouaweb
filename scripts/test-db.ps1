$ErrorActionPreference = "Stop"

$base = "http://localhost:3000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$guid = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$email = "test_$guid@hawae.local"

Write-Host "Testing signup/login against $base" -ForegroundColor Cyan
Write-Host "Email: $email"

$signupBody = @{
  name     = "Dr Test"
  email    = $email
  password = "password123"
} | ConvertTo-Json

$signup = Invoke-RestMethod `
  -Method Post `
  -Uri "$base/api/auth/signup" `
  -ContentType "application/json" `
  -Body $signupBody `
  -WebSession $session

Write-Host "Signup ok: $($signup.ok)" -ForegroundColor Green

$me = Invoke-RestMethod -Method Get -Uri "$base/api/auth/me" -WebSession $session
Write-Host "Session doctor: $($me.doctor.email)" -ForegroundColor Green

Write-Host "Testing workspace GET/PUT/GET (Mongo workspaces collection)" -ForegroundColor Cyan

$ws1 = Invoke-RestMethod -Method Get -Uri "$base/api/workspace/state" -WebSession $session
Write-Host ("Workspace empty (first): " + $ws1.empty)

$state = @{
  users          = @(@{ id = "user_default"; name = "Medecin"; role = "chef"; color = "#0d6e6e"; initials = "MD" })
  currentUserId  = "user_default"
  patientsByUser = @{}
  historyByUser  = @{}
  setupDone      = $false
  workspaceSavedAt = $null
} | ConvertTo-Json -Depth 30

$put = Invoke-RestMethod `
  -Method Put `
  -Uri "$base/api/workspace/state" `
  -ContentType "application/json" `
  -Body $state `
  -WebSession $session

Write-Host ("Workspace PUT ok: " + $put.ok + " updatedAt=" + $put.updatedAt) -ForegroundColor Green

$ws2 = Invoke-RestMethod -Method Get -Uri "$base/api/workspace/state" -WebSession $session
Write-Host ("Workspace empty (after): " + $ws2.empty + " updatedAt=" + $ws2.updatedAt) -ForegroundColor Green

Write-Host "DONE" -ForegroundColor Green

