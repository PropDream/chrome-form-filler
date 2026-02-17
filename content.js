(() => {
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
      el.checked = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    filled++;
    details.push(`${id}: filled`);
  }

  return { filled, skipped, details };
})();
