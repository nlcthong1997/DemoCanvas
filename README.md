# XCL Profile Photo — React PCF prototype

Home and Bulk upload follow pages 1 and 8 of the supplied PDF. Integration lab adds a request/response bridge for service feasibility testing inside the same PCF. Other unfinished navigation items show an explanatory message.

## Preview

Open `preview/dist/index.html` directly in Chrome or Edge. This self-contained HTML uses the same React component as the PCF and can be copied to another machine. Regenerate it from this directory with:

```powershell
npm.cmd run preview:build
```

Build and run the PCF development harness:

```powershell
npm.cmd run build
npm.cmd start
```

The harness prints its URL. Use a component viewport of roughly 960 × 600 or larger to review the desktop layout.

## Implemented

- File picker and drag/drop; maximum 100 files.
- JPG/PNG validation, numeric student IDs, numeric or `P-20311` parent IDs.
- 4 MB limit per image; minimum 320 pixels in both dimensions.
- Center crop to 320 × 400, JPEG quality 0.85; preview and original/processed size.
- Duplicate IDs, corrupt files and invalid-file removal.
- Simulated batch submission and a metadata output for Canvas.
- Responsive layout, including a 390-pixel phone viewport.

The four initial rows and Home statistics are samples. Selecting real files replaces the sample rows. File name rules and the 4 MB bulk-file limit are demo assumptions to confirm. Center cropping may cut off faces; production can add a crop editor. Preview images live only in component memory. No browser storage is used.

## Canvas integration boundary

`sampleProperty` returns JSON metadata when Send is clicked, through `notifyOutputChanged()`. It includes `requestId`, `photoType`, `campus`, `demo: true`, and `files` with `name`, `id`, `originalBytes`, `resizedBytes`, and `sample`. It does **not** contain image bytes. Integration lab uses the same output for requests with `kind: "integration-probe"`; responses return through the new `integrationResponse` input. See `deployment/INTEGRATION.md` for the contract and backend acceptance criteria.

No photos are uploaded to SharePoint, Dataverse, Entra ID or PowerSchool. Campus authorization, real ID lookup and delivery are not implemented. User/campus values are mock data. The PCF has been imported into the authorized demo environment and solution recorded in `deployment/demo-target.json`, inserted into Canvas as `CmsUploadDemo1`, and configured to fill `Screen1`. The hosted viewport and scrolling have been checked. Canvas YAML validation passes; the batch-file handler has one medium App Checker performance advisory for per-file Patch inside ForAll.

Manifest version: `0.0.7`, deployed in production mode to the demo solution. Integration lab can fetch a real public GitHub API list directly and dispatch Dataverse read/write or small batch-file requests through Canvas Power Fx. The dedicated table **PCF Probe Files** is created and connected to Canvas. The handler/input are applied and server-verified; live Dataverse record/content verification is still pending. Power Automate and SharePoint are not configured.

The component declares external-service usage for `api.github.com`, so it is a premium control. The lab stores actual file contents as Base64 text for this limited test (up to 10 files, 128 KB each, 384 KB total); it does not use a native File column. The original photo Bulk upload submission remains simulated. Architecture, setup and evidence are documented in [deployment/INTEGRATION.md](deployment/INTEGRATION.md).

## Verification

PCF build validates manifest, ESLint and TypeScript. Standalone preview checked in headless Chrome: navigation, invalid removal, crop dimensions, duplicates, corrupt files, parent IDs, JSON submission, mobile overflow and browser errors. Screenshots: `preview/screenshots/`. Chrome also verified a real HTTP 200 API response, error handling and byte-for-byte encoding of two selected test files. Canvas connector writes still require runtime verification.
