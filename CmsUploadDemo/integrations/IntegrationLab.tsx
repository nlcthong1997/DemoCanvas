import * as React from 'react';
import { parseResponse, ProbeRequest, ProbeResponse, ProbeService } from './protocol';

export interface IntegrationProps {
  onIntegrationRequest?: (payload: string) => void;
  integrationResponse?: string;
}
const services: {id: ProbeService; title: string; detail: string}[] = [
  {id:'canvas', title:'Canvas round trip', detail:'React → Canvas Power Fx → React'},
  {id:'dataverse', title:'Dataverse', detail:'Read records and create a dedicated test record'},
  {id:'automate', title:'Power Automate', detail:'Run a flow and receive its response'},
  {id:'sharepoint', title:'SharePoint', detail:'Read list items and create a test item'},
  {id:'api', title:'REST API', detail:'Call the configured API through a connector or flow'},
];
export function IntegrationLab({onIntegrationRequest, integrationResponse}: IntegrationProps): React.ReactElement {
  const [message, setMessage] = React.useState('XCL integration probe');
  const [pending, setPending] = React.useState<ProbeRequest>();
  const [history, setHistory] = React.useState<ProbeResponse[]>([]);
  const [notice, setNotice] = React.useState('');
  const response = React.useMemo(() => parseResponse(integrationResponse), [integrationResponse]);
  React.useEffect(() => {
    if (!pending || !response || response.requestId !== pending.requestId || response.service !== pending.service) return;
    setHistory(previous => [response, ...previous].slice(0, 20));
    setPending(undefined); setNotice('');
  }, [pending, response]);
  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      setHistory(previous => [{requestId:pending.requestId, service:pending.service, ok:false, message:'No response within 30 seconds. Check Canvas configuration and connector execution.'}, ...previous].slice(0, 20));
      setPending(undefined);
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [pending]);
  const run = (service: ProbeService, operation: ProbeRequest['operation']): void => {
    if (pending) return;
    if (!onIntegrationRequest) {setNotice('Open this component in Canvas to run integrations. Standalone preview has no connected services.'); return;}
    const request: ProbeRequest = {kind:'integration-probe', version:1, requestId:`probe-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, service, operation, payload:{message}};
    setPending(request); setNotice('');
    try {onIntegrationRequest(JSON.stringify(request));}
    catch {setPending(undefined); setNotice('The Canvas request could not be dispatched.');}
  };
  return <>
    <header className="xp-header"><div><h1>Integration lab</h1><p>Run one request at a time and inspect the response from the connected service.</p></div></header>
    <section className="xp-panel xp-probe-input"><label htmlFor="probe-message">Test message</label><input id="probe-message" maxLength={200} value={message} onChange={event => setMessage(event.target.value)} /><p>Write creates a test record. Uploading photos is a separate test.</p></section>
    <div className="xp-probe-grid">{services.map(service => <section key={service.id} className="xp-panel xp-probe-card"><h2>{service.title}</h2><p>{service.detail}</p><div className="xp-actions"><button className="xp-button xp-primary" disabled={!!pending} onClick={() => run(service.id, service.id === 'canvas' || service.id === 'automate' ? 'ping' : 'read')}>{pending?.service === service.id ? 'Waiting…' : service.id === 'canvas' || service.id === 'automate' ? 'Run test' : 'Read test'}</button>{(service.id === 'dataverse' || service.id === 'sharepoint') && <button className="xp-button" disabled={!!pending} onClick={() => run(service.id, 'write')}>Write test</button>}</div></section>)}</div>
    {notice && <p className="xp-notice" role="status">{notice}</p>}
    <section className="xp-panel xp-probe-results" aria-live="polite"><h2>Test results</h2>{pending && <p>Waiting for {pending.service} · {pending.requestId}</p>}{!history.length && <p>No integration has been verified yet.</p>}{history.map(result => <article key={result.requestId}><span className={`xp-badge ${result.ok ? 'good' : 'bad'}`}>{result.ok ? 'Success' : 'Failed'}</span> <strong>{result.service}</strong><p>{result.message}</p><small>{result.requestId}</small>{result.data !== undefined && <pre>{JSON.stringify(result.data, null, 2)}</pre>}</article>)}</section>
  </>;
}
