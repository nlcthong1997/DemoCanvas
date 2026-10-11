import * as React from 'react';

type Screen = 'home' | 'bulk';
type PhotoType = 'Students' | 'Parents';
interface PhotoRow { key: string; name: string; id: string; originalSize: number; size?: number; preview?: string; error?: string; sample?: boolean; }
export interface IHelloWorldProps { onSubmit?: (payload: string) => void; }
const samples: PhotoRow[] = [
  { key: 's1', name: '0012345.jpg', id: '0012345', originalSize: 3565158, size: 38912, sample: true },
  { key: 's2', name: '0012346.png', id: '0012346', originalSize: 2202010, size: 35840, sample: true },
  { key: 's3', name: 'IMG_2281.jpg', id: '', originalSize: 4194304, error: 'Name is not a valid ID', sample: true },
  { key: 's4', name: '0012351.jpg', id: '0012351', originalSize: 49152, error: 'Image too small (min 320 px)', sample: true },
];
const formatSize = (size: number): string => size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;

async function preparePhoto(file: File, type: PhotoType): Promise<PhotoRow> {
  const id = file.name.replace(/\.[^.]+$/, '');
  const row: PhotoRow = { key: `${file.name}-${file.lastModified}-${file.size}`, name: file.name, id, originalSize: file.size };
  if (!/\.(jpe?g|png)$/i.test(file.name) || !['image/jpeg', 'image/png'].includes(file.type)) return { ...row, error: 'Choose a JPG or PNG photo' };
  if (!(type === 'Students' ? /^\d+$/ : /^(?:P-)?\d+$/i).test(id)) return { ...row, id: '', error: 'Name is not a valid ID' };
  if (file.size > 4 * 1048576) return { ...row, error: 'File exceeds 4 MB demo limit' };
  const objectUrl = URL.createObjectURL(file);
  try {
    const photo = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Cannot read image')); img.src = objectUrl;
    });
    if (photo.naturalWidth < 320 || photo.naturalHeight < 320) return { ...row, error: 'Image too small (min 320 px)' };
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 400;
    const context = canvas.getContext('2d');
    if (!context) return { ...row, error: 'Image processing unavailable' };
    const ratio = Math.max(320 / photo.naturalWidth, 400 / photo.naturalHeight);
    context.drawImage(photo, (320 - photo.naturalWidth * ratio) / 2, (400 - photo.naturalHeight * ratio) / 2, photo.naturalWidth * ratio, photo.naturalHeight * ratio);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return { ...row, error: 'Cannot process image' };
    const preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : ''); reader.onerror = () => reject(new Error('Cannot read processed photo')); reader.readAsDataURL(blob);
    });
    return { ...row, preview, size: blob.size };
  } catch { return { ...row, error: 'Cannot read image' }; }
  finally { URL.revokeObjectURL(objectUrl); }
}

