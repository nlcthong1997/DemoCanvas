# Single-PCF integration feasibility

One PCF hosts Home, Bulk upload and Integration lab. React modules may be split into folders; they still compile into one component bundle. PCF version `0.0.4` adds the integration request/response bridge and preserves pending requests during navigation.

## Boundary

`sampleProperty` emits JSON through `notifyOutputChanged`. Canvas handles `OnChange`, uses its connectors, and sets `varIntegrationResponse`. Bind the PCF input `integrationResponse` to `Coalesce(varIntegrationResponse, "")`. The React panel accepts a response only when its request ID and service match the pending request. One request runs at a time, with a 30-second UI timeout. A timeout does not cancel the backend operation; inspect the backend before retrying a write. Navigation keeps the integration panel mounted so pending requests/results survive screen changes.

Canvas PCF has no supported `context.webAPI` or custom authentication. Authenticated services use Canvas connectors or a flow. No tokens, passwords, client secrets or signed flow URLs are embedded in React. This version makes no direct external HTTP calls.

`Integration-OnChange.pfx` contains the current Canvas handler. It returns a real Canvas echo for `canvas` and an explicit failure for unconfigured services. That echo proves only the host bridge, not any backend integration. Standalone preview has no connected host and never reports a backend success.

## Evidence and remaining configuration

| Test | Required setup | Passing evidence |
| --- | --- | --- |
| Canvas | Updated component; response input and OnChange binding | Message returns from Power Fx with matching request ID |
| Dataverse read/write | Dedicated probe table and Canvas data source | Read result; created record ID; independent record lookup |
| Power Automate | Solution flow with Power Apps (V2) trigger and response; add to app | Flow run history and matching response |
| SharePoint read/write | Demo site, dedicated probe list and connector | Read result; created item ID; independent item lookup |
| REST API | Demo API and custom connector or a flow HTTP action | Actual status/result and matching API or flow logs |

The user has no SharePoint site/list or API endpoint yet. The Canvas app currently has zero data sources. No Dataverse/SharePoint CRUD, flow run or REST call has been verified.

Start with a dedicated Dataverse table `xcl_integrationprobe` with a text primary name, request ID and message columns. A flow can subsequently expose a single request/response contract for API and SharePoint tests. Connector connections must be authenticated in the target environment and added to the app in Studio; names and schema must be discovered before generating Power Fx bindings. Do not use production tables or lists for probe writes.

## Verification performed

PCF manifest, ESLint and TypeScript build pass. Chrome fixture checks cover request locking, malformed/wrong/stale responses, host response, duplicate/late response rejection, timeout, disconnected host and 390-pixel layout. Fixture responses are local test data and are not backend evidence.

After importing the new PCF into Dataverse, save and reopen Studio, accept the code-component update, reconnect/sync Canvas, bind the handler/input and compile. Then run Canvas round trip in Preview. Record each backend test independently; UI availability does not establish connectivity.
