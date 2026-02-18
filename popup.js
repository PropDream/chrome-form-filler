const BASE_URL = "http://proply-backend-alb-1624948625.us-west-1.elb.amazonaws.com";
const LOGIN_URL = `${BASE_URL}/users/login`;
const FILES_QUERY_URL = `${BASE_URL}/files/query`;
// TODO: Replace with your API Gateway endpoint URL after deploying the SAM backend
const API_URL = "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/form-data";

const loginSection = document.getElementById("loginSection");
const loggedInSection = document.getElementById("loggedInSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const userEmailSpan = document.getElementById("userEmail");
const fillBtn = document.getElementById("fillBtn");
const statusEl = document.getElementById("status");
const filesLoading = document.getElementById("filesLoading");
const filesList = document.getElementById("filesList");

// --- UI State ---

function showLoggedIn(email) {
  loginSection.style.display = "none";
  loggedInSection.style.display = "block";
  userEmailSpan.textContent = email;
  loginError.style.display = "none";
  statusEl.textContent = "";
}

function showLoggedOut() {
  loginSection.style.display = "block";
  loggedInSection.style.display = "none";
  emailInput.value = "";
  passwordInput.value = "";
  loginError.style.display = "none";
  statusEl.textContent = "";
  filesList.innerHTML = "";
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
}

// --- Auth State Persistence ---

async function getAuthState() {
  const data = await chrome.storage.local.get(["userId", "userEmail"]);
  return data;
}

async function setAuthState(userId, email) {
  await chrome.storage.local.set({ userId, userEmail: email });
}

async function clearAuthState() {
  await chrome.storage.local.remove(["userId", "userEmail"]);
}

// --- Files ---

async function fetchAndDisplayFiles(userId) {
  filesLoading.style.display = "block";
  filesList.innerHTML = "";

  try {
    const response = await fetch(FILES_QUERY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to load files (${response.status})`);
    }

    const data = await response.json();
    const files = (data.files || []).filter(f => f.file_type === "FillForm");

    if (files.length === 0) {
      filesList.innerHTML = '<div class="no-files">No form fill files found.</div>';
      return;
    }

    // Group files by project_name
    const grouped = {};
    for (const file of files) {
      const project = file.project_name || "Uncategorized";
      if (!grouped[project]) grouped[project] = [];
      grouped[project].push(file);
    }

    // Sort project names alphabetically
    const sortedProjects = Object.keys(grouped).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // Render
    let html = "";
    for (const project of sortedProjects) {
      const projectFiles = grouped[project];
      html += '<div class="project-group">';
      html += `<div class="project-header">${escapeHtml(project)} <span class="file-count">(${projectFiles.length})</span></div>`;
      for (const file of projectFiles) {
        html += `<div class="file-item" data-file-id="${escapeHtml(file.file_id)}">
          <span class="file-name" title="${escapeHtml(file.file_name)}">${escapeHtml(file.file_name)}</span>
          <button class="fill-file-btn" title="Fill form with this file">Fill</button>
        </div>`;
      }
      html += "</div>";
    }

    filesList.innerHTML = html;

    // Attach click handlers to fill buttons
    filesList.querySelectorAll(".fill-file-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const fileId = btn.closest(".file-item").dataset.fileId;
        fillFormWithFile(userId, fileId);
      });
    });
  } catch (err) {
    filesList.innerHTML = `<div class="no-files" style="color:#d32f2f;">${escapeHtml(err.message)}</div>`;
  } finally {
    filesLoading.style.display = "none";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// --- Fill Form with a specific file ---

async function fillFormWithFile(userId, fileId) {
  statusEl.textContent = "Fetching form data...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, file_id: fileId })
    });

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
}

// --- Initialize ---

(async () => {
  const { userId, userEmail } = await getAuthState();
  if (userId && userEmail) {
    showLoggedIn(userEmail);
    fetchAndDisplayFiles(userId);
  } else {
    showLoggedOut();
  }
})();

// --- Login ---

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showLoginError("Please enter email and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
  loginError.style.display = "none";

  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Login failed (${response.status})`);
    }

    const data = await response.json();
    const userId = data.user_id;

    if (!userId) {
      throw new Error("No user_id received from server.");
    }

    await setAuthState(userId, email);
    showLoggedIn(email);
    fetchAndDisplayFiles(userId);
  } catch (err) {
    showLoginError(err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});

// Allow pressing Enter in the password field to login
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    loginBtn.click();
  }
});

// --- Logout ---

logoutBtn.addEventListener("click", async () => {
  await clearAuthState();
  showLoggedOut();
});

// --- Fill Form button (uses first available file as fallback) ---

fillBtn.addEventListener("click", async () => {
  statusEl.textContent = "Fetching form data...";

  try {
    const { userId } = await getAuthState();
    if (!userId) {
      statusEl.textContent = "Not logged in.";
      showLoggedOut();
      return;
    }

    // Find the first file item in the list to use
    const firstFileItem = filesList.querySelector(".file-item[data-file-id]");
    if (!firstFileItem) {
      statusEl.textContent = "No form fill files available. Upload one first.";
      return;
    }

    const fileId = firstFileItem.dataset.fileId;
    await fillFormWithFile(userId, fileId);
  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
  }
});
