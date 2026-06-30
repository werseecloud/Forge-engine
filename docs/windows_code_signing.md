# Windows Code Signing

Forge Engine release builds must be Authenticode signed before distribution.
Unsigned binaries show Microsoft Defender SmartScreen as `Unknown publisher`.

## Publisher

Use a production code-signing certificate issued to:

```text
Wersee Developers
```

The Tauri Windows metadata also uses `Wersee Developers` as the bundle publisher and Windows resource company name.

## Certificate Options

Preferred certificate store configuration:

```powershell
$env:FORGE_SIGN_CERT_THUMBPRINT = "<SHA1 certificate thumbprint>"
npm run tauri:build
```

If the certificate is installed in the Local Machine store:

```powershell
$env:FORGE_SIGN_CERT_THUMBPRINT = "<SHA1 certificate thumbprint>"
$env:FORGE_SIGN_CERT_STORE = "LocalMachine"
npm run tauri:build
```

PFX configuration:

```powershell
$env:FORGE_SIGN_PFX_PATH = "C:\secure\wersee-developers-code-signing.pfx"
$env:FORGE_SIGN_PFX_PASSWORD = "<password>"
npm run tauri:build
```

Optional timestamp override:

```powershell
$env:FORGE_SIGN_TIMESTAMP_URL = "http://timestamp.digicert.com"
```

## Local Unsigned Builds

Only use unsigned builds for local testing:

```powershell
npm run tauri:build:unsigned
npm run tauri:build:editor:unsigned
```

Unsigned builds are expected to trigger SmartScreen and must not be uploaded as public release artifacts.

## Verification

Verify the built executable:

```powershell
Get-AuthenticodeSignature .\artifacts\windows\ForgeEngine.exe | Format-List
```

Expected result:

```text
Status: Valid
SignerCertificate.Subject: ... Wersee Developers ...
```

SmartScreen reputation is controlled by Microsoft. A valid EV/OV certificate and repeated clean downloads improve reputation, but a brand-new certificate or binary can still receive extra warning prompts until it gains reputation.
