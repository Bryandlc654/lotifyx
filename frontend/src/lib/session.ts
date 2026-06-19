type SessionCallback = () => void;

let listeners: SessionCallback[] = [];

export function onSessionExpired(cb: SessionCallback) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export function emitSessionExpired() {
  listeners.forEach(cb => cb());
}
