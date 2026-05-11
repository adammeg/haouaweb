$ErrorActionPreference = "Stop"

$base = "http://localhost:3000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$guid = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$email = "admin_$guid@hawae.local"

Write-Host "Clinic signup test against $base" -ForegroundColor Cyan
Write-Host "Admin email: $email"

$signupBody = @{
  clinicName = "Clinique Test"
  adminName  = "Dr Admin"
  email      = $email
  password   = "password123"
} | ConvertTo-Json

$signup = Invoke-RestMethod `
  -Method Post `
  -Uri "$base/api/clinic/signup" `
  -ContentType "application/json" `
  -Body $signupBody `
  -WebSession $session

Write-Host "Clinic ok: $($signup.ok) id=$($signup.clinic.id)" -ForegroundColor Green

$me = Invoke-RestMethod -Method Get -Uri "$base/api/auth/me" -WebSession $session
Write-Host "Session role: $($me.doctor.role) clinicId=$($me.doctor.clinicId)" -ForegroundColor Green

$docs = Invoke-RestMethod -Method Get -Uri "$base/api/clinic/doctors" -WebSession $session
Write-Host "Doctors count: $($docs.doctors.Count)" -ForegroundColor Green

Write-Host "DONE" -ForegroundColor Green

