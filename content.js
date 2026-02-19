// --- Prepare a single form element for filling ---
// Scrolls into view, computes screen coordinates for native click.
// Does NOT click — popup.js will send the click via native messaging.
// Returns: { success, id, action, x, y, oldValue } or { success: false, id, reason }
function prepareElement(id, value) {
  try {
    const el = document.getElementById(id);
    if (!el) {
      return { success: false, id, reason: `element #${id} not found in DOM` };
    }

    // Scroll element into view first
    el.scrollIntoView({ block: "center", behavior: "instant" });

    // Compute screen coordinates (inline — cannot call other content.js functions)
    const rect = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const chromeTop = window.outerHeight - window.innerHeight;
    const chromeLeft = window.outerWidth - window.innerWidth;
    const x = Math.round((window.screenX + chromeLeft + rect.left + rect.width / 2) * dpr);
    const y = Math.round((window.screenY + chromeTop + rect.top + rect.height / 2) * dpr);

    if (typeof value === "boolean") {
      // Checkbox: check if already in desired state
      if (el.value === "X") {
        return { success: false, id, reason: "already checked" };
      }
      // Return coordinates — popup.js will send native click to toggle
      return { success: true, id, action: "need_click", x, y };
    }

    // Text field
    if (el.value === value) {
      return { success: false, id, reason: "already has correct value" };
    }

    // Return coordinates for clicking — popup.js will click to focus,
    // then we'll clear via a separate call, then type via keystrokes
    return {
      success: true,
      id,
      action: "need_click_and_type",
      x,
      y,
      oldValue: el.value
    };
  } catch (err) {
    return { success: false, id, reason: `prepareElement error: ${err.message}` };
  }
}

// --- Clear the current value of a text field after it has been clicked ---
// Called after native click has focused the element.
function clearElementValue(id) {
  try {
    const el = document.getElementById(id);
    if (!el) return { success: false, id, reason: `element #${id} not found` };

    // Select all and delete existing content
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
    el.select();
    el.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true }));
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { key: "Backspace", code: "Backspace", bubbles: true }));

    return { success: true, id };
  } catch (err) {
    return { success: false, id, reason: `clearElementValue error: ${err.message}` };
  }
}

// --- Finalize a text field after keystrokes have been typed ---
// Dispatches change event so the web app registers the new value.
function finalizeElement(id) {
  try {
    const el = document.getElementById(id);
    if (!el) return { success: false, id, reason: `element #${id} not found` };

    el.dispatchEvent(new Event("change", { bubbles: true }));
    return { success: true, id, value: el.value };
  } catch (err) {
    return { success: false, id, reason: `finalizeElement error: ${err.message}` };
  }
}

// --- Prepare a single element for clearing ---
// Returns coordinates for native click. Does NOT click.
function prepareClearElement(id, value) {
  try {
    const el = document.getElementById(id);
    if (!el) {
      return { success: false, id, reason: `element #${id} not found in DOM` };
    }

    // Scroll into view
    el.scrollIntoView({ block: "center", behavior: "instant" });

    // Compute screen coordinates (inline)
    const rect = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const chromeTop = window.outerHeight - window.innerHeight;
    const chromeLeft = window.outerWidth - window.innerWidth;
    const x = Math.round((window.screenX + chromeLeft + rect.left + rect.width / 2) * dpr);
    const y = Math.round((window.screenY + chromeTop + rect.top + rect.height / 2) * dpr);

    if (typeof value === "boolean") {
      // Uncheck: only if currently checked
      if (el.value !== "X") {
        return { success: false, id, reason: "already unchecked" };
      }
      // Return coordinates for native click to uncheck
      return { success: true, id, action: "need_click", x, y };
    }

    // Text field: skip if already empty
    if (el.value === "") {
      return { success: false, id, reason: "already empty" };
    }

    // Return coordinates for clicking, then we'll clear the value
    return { success: true, id, action: "need_click_and_clear", x, y };
  } catch (err) {
    return { success: false, id, reason: `prepareClearElement error: ${err.message}` };
  }
}

// --- Clear a text field's value after it has been clicked ---
function clearFieldValue(id) {
  try {
    const el = document.getElementById(id);
    if (!el) return { success: false, id, reason: `element #${id} not found` };

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
    el.select();
    el.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true }));
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { key: "Backspace", code: "Backspace", bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    return { success: true, id, action: "cleared" };
  } catch (err) {
    return { success: false, id, reason: `clearFieldValue error: ${err.message}` };
  }
}
