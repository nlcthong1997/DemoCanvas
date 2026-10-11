import * as React from 'react';
import { parseResponse, ProbeFile, ProbeRequest, ProbeResponse, ProbeService } from './protocol';
import { getPublicSamples, publicApiUrl } from './publicApi';

export interface IntegrationProps {
  onIntegrationRequest?: (payload: string) => void;
  integrationResponse?: string;
}
const services: {id: ProbeService; title: string; detail: string}[] = [
  {id:'canvas', title:'Canvas round trip', detail:'React → Canvas Power Fx → React'},
  {id:'dataverse', title:'Dataverse', detail:'Read records and create a dedicated test record'},
  {id:'automate', title:'Power Automate', detail:'Run a flow and receive its response'},
  {id:'sharepoint', title:'SharePoint', detail:'Read list items and create a test item'},
  {id:'api', title:'REST API', detail:'Load real PCF sample names from the public GitHub API'},
];
export function IntegrationLab({onIntegrationRequest, integrationResponse}: IntegrationProps): React.ReactElement {
  const [message, setMessage] = React.useState('XCL integration probe');
  const [pending, setPending] = React.useState<ProbeRequest>();
  const [history, setHistory] = React.useState<ProbeResponse[]>([]);
  const [notice, setNotice] = React.useState('');
  const [files, setFiles] = React.useState<ProbeFile[]>([]);
  const [readingFiles, setReadingFiles] = React.useState(false);
  const activeRequest = React.useRef<string>();
  const apiController = React.useRef<AbortController>();
  React.useEffect(() => () => {activeRequest.current = undefined; apiController.current?.abort();}, []);
  const response = React.useMemo(() => parseResponse(integrationResponse), [integrationResponse]);
  React.useEffect(() => {
    if (!pending || !response || response.requestId !== pending.requestId || response.service !== pending.service) return;
    setHistory(previous => [response, ...previous].slice(0, 20));
    activeRequest.current = undefined;
    setPending(undefined); setNotice('');
  }, [pending, response]);
  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      setHistory(previous => [{requestId:pending.requestId, service:pending.service, ok:false, message:'No response within 30 seconds. Check Canvas configuration and connector execution.'}, ...previous].slice(0, 20));
      setPending(undefined);
      activeRequest.current = undefined;
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [pending]);
  const run = (service: ProbeService, operation: ProbeRequest['operation']): void => {
    if (pending || activeRequest.current) return;
    if (service !== 'api' && !onIntegrationRequest) {setNotice('Open this component in Canvas to run integrations. Standalone preview has no connected services.'); return;}
    const request: ProbeRequest = {kind:'integration-probe', version:1, requestId:`probe-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, service, operation, payload:{message, ...(operation === 'bulk-write' ? {files} : {})}};
    activeRequest.current = request.requestId;
    setPending(request); setNotice('');
    if (service === 'api') {
      const controller = new AbortController(); apiController.current = controller;
      const timer = window.setTimeout(() => controller.abort(), 15000);
      const load = async (): Promise<void> => {
        let result: ProbeResponse;
        try {
          const data = await getPublicSamples(controller.signal);
          result = {requestId:request.requestId, service, ok:true, message:`HTTP ${data.status}: loaded ${data.items.length} real sample entries.`, data:{endpoint:publicApiUrl, ...data}};
        } catch (error) {
          result = {requestId:request.requestId, service, ok:false, message:controller.signal.aborted ? 'API request timed out or was cancelled.' : error instanceof Error ? error.message : 'API request failed.'};
        } finally {window.clearTimeout(timer);}
        if (activeRequest.current !== request.requestId) return;
        setHistory(previous => [result, ...previous].slice(0,20));
        activeRequest.current = undefined; setPending(undefined);
      };
      void load(); return;
    }
    try {onIntegrationRequest?.(JSON.stringify(request));}
    catch {activeRequest.current = undefined; setPending(undefined); setNotice('The Canvas request could not be dispatched.');}
  };
  const selectFiles = async (selected: FileList | null): Promise<void> => {
    if (!selected) return;
    setFiles([]); setNotice('');
    const batch = Array.from(selected);
    if (batch.length > 10 || batch.some(file => file.size > 128 * 1024) || batch.reduce((total, file) => total + file.size, 0) > 384 * 1024) {setNotice('Choose up to 10 small test files: 128 KB per file, 384 KB total.'); return;}
    setReadingFiles(true);
    try {
      const prepared = await Promise.all(batch.map(async file => {
        const contentBase64 = await new Promise<string>((resolve,reject) => {const reader = new FileReader();reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.slice(reader.result.indexOf(',')+1)) : reject(new Error('Cannot encode file'));reader.onerror = () => reject(new Error('Cannot read file'));reader.readAsDataURL(file);});
        return {name:file.name, mime:file.type || 'application/octet-stream', contentBase64, bytes:file.size};
      }));
      setFiles(prepared);
    } catch {setNotice('Could not read the selected files.');}
    finally {setReadingFiles(false);}
  };
  return <>
    <header className="xp-header"><div><h1>Integration lab</h1><p>Run one request at a time and inspect the response from the connected service.</p></div></header>
    <section className="xp-panel xp-probe-input"><label htmlFor="probe-message">Test message</label><input id="probe-message" maxLength={200} value={message} onChange={event => setMessage(event.target.value)} /><p>Write creates a test record. Uploading photos is a separate test.</p></section>
    <div className="xp-probe-grid">{services.map(service => <section key={service.id} className="xp-panel xp-probe-card"><h2>{service.title}</h2><p>{service.detail}</p><div className="xp-actions"><button className="xp-button xp-primary" disabled={!!pending} onClick={() => run(service.id, service.id === 'canvas' || service.id === 'automate' ? 'ping' : 'read')}>{pending?.service === service.id ? 'Waiting…' : service.id === 'canvas' || service.id === 'automate' ? 'Run test' : 'Read test'}</button>{(service.id === 'dataverse' || service.id === 'sharepoint') && <button className="xp-button" disabled={!!pending} onClick={() => run(service.id, 'write')}>Write test</button>}</div></section>)}</div>
    <section className="xp-panel xp-probe-input"><h2>Batch files → Dataverse</h2><p>Choose up to 10 test files, 128 KB each and 384 KB total. This demo saves file contents as Base64 text in dedicated Dataverse records.</p><input type="file" multiple aria-label="Choose Dataverse test files" disabled={!!pending || readingFiles} onChange={event => {void selectFiles(event.target.files);}} /><ul>{files.map((file,index) => <li key={`${file.name}-${index}`}>{file.name} · {file.bytes} bytes</li>)}</ul><button className="xp-button xp-primary" disabled={!files.length || !!pending || readingFiles} onClick={() => run('dataverse','bulk-write')}>{readingFiles ? 'Reading files…' : `Save ${files.length} files to Dataverse`}</button></section>
    {notice && <p className="xp-notice" role="status">{notice}</p>}
    <section className="xp-panel xp-probe-results" aria-live="polite"><h2>Test results</h2>{pending && <p>Waiting for {pending.service} · {pending.requestId}</p>}{!history.length && <p>No integration has been verified yet.</p>}{history.map(result => <article key={result.requestId}><span className={`xp-badge ${result.ok ? 'good' : 'bad'}`}>{result.ok ? 'Success' : 'Failed'}</span> <strong>{result.service}</strong><p>{result.message}</p><small>{result.requestId}</small>{result.data !== undefined && <pre>{JSON.stringify(result.data, null, 2)}</pre>}</article>)}</section>
  </>;
}
