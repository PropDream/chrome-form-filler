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
      el.focus();
      el.click();
    } else {
      if (el.value === value) {
        skipped++;
        details.push(`${id}: already has correct value, skipped`);
        continue;
      }

      // Simulate focusin event
      const focusinEvent = new FocusEvent('focusin', {
        bubbles: true,
        cancelable: false,
      });
      //el.dispatchEvent(focusinEvent);
      

    // Get the position of the target element to set appropriate event coordinates
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    // Create a new mouse event
    const mouseMoveEvent = new MouseEvent('mousemove', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: clientX,
        clientY: clientY
    });

    // Dispatch the event on the target element
    el.dispatchEvent(mouseMoveEvent);

    const pointerMoveEvent = new PointerEvent('pointermove', {
      view: window,
      bubbles: true, // Events bubble up through the DOM
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      pointerId: 1,
      pointerType: "mouse",
      target: el,
      type: "pointerover",
      which: 0
    });

    el.dispatchEvent(pointerMoveEvent);
      el.focus();
      el.click();
      el.value = value
      // Dispatch the input event
      el.dispatchEvent(new Event('input', { bubbles: true}));
      // Dispatch the change event
      el.dispatchEvent(new Event('change', { bubbles: true}));
      //el.focus();
      //el.select();

      // Dispatch a 'click' event to simulate user interaction
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
	cancelable: true,
	button: 0,
      });
      //el.dispatchEvent(clickEvent);

      // Simulate focusout event
      const focusoutEvent = new FocusEvent('focusout', {
        bubbles: true,
        cancelable: false,
      });
      //el.dispatchEvent(focusoutEvent);
    }
    filled++;
    details.push(`${id}: filled with ${el.value}`);
    await sleep(1000);
  }

  return { filled, skipped, details };
}





