const NATIVE_HOST = "com.propdream.keystroke_sender";

// Relay messages from popup/content scripts to the native messaging host.
// Message format: { action: "type", text: "string to type", delay: 0.05 }
// Response:       { status: "ok", typed: N } or { status: "error", message: "..." }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "type") {
    const nativeMessage = { text: message.text };
    if (message.delay !== undefined) {
      nativeMessage.delay = message.delay;
    }

    console.log("[background] Sending to native host:", nativeMessage);

    chrome.runtime.sendNativeMessage(NATIVE_HOST, nativeMessage, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[background] Native messaging error:", chrome.runtime.lastError.message);
        sendResponse({ status: "error", message: chrome.runtime.lastError.message });
      } else {
        console.log("[background] Native host response:", response);
        sendResponse(response);
      }
    });

    // Return true to indicate we will call sendResponse asynchronously
    return true;
  }
});
