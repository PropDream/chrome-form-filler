// TODO: Replace with your API Gateway endpoint URL after deploying the SAM backend
const API_URL = "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/form-data";

document.getElementById("fillBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Fetching form data...";

  try {
    // Fetch form data from the API
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    const formData = await response.json();

    statusEl.textContent = "Filling...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillForm,
      args: [formData]
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
