export type ProbeService = 'canvas' | 'dataverse' | 'automate' | 'sharepoint' | 'api';
export interface ProbeRequest {
  kind: 'integration-probe';
  version: 1;
  requestId: string;
  service: ProbeService;
  operation: 'ping' | 'read' | 'write' | 'bulk-write';
  payload: { message: string; files?: ProbeFile[] };
}
export interface ProbeFile { name: string; mime: string; contentBase64: string; bytes: number; }
export interface ProbeResponse {
  requestId: string;
  service: ProbeService;
  ok: boolean;
  message: string;
  data?: unknown;
}
export function parseResponse(raw?: string): ProbeResponse | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return undefined;
    const record = value as Record<string, unknown>;
    if (typeof record.requestId !== 'string' || typeof record.ok !== 'boolean' || typeof record.message !== 'string') return undefined;
    if (!['canvas', 'dataverse', 'automate', 'sharepoint', 'api'].includes(String(record.service))) return undefined;
    return record as unknown as ProbeResponse;
  } catch { return undefined; }
}
