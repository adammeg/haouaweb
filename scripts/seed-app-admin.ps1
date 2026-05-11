$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$Password,
  [Parameter(Mandatory = $false)][string]$Name = "App Admin"
)

if ($Password.Length -lt 8) {
  throw "Password must be at least 8 characters"
}

$envPath = Join-Path (Get-Location) ".env"
if (-not (Test-Path $envPath)) {
  throw ".env not found at $envPath"
}

$mongoUri = (Select-String -Path $envPath -Pattern '^MONGODB_URI=' | Select-Object -First 1).Line.Split('=',2)[1].Trim()
$dbName = (Select-String -Path $envPath -Pattern '^MONGODB_DB_NAME=' | Select-Object -First 1).Line.Split('=',2)[1].Trim()

if (-not $mongoUri) { throw "MONGODB_URI missing in .env" }
if (-not $dbName) { $dbName = "hawae_md" }

Write-Host "Seeding app_admin in MongoDB..." -ForegroundColor Cyan
Write-Host "URI: $mongoUri" -ForegroundColor DarkGray
Write-Host "DB:  $dbName" -ForegroundColor DarkGray

node -e @"
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

(async () => {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB;
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const name = process.env.ADMIN_NAME.trim();
  const password = process.env.ADMIN_PASS;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const existing = await db.collection('doctors').findOne({ email }, { projection: { _id: 0, id: 1, email: 1, role: 1 }});
  if (existing) {
    console.log(JSON.stringify({ ok: true, alreadyExists: true, doctor: existing }, null, 2));
    await client.close();
    return;
  }

  const id = 'doc_admin_' + Date.now();
  const doc = {
    id,
    email,
    name,
    passwordHash: hashPassword(password),
    clinicId: null,
    role: 'app_admin',
    active: true,
    createdAt: new Date().toISOString(),
  };
  await db.collection('doctors').insertOne(doc);
  console.log(JSON.stringify({ ok: true, created: true, doctor: { id: doc.id, email: doc.email, role: doc.role } }, null, 2));
  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
"@ 
  --% 
  MONGO_URI="$mongoUri" MONGO_DB="$dbName" ADMIN_EMAIL="$Email" ADMIN_NAME="$Name" ADMIN_PASS="$Password"

