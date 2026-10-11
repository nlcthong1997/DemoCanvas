# Demo deployment

Target environment: `268b8ad1-b6d1-ed49-b59a-d9bc85e9b99b`.
User-provided existing solution: `587e1496-3ec5-f111-a05a-002248ec830f`.

`XCLProfilePhoto` is a local unmanaged packaging solution for the PCF. It is **not yet confirmed to be the same solution** as the user-provided solution. Before an online deployment, inspect the existing solution's unique name and publisher and choose a compatible import/add-component path. Do not assume the local package name is the target solution name.

## Build

```powershell
dotnet build deployment\XCLProfilePhoto\XCLProfilePhoto.cdsproj --configuration Release -p:SolutionPackageType=Unmanaged
```

Generated ZIP: `deployment/XCLProfilePhoto/bin/Release/XCLProfilePhoto.zip`.

Prerequisites: .NET SDK, Node/npm, and network access to NuGet/npm for the first restore. The PCF reference is relative; no credentials are saved in this repository.

## Online prerequisites

1. Authenticate PAC with access to the target environment; use `pac auth create --name Personal-Demo --environment 268b8ad1-b6d1-ed49-b59a-d9bc85e9b99b` if needed.
2. Verify the active identity, environment, existing solution and publisher before import.
3. Enable PCF for Canvas in the environment if it is not already enabled.
4. A blank Canvas app must exist and be saved in the intended solution. Canvas authoring MCP requires an open Studio edit session with coauthoring enabled and .NET SDK 10 or later. PAC alone does not provide a live Canvas authoring connection.
5. Add the imported PCF to a screen, configure responsive width/height and validate both demo screens in Canvas.

This package is a UI feasibility demo with simulated submission. Backend upload is not implemented.

As of preparation: production ZIP builds successfully; online import and Canvas app creation have not been verified.
