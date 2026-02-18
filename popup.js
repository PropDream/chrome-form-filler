const LOGIN_URL = "http://proply-backend-alb-1624948625.us-west-1.elb.amazonaws.com/users/login";
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
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
}

// --- Auth State Persistence ---

async function getAuthState() {
  const data = await chrome.storage.local.get(["authToken", "userEmail"]);
  return data;
}

async function setAuthState(token, email) {
  await chrome.storage.local.set({ authToken: token, userEmail: email });
}

async function clearAuthState() {
  await chrome.storage.local.remove(["authToken", "userEmail"]);
}

// --- Initialize ---

(async () => {
  const { authToken, userEmail } = await getAuthState();
  if (authToken && userEmail) {
    showLoggedIn(userEmail);
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
    const token = data.token || data.accessToken || data.session_token;

    if (!token) {
      throw new Error("No token received from server.");
    }

    await setAuthState(token, email);
    showLoggedIn(email);
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

// --- Fill Form (only available when logged in) ---

fillBtn.addEventListener("click", async () => {
  statusEl.textContent = "Fetching form data...";

  try {
    const { authToken } = await getAuthState();
    if (!authToken) {
      statusEl.textContent = "Not logged in.";
      showLoggedOut();
      return;
    }

    const response = await fetch(API_URL, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await clearAuthState();
        showLoggedOut();
        statusEl.textContent = "Session expired. Please login again.";
        return;
      }
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
