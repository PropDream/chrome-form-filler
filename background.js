const NATIVE_HOST = "com.propdream.keystroke_sender";

// Persistent connection to the native messaging host.
// Using connectNative (not sendNativeMessage) because the host runs
// a while-loop and handles multiple messages per process.
let port = null;
let pendingResolve = null;

function ensureConnected() {
  if (port) return;

  console.log("[background] Connecting to native host:", NATIVE_HOST);
  port = chrome.runtime.connectNative(NATIVE_HOST);

  port.onMessage.addListener((response) => {
    console.log("[background] Native host response:", response);
    if (pendingResolve) {
      const resolve = pendingResolve;
      pendingResolve = null;
      resolve(response);
    }
  });

  port.onDisconnect.addListener(() => {
    const error = chrome.runtime.lastError?.message || "Native host disconnected";
    console.error("[background] Disconnected:", error);
    port = null;
    if (pendingResolve) {
      const resolve = pendingResolve;
      pendingResolve = null;
      resolve({ status: "error", message: error });
    }
  });
}

// Relay messages from popup to the native host.
// Supported actions:
//   { action: "type",  text: "string to type" }  → { status: "ok", typed: N }
//   { action: "click", x: 500, y: 300 }          → { status: "ok", action: "click", x, y }
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "type" || message.action === "click") {
    let nativeMessage;

    if (message.action === "type") {
      nativeMessage = { action: "type", text: message.text };
      if (message.delay !== undefined) {
        nativeMessage.delay = message.delay;
      }
    } else {
      nativeMessage = { action: "click", x: message.x, y: message.y };
    }

    console.log("[background] Sending to native host:", nativeMessage);

    try {
      ensureConnected();
    } catch (err) {
      sendResponse({ status: "error", message: err.message });
      return true;
    }

    // Only one pending request at a time (sequential fill)
    pendingResolve = (response) => {
      sendResponse(response);
    };

    port.postMessage(nativeMessage);

    // Return true to indicate we will call sendResponse asynchronously
    return true;
  }
});