export function HelloWorld({ onSubmit }: IHelloWorldProps): React.ReactElement {
  const [screen, setScreen] = React.useState<Screen>('home');
  const [campus, setCampus] = React.useState('SG · XWA');
  const [type, setType] = React.useState<PhotoType>('Students');
  const [rows, setRows] = React.useState<PhotoRow[]>(samples);
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [sent, setSent] = React.useState(0);
  const input = React.useRef<HTMLInputElement>(null);
  const ready = rows.filter(row => !row.error);
  const invalid = rows.length - ready.length;
  const navigate = (target: Screen): void => { setScreen(target); setNotice(''); };
  const addFiles = async (files: FileList | null): Promise<void> => {
    if (!files || busy) return;
    const existing = rows.filter(row => !row.sample);
    const selected = Array.from(files).slice(0, 100 - existing.length);
    if (!selected.length) { setNotice('A batch can contain up to 100 files.'); return; }
    setBusy(true); setSent(0); setNotice('Checking and resizing photos…');
    const processed: PhotoRow[] = [];
    for (const file of selected) processed.push(await preparePhoto(file, type));
    const merged = [...existing];
    for (const photo of processed) {
      if (merged.some(row => row.key === photo.key)) continue;
      merged.push(!photo.error && merged.some(row => !row.error && row.id === photo.id) ? { ...photo, error: 'Duplicate ID in this batch' } : photo);
    }
    setRows(merged); setBusy(false);
    setNotice(files.length > selected.length ? 'Only the first available files were added (100-file limit).' : `${processed.length} photos checked. Review the results below.`);
    if (input.current) input.current.value = '';
  };
  const submit = (): void => {
    const request = { requestId: `demo-${Date.now()}`, photoType: type, campus, demo: true, files: ready.map(row => ({ name: row.name, id: row.id, originalBytes: row.originalSize, resizedBytes: row.size, sample: !!row.sample })) };
    onSubmit?.(JSON.stringify(request)); setSent(ready.length);
    setNotice(`Demo completed: ${ready.length} photos queued locally. No photos were sent to a school system.`);
  };
  const campusSelect = (id: string): React.ReactElement => <select id={id} value={campus} onChange={event => { setCampus(event.target.value); setSent(0); }} disabled={busy}><option>SG · XWA</option><option>SG · XCT</option></select>;
  const unavailable = (label: string): void => setNotice(`${label} is outside this two-screen prototype.`);

  return <div className="xp-app">
    <aside className="xp-sidebar" aria-label="Main navigation">
      <div className="xp-brand"><span className="xp-logo">XP</span><div><strong>Profile Photo</strong><small>XCL Education</small></div></div>
      <nav>
        <button className={screen === 'home' ? 'xp-nav active' : 'xp-nav'} onClick={() => navigate('home')} aria-current={screen === 'home' ? 'page' : undefined}>Home</button>
        <button className="xp-nav" onClick={() => unavailable('My photo')}>My photo</button>
        <div className="xp-nav-heading">School photos</div>
        {['Students', 'Parents', 'Staff'].map(label => <button className="xp-nav" key={label} onClick={() => unavailable(label)}>{label}</button>)}
        <button className={screen === 'bulk' ? 'xp-nav active xp-nav-bulk' : 'xp-nav xp-nav-bulk'} onClick={() => navigate('bulk')} aria-current={screen === 'bulk' ? 'page' : undefined}>Bulk upload</button>
        {['Upload status', 'History'].map(label => <button className="xp-nav" key={label} onClick={() => unavailable(label)}>{label}</button>)}
        <div className="xp-nav-heading">Admin</div><button className="xp-nav" onClick={() => unavailable('Access')}>Access</button>
      </nav>
      <div className="xp-sidebar-note"><span className="xp-demo-dot" /> Interactive demo<small>Home & bulk upload</small></div>
    </aside>
    <main className="xp-main">
      {screen === 'home' ? <>
        <header className="xp-header"><div><h1>Good morning, Linh</h1><p>Registrar · access to SG · XWA and SG · XCT</p></div><div className="xp-campus-inline"><label htmlFor="home-campus">Campus</label>{campusSelect('home-campus')}</div></header>
        <div className="xp-quick-grid">
          <button className="xp-quick xp-profile" onClick={() => unavailable('My photo')}><span className="xp-avatar">LN</span><span><strong>My photo</strong><small>Update your Microsoft 365 photo</small></span></button>
          <button className="xp-quick" onClick={() => unavailable('Students')}><strong>Student photos</strong><small>Find a student, view or replace the photo</small></button>
          <button className="xp-quick" onClick={() => unavailable('Parents')}><strong>Parent photos</strong><small>Photos for pickup and records</small></button>
        </div>
        <section className="xp-banner"><div><h2>Bulk upload photos</h2><p>Drop many files named by Student or Parent ID. Each file is checked and gets its own result.</p></div><button className="xp-button xp-white" onClick={() => navigate('bulk')}>Start upload</button></section>
        <section className="xp-panel xp-recent"><div className="xp-section-heading"><h2>My recent uploads</h2><button className="xp-link" onClick={() => unavailable('Upload status')}>See all</button></div>
          <div className="xp-stats"><div className="xp-stat blue"><strong>{3 + sent}</strong><span>Received · processing</span></div><div className="xp-stat green"><strong>24</strong><span>Success</span></div><div className="xp-stat red"><strong>1</strong><span>Blocked</span></div><div className="xp-stat amber"><strong>2</strong><span>Validation failed</span></div></div>
          <p className="xp-caption">Sample numbers for the mockup.</p>
        </section>
      </> : <>
        <header className="xp-header xp-bulk-header"><div><h1>Bulk upload</h1><p>Name each file by ID, e.g. 0012345.jpg. Photos are checked and resized before sending.</p></div><button className="xp-link" onClick={() => setNotice('The campus library connection will be configured with SharePoint in the next phase.')}>Open campus library for very large batches ↗</button></header>
        <div className="xp-filters"><div><span className="xp-field-label">Photo type</span><div className="xp-segment" role="group" aria-label="Photo type">{(['Students', 'Parents'] as PhotoType[]).map(value => <button key={value} aria-pressed={type === value} disabled={busy} className={type === value ? 'selected' : ''} onClick={() => { setType(value); setRows([]); setSent(0); setNotice(''); }}>{value}</button>)}</div></div><div><label className="xp-field-label" htmlFor="bulk-campus">Campus</label>{campusSelect('bulk-campus')}</div></div>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png" className="xp-file-input" aria-label="Choose photos" onChange={event => { void addFiles(event.target.files); }} />
        <button className={`xp-dropzone${dragging ? ' dragging' : ''}`} disabled={busy} onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V3m0 0L7 8m5-5 5 5M4 15v5h16v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <strong>{busy ? 'Checking your photos…' : 'Drop photos here or choose files'}</strong><span>PhotoPicker (PCF) · JPG, JPEG, PNG · up to 100 files</span>
        </button>
        <section className="xp-panel xp-upload-panel"><div className="xp-upload-toolbar"><p><strong>{rows.length} files</strong> · {ready.length} ready · <span className={invalid ? 'xp-error-text' : ''}>{invalid} need fixing</span>{rows.some(row => row.sample) && <span className="xp-sample-label">Sample files</span>}</p><div className="xp-actions"><button className="xp-button" disabled={!invalid || busy} onClick={() => { setRows(rows.filter(row => !row.error)); setSent(0); }}>Remove invalid</button><button className="xp-button xp-primary" disabled={!ready.length || busy || sent > 0} onClick={submit}>{sent ? 'Demo batch queued' : `Send ${ready.length} photos`}</button></div></div>
          <div className="xp-table-scroll"><table><thead><tr><th>Preview</th><th>File</th><th>ID</th><th>Size</th><th>Check</th><th><span className="xp-sr-only">Actions</span></th></tr></thead><tbody>{rows.map(row => <tr key={row.key}><td>{row.preview ? <img className="xp-thumbnail" src={row.preview} alt={`Preview of ${row.name}`} /> : <span className={`xp-thumbnail placeholder${row.error ? ' invalid' : ''}`} />}</td><td className="xp-file-name">{row.name}</td><td>{row.id || '—'}</td><td>{formatSize(row.originalSize)}{row.size !== undefined && <> → {formatSize(row.size)}</>}</td><td><span className={`xp-badge ${row.error ? 'bad' : 'good'}`}>{row.error ?? 'Ready'}</span></td><td><button className="xp-remove" aria-label={`Remove ${row.name}`} disabled={busy} onClick={() => { setRows(rows.filter(item => item.key !== row.key)); setSent(0); }}>×</button></td></tr>)}</tbody></table>{!rows.length && <div className="xp-empty">Choose photos to begin. Use a student ID or parent ID as the file name.</div>}</div>
        </section>
        {sent > 0 && <section className="xp-panel xp-progress"><div><strong>Demo batch complete</strong><span>{sent} of {sent} queued</span></div><progress value={sent} max={sent} aria-label="Demo batch progress" /><p>Demo completed. No photos have been sent to a school system.</p></section>}
        <p className="xp-caption xp-upload-note">Preview demo · photo delivery is simulated.</p>
      </>}
      {notice && <div className="xp-notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
    </main>
  </div>;
}
