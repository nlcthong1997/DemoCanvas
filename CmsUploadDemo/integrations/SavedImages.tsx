import * as React from 'react';

interface SavedFile {recordId: string; fileName: string; mime: string; contentBase64: string;}
interface DisplayFile {recordId: string; fileName: string; url?: string; error?: string;}

export function parseSavedFiles(data: unknown): SavedFile[] {
  if (!Array.isArray(data) || data.length > 3) throw new Error('Invalid saved-file response.');
  return data.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) throw new Error('Invalid saved file.');
    const file = item as Record<string, unknown>;
    if (typeof file.recordId !== 'string' || typeof file.fileName !== 'string' || typeof file.mime !== 'string' || typeof file.contentBase64 !== 'string') throw new Error('Missing saved-file fields.');
    return file as unknown as SavedFile;
  });
}

export function SavedImages({files}: {files: SavedFile[]}): React.ReactElement {
  const [images, setImages] = React.useState<DisplayFile[]>([]);
  React.useEffect(() => {
    const urls: string[] = [];
    setImages(files.map(file => {
      try {
        if (file.contentBase64.length > 174764) throw new Error('File exceeds the 128 KB preview limit.');
        const binary = window.atob(file.contentBase64);
        if (binary.length > 128 * 1024) throw new Error('File exceeds the 128 KB preview limit.');
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        // Only raster image formats are previewed; HTML and SVG are never opened.
        const mime = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg'
          : bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 ? 'image/png'
          : undefined;
        if (!mime) throw new Error('Preview supports JPEG and PNG images.');
        const url = URL.createObjectURL(new Blob([bytes], {type: mime}));
        urls.push(url);
        return {recordId: file.recordId, fileName: file.fileName, url};
      } catch (error) {
        return {recordId: file.recordId, fileName: file.fileName, error: error instanceof Error ? error.message : 'Cannot decode image.'};
      }
    }));
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  return <div className="xp-saved-images">{images.map(image => <article key={image.recordId}>
    {image.url && <img src={image.url} alt={image.fileName} onError={event => {event.currentTarget.hidden = true; setImages(previous => previous.map(item => item.recordId === image.recordId ? {...item, error: 'The stored image cannot be displayed.'} : item));}} />}
    <strong>{image.fileName}</strong>
    {image.error && <p role="status">{image.error}</p>}
    {image.url && <a className="xp-button" href={image.url} download={image.fileName}>Download image</a>}
  </article>)}</div>;
}
