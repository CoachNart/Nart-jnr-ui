const DEVICE_KEY = "kitsetups_device_id";

function randomId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function webglIdentity() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "";
    const context = gl as WebGLRenderingContext;
    const debug = context.getExtension("WEBGL_debug_renderer_info") as any;
    return debug
      ? `${context.getParameter(debug.UNMASKED_VENDOR_WEBGL)}|${context.getParameter(debug.UNMASKED_RENDERER_WEBGL)}`
      : String(context.getParameter(context.RENDERER) || "");
  } catch {
    return "";
  }
}

export function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing && existing.length >= 32) return existing;
  const id = randomId();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

export async function getDeviceFingerprint() {
  const screenValue = `${screen.width}x${screen.height}x${screen.availWidth}x${screen.availHeight}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const languages = navigator.languages?.join(",") || navigator.language || "";
  const raw = [
    `platform:${navigator.platform || ""}`,
    `hardwareConcurrency:${navigator.hardwareConcurrency || ""}`,
    `deviceMemory:${(navigator as any).deviceMemory || ""}`,
    `screen:${screenValue}`,
    `timezone:${timezone}`,
    `languages:${languages}`,
    `colorDepth:${screen.colorDepth || ""}`,
    `pixelRatio:${window.devicePixelRatio || ""}`,
    `touchPoints:${navigator.maxTouchPoints || 0}`,
    `webgl:${webglIdentity()}`,
  ].join("|");

  return sha256(raw);
}

export async function securityHeaders() {
  return {
    "X-KitSetups-Device": getDeviceId(),
    "X-KitSetups-Fingerprint": await getDeviceFingerprint(),
  };
}
