export function loadScript(src: string) {
  const js = document.createElement('script');
  js.src = src;
  document.body.appendChild(js);
  return new Promise((resolve, reject) => {
    js.onload = resolve;
    js.onerror = reject;
  });
}

export function loadRawBuffer(src: string) {
  return fetch(src).then(data=>data.arrayBuffer());
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = document.createElement('img');
  img.src = src;
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export function assert<T>(name: string, t: T|null): T {
  if (!t) {
    throw new Error(`Failed to create element ${name}`);
  }
  return t;
}
