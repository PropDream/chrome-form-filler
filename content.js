// --- Focus a single form element by ID and clear its current value ---
// Called before sending keystrokes via native messaging.
// Returns: { success, id, action, oldValue } or { success: false, id, reason }
async function focusAndClearElement(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    return { success: false, id, reason: "not found" };
  }

  if (typeof value === "boolean") {
    // Checkbox: click to toggle
    if (el.value === "X") {
      return { success: false, id, reason: "already checked" };
    }
    el.focus();
    el.click();
    return { success: true, id, action: "clicked" };
  }

  // Text field
  if (el.value === value) {
    return { success: false, id, reason: "already has correct value" };
  }

  // Scroll element into view
  el.scrollIntoView({ block: "center", behavior: "instant" });

  // Get position for mouse/pointer events
  const rect = el.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  // Simulate mouse move + pointer move
  el.dispatchEvent(new MouseEvent("mousemove", {
    view: window, bubbles: true, cancelable: true,
    clientX, clientY
  }));
  el.dispatchEvent(new PointerEvent("pointermove", {
    view: window, bubbles: true, cancelable: true,
    clientX, clientY,
    pointerId: 1, pointerType: "mouse"
  }));

  // Focus and click
  el.focus();
  el.click();

  // Select all and delete existing content
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
  el.select();
  el.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true }));
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keyup", { key: "Backspace", code: "Backspace", bubbles: true }));

  return { success: true, id, action: "ready_for_typing", oldValue: el.value };
}

// --- Finalize a text field after keystrokes have been typed ---
// Dispatches change event so the web app registers the new value.
function finalizeElement(id) {
  const el = document.getElementById(id);
  if (!el) return { success: false, id, reason: "not found" };

  el.dispatchEvent(new Event("change", { bubbles: true }));
  return { success: true, id, value: el.value };
}

// --- Clear a single form element ---
function clearSingleElement(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    return { success: false, id, reason: "not found" };
  }

  if (typeof value === "boolean") {
    // Uncheck: only click if currently checked
    if (el.value !== "X") {
      return { success: false, id, reason: "already unchecked" };
    }
    el.click();
    return { success: true, id, action: "unchecked" };
  }

  // Text field: clear if not already empty
  if (el.value === "") {
    return { success: false, id, reason: "already empty" };
  }

  el.click();
  el.focus();
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
  el.select();
  el.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true }));
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keyup", { key: "Backspace", code: "Backspace", bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));

  return { success: true, id, action: "cleared" };
}

// --- Batch clear all elements in FORM_DATA ---
async function clearForm(FORM_DATA) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let cleared = 0;
  let skipped = 0;
  const details = [];

  for (const [id, value] of Object.entries(FORM_DATA)) {
    const result = clearSingleElement(id, value);
    if (result.success) {
      cleared++;
      details.push(`${id}: ${result.action}`);
    } else {
      skipped++;
      details.push(`${id}: ${result.reason}, skipped`);
    }
    await sleep(50);
  }

  return { cleared, skipped, details };
}
