/** "PK\x03\x04": the local file header a zip archive starts with. A compressed MusicXML file is one. */
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];
const UTF8_BOM = [0xef, 0xbb, 0xbf];
const LESS_THAN = 0x3c;
/** Space, tab, line feed and carriage return: the whitespace XML allows before the first tag. */
const XML_WHITESPACE = new Set([0x20, 0x09, 0x0a, 0x0d]);
/** Enough to get past a byte order mark and leading blank lines. */
const HEAD_BYTES = 1024;

/**
 * Whether a file looks like MusicXML, judged by its first bytes only, so that a large file of
 * another kind (a photo, a video) is turned down without being read. A compressed MusicXML file
 * (.mxl) is a zip archive; an uncompressed one is XML text in UTF-8, the encoding the score
 * loader reads. Whether the file really holds a score is only known when it is loaded.
 *
 * The file picker cannot do this check: phones only let the user pick file types the system
 * knows, and .mxl and .musicxml are not among them.
 */
export async function looksLikeMusicXml(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  if (startsWith(head, ZIP_SIGNATURE)) return true;

  let index = startsWith(head, UTF8_BOM) ? UTF8_BOM.length : 0;
  while (index < head.length && XML_WHITESPACE.has(head[index] ?? 0)) index++;
  return head[index] === LESS_THAN;
}

function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((byte, index) => bytes[index] === byte);
}
