# Form Auto-Filler Chrome Extension

A Chrome extension that fills form inputs on the current tab using a hardcoded dictionary of element IDs and values. Supports text inputs and checkboxes.

## Installation (for testers)

1. Clone this repository:
   ```
   git clone https://github.com/PropDream/chrome-form-filler.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `chrome-form-filler` folder you cloned

The extension icon will appear in your toolbar.

## Usage

1. Navigate to a page with form fields
2. Click the extension icon in the toolbar
3. Click **Fill Form**
4. The popup will show which fields were filled and which were skipped

## Configuration

Edit `config.js` to change the form field mappings. Keys are element IDs, values are strings (text inputs) or booleans (checkboxes):

```js
const FORM_DATA = {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "agreeTerms": true
};
```

After editing, go to `chrome://extensions` and click the reload button on the extension card.

## Testing

Open `test.html` in Chrome to verify the extension works with a sample form.
