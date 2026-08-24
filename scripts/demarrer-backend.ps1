<#
    Demarre le backend Spring Boot avec la configuration derivee de
    report-engine/.env.

    Pourquoi ce script : la chaine Neon `postgresql://user:pass@hote/base?...`
    doit etre eclatee en trois variables distinctes pour Spring
    (DB_URL au format JDBC, DB_USER, DB_PASSWORD). Le faire a la main a chaque
    lancement est une source d'erreur silencieuse — un mot de passe contenant
    un caractere special et la connexion echoue sans message clair.

    Aucun secret n'est affiche a l'ecran ni ecrit sur disque.
#>

$ErrorActionPreference = 'Stop'

$racine = Split-Path -Parent $PSScriptRoot
$fichierEnv = Join-Path $racine 'report-engine\.env'

if (-not (Test-Path $fichierEnv)) {
    throw "report-engine\.env introuvable. Copiez report-engine\.env.example et renseignez-le."
}

# Lecture des cles utiles
$valeurs = @{}
foreach ($ligne in Get-Content $fichierEnv) {
    if ($ligne -match '^\s*([A-Z_]+)\s*=\s*(.*)$') {
        $valeurs[$Matches[1]] = $Matches[2].Trim()
    }
}

if (-not $valeurs.ContainsKey('DATABASE_URL')) { throw "DATABASE_URL absente de report-engine\.env" }

# postgresql://utilisateur:motdepasse@hote/base?parametres
$url = $valeurs['DATABASE_URL']
if ($url -notmatch '^postgres(ql)?://([^:]+):([^@]+)@([^/]+)/([^?]+)(\?.*)?$') {
    throw "DATABASE_URL non reconnue. Format attendu : postgresql://utilisateur:motdepasse@hote/base?sslmode=require"
}

$utilisateur = [System.Uri]::UnescapeDataString($Matches[2])
$motDePasse  = [System.Uri]::UnescapeDataString($Matches[3])
$hote        = $Matches[4]
$base        = $Matches[5]
$parametres  = $Matches[6]

$env:DB_URL      = "jdbc:postgresql://$hote/$base$parametres"
$env:DB_USER     = $utilisateur
$env:DB_PASSWORD = $motDePasse

# Le secret de signature est repris du moteur quand il y figure : changer de
# secret invaliderait toutes les sessions ouvertes sans raison.
if ($valeurs.ContainsKey('JWT_SECRET') -and $valeurs['JWT_SECRET'].Length -ge 32) {
    $env:JWT_SECRET = $valeurs['JWT_SECRET']
} else {
    throw "JWT_SECRET absent ou trop court (32 caracteres minimum) dans report-engine\.env"
}

# Jeton partage : il DOIT etre identique des deux cotes, sinon le backend ne
# peut plus commander de generation au moteur.
if (-not $valeurs.ContainsKey('REPORT_ENGINE_TOKEN')) {
    throw "REPORT_ENGINE_TOKEN absent de report-engine\.env"
}
$env:REPORT_ENGINE_TOKEN = $valeurs['REPORT_ENGINE_TOKEN']
$env:REPORT_ENGINE_URL   = 'http://localhost:3001'

$env:CORS_ORIGIN   = 'http://localhost:5173'
$env:SERVER_PORT   = '8080'
# Mode par defaut : aucune configuration PayPal necessaire pour demarrer.
# Basculez sur 'paypal' apres avoir renseigne PAYPAL_CLIENT_ID / _SECRET.
#
# Les identifiants sont lus dans report-engine\.env, comme le reste de la
# configuration : un seul fichier a editer, et aucun secret en clair dans ce
# script ni dans l'historique du terminal.
foreach ($cle in @('PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_ENV',
                   'PAYPAL_CURRENCY', 'PAYPAL_TAUX_TND', 'PAYPAL_LOCALE',
                   'PAYPAL_WEBHOOK_ID', 'PAIEMENT_MODE', 'DEVISE')) {
    if ($valeurs.ContainsKey($cle) -and $valeurs[$cle]) {
        Set-Item -Path "env:$cle" -Value $valeurs[$cle]
    }
}

# Le mode reel exige les deux identifiants : sans eux, le backend basculerait
# de lui-meme en simulation, mais autant le dire ici plutot que de le
# decouvrir en cliquant sur un bouton de paiement.
if ($env:PAIEMENT_MODE -eq 'paypal' -and
    (-not $env:PAYPAL_CLIENT_ID -or -not $env:PAYPAL_CLIENT_SECRET)) {
    Write-Warning "PAIEMENT_MODE=paypal mais PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET manquent dans report-engine\.env. Le backend repassera en simulation."
}
if (-not $env:PAIEMENT_MODE) { $env:PAIEMENT_MODE = 'simulation' }

# Le JDK doit correspondre a la cible declaree dans backend/pom.xml.
# Figer une version precise a deja casse ce script une fois : la montee du
# projet de Java 17 a Java 25 l'a rendu obsolete du jour au lendemain. On lit
# donc la cible dans le pom, puis on cherche un JDK au moins equivalent.
$pom = Join-Path $racine 'backend\pom.xml'
$cible = 17
if ((Get-Content $pom -Raw) -match '<java\.version>\s*(\d+)\s*</java\.version>') {
    $cible = [int]$Matches[1]
}

$racinesJdk = @(
    (Join-Path $env:USERPROFILE '.jdk'),
    'C:\Program Files\Eclipse Adoptium',
    'C:\Program Files\Java',
    'C:\Program Files\Microsoft'
)

$retenu = $null
foreach ($racineJdk in $racinesJdk) {
    if (-not (Test-Path $racineJdk)) { continue }
    $trouves = Get-ChildItem $racineJdk -Recurse -Depth 3 -Filter 'javac.exe' -ErrorAction SilentlyContinue |
        ForEach-Object { Split-Path (Split-Path $_.FullName -Parent) -Parent }
    foreach ($jdk in ($trouves | Sort-Object -Unique -Descending)) {
        if ($jdk -match 'jdk[-_]?(\d+)' -and [int]$Matches[1] -ge $cible) {
            $retenu = $jdk
            break
        }
    }
    if ($retenu) { break }
}

if ($retenu) {
    $env:JAVA_HOME = $retenu
} elseif (-not $env:JAVA_HOME) {
    throw "Aucun JDK $cible ou superieur trouve. Le projet cible Java $cible (backend/pom.xml)."
} else {
    Write-Warning "Aucun JDK $cible+ detecte ; JAVA_HOME actuel conserve. La compilation echouera s'il est trop ancien."
}
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "JDK     : $env:JAVA_HOME (cible Java $cible)" -ForegroundColor DarkGray
Write-Host "Base    : $hote/$base" -ForegroundColor DarkGray
Write-Host "Paiement: $env:PAIEMENT_MODE" -ForegroundColor DarkGray
Write-Host "API     : http://localhost:8080/api" -ForegroundColor Green
Write-Host "Swagger : http://localhost:8080/swagger-ui.html" -ForegroundColor Green
Write-Host ""

Push-Location (Join-Path $racine 'backend')
try {
    & .\mvnw.cmd spring-boot:run
} finally {
    Pop-Location
}
