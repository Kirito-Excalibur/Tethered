import LZString from 'lz-string';

export function encodeState(canvasJSON) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(canvasJSON));
}

export function decodeState(encoded) {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    return decompressed ? JSON.parse(decompressed) : null;
  } catch {
    return null;
  }
}

export function getStateFromURL() {
  const hash = window.location.hash.slice(1);
  return hash ? decodeState(hash) : null;
}

export function saveStateToURL(canvasJSON) {
  const encoded = encodeState(canvasJSON);
  history.replaceState(null, '', '#' + encoded);
}

export function clearStateFromURL() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
