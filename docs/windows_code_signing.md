# Windows Code Signing

Forge Engine release builds must be signed to avoid `Unknown publisher` in SmartScreen.

Publisher/certificate name:

```text
Wersee Developers
```

Build with a certificate in the Windows certificate store:

```powershell
$env:FORGE_SIGN_CERT_THUMBPRINT = "<SHA1 thumbprint>"
npm run tauri:build
```

Or build with a PFX:

```powershell
$env:FORGE_SIGN_PFX_PATH = "C:\secure\wersee-developers.pfx"
$env:FORGE_SIGN_PFX_PASSWORD = "<password>"
npm run tauri:build
```

Local unsigned test build:

```powershell
npm run tauri:build:unsigned
```

Verify:

```powershell
Get-AuthenticodeSignature .\artifacts\windows\ForgeEngine.exe
```

Expected: `Status = Valid` and signer subject contains `Wersee Developers`.
