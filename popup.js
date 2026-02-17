document.getElementById("fillBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Filling...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["config.js", "content.js"]
    });

    const result = results[0]?.result;
    if (result) {
      statusEl.textContent = `Done! Filled: ${result.filled}, Skipped: ${result.skipped}\n${result.details.join("\n")}`;
    } else {
      statusEl.textContent = "Done (no result returned).";
    }
  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
  }
});
