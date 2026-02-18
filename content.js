async function clearForm(FORM_DATA) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let cleared = 0;
  let skipped = 0;
  const details = [];

  for (const [id, value] of Object.entries(FORM_DATA)) {
    const el = document.getElementById(id);
    if (!el) {
      skipped++;
      details.push(`${id}: not found`);
      continue;
    }

    if (typeof value === "boolean") {
      // Uncheck: only click if currently checked (value is "X")
      if (el.value !== "X") {
        skipped++;
        details.push(`${id}: already unchecked, skipped`);
        continue;
      }
      el.click();
    } else {
      // Clear text: only clear if not already empty
      if (el.value === "") {
        skipped++;
        details.push(`${id}: already empty, skipped`);
        continue;
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
      await sleep(50);
    }

    cleared++;
    details.push(`${id}: cleared`);
  }

  return { cleared, skipped, details };
}

async function fillForm(FORM_DATA) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let filled = 0;
  let skipped = 0;
  const details = [];

  for (const [id, value] of Object.entries(FORM_DATA)) {
    const el = document.getElementById(id);
    if (!el) {
      skipped++;
      details.push(`${id}: not found`);
      continue;
    }

    if (typeof value === "boolean") {
      if (el.value === "X") {
        skipped++;
        details.push(`${id}: already checked, skipped`);
        continue;
      }
      el.click();
    } else {
      if (el.value === value) {
        skipped++;
        details.push(`${id}: already has correct value, skipped`);
        continue;
      }
      el.click();
      el.focus();
      // Select all and backspace to clear existing value
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
      el.select();
      el.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true }));
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keyup", { key: "Backspace", code: "Backspace", bubbles: true }));
      await sleep(200);
      for (const char of value) {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
        el.dispatchEvent(new KeyboardEvent("keypress", { key: char, bubbles: true }));
        el.value += char;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
        await sleep(200);
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    filled++;
    details.push(`${id}: filled`);
  }

  return { filled, skipped, details };
}
