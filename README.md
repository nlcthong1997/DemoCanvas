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

No photos are uploaded to SharePoint, Dataverse, Entra ID or PowerSchool. Campus authorization, real ID lookup and delivery are not implemented. User/campus values are mock data. The PCF has been imported into the authorized demo environment and solution recorded in `deployment/demo-target.json`, inserted into Canvas as `CmsUploadDemo1`, and configured to fill `Screen1`. Canvas YAML validation passes and App Checker reports no issues. Actual full-screen runtime rendering still needs review in Studio Preview.

Manifest version: `0.0.4`. Platform React is used; CSS is scoped to `.xp-app`; no direct external services are called by the component. Production PCF 0.0.4 has been pushed to the demo solution. Studio has loaded the updated manifest; its integration OnChange handler and response input are applied and server-verified. Canvas validation passes and App Checker reports no issues. The live round-trip still needs a Preview test. Dataverse, flow, SharePoint and REST operations remain unconfigured and unverified.

## Verification

PCF build validates manifest, ESLint and TypeScript. Standalone preview checked in headless Chrome: navigation, invalid removal, crop dimensions, duplicates, corrupt files, parent IDs, JSON submission, mobile overflow and browser errors. Screenshots: `preview/screenshots/`. Canvas rendering and connectors still require environment testing.
