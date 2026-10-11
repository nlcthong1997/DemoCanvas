# Demo deployment

Target environment: `268b8ad1-b6d1-ed49-b59a-d9bc85e9b99b`.
User-provided existing solution: `587e1496-3ec5-f111-a05a-002248ec830f`.

`XCLProfilePhoto` is a local unmanaged packaging solution for the PCF. The live target is the existing **XCL_canvas_pcf_lab**, publisher **XCL_Demo** (prefix `xcl`). These are different solution names. Deploy changes with the explicit PAC command below; the local ZIP contains the PCF only, not the live Canvas app, probe table or connections.

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

The original photo submission is simulated. Integration lab adds a public REST API call and a small-file Dataverse proof of concept. See `INTEGRATION.md` for its limits and current evidence.

Production ZIP builds successfully. The user created `CmsUploadDemo` (app ID `68d6e398-6d5f-494f-a2a3-3c3ed34f9a3d`) in the target solution. Coauthoring is enabled and Canvas Authoring MCP has connected successfully and synchronized the blank app into `canvas/`.

PAC authenticated to the target environment and successfully pushed the PCF to `XCL_canvas_pcf_lab`, using its publisher `XCL_Demo` and prefix `xcl`. Dataverse queries confirmed the control and its membership in the exact solution ID above. Version `0.0.7` is built and deployed in production mode, set explicitly in `CanvasDemo.pcfproj`.

The user imported the component into Studio and inserted it into `Screen1` as `CmsUploadDemo1`. Canvas MCP then applied `X=0`, `Y=0`, `Width=Parent.Width`, and `Height=Parent.Height`. A fresh server synchronization confirmed the size formulas; zero positions are omitted as defaults. Canvas YAML validation passes and App Checker reports no issues. Full-screen rendering, interactive Preview behavior and saving/publishing the latest app version still require runtime review. The user's blank `Component1` definition is preserved.

Integration lab 0.0.7 adds anonymous GitHub API fetching and batch file-content encoding. **PCF Probe Files** is a writable Canvas Dataverse data source. `Integration-OnChange.pfx` implements read, create and per-file batch Patch; the response input is bound to `Coalesce(varIntegrationResponse, "")`. Validation passes and fresh server sync confirms the handler. App Checker reports one medium performance advisory for per-file Patch inside ForAll (maximum 10 files). The user confirmed Canvas echo Success earlier. Live API and Dataverse Preview tests remain pending. Save before closing Studio. See `INTEGRATION.md` for architecture and acceptance criteria.

Repeat deployment after code changes:

```powershell
pac pcf push --environment 268b8ad1-b6d1-ed49-b59a-d9bc85e9b99b --solution-unique-name XCL_canvas_pcf_lab
```

For a full-screen PCF host, set the control's `X` and `Y` to `0`, `Width` to `Parent.Width`, and `Height` to `Parent.Height`. Validate the actual Canvas rendering after importing and inserting the code component.
