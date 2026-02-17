# Form Auto-Filler Chrome Extension

A Chrome extension that fills form inputs on the current tab by fetching field mappings from an AWS API Gateway backed by S3. Supports text inputs and checkboxes, and simulates realistic keystroke-by-keystroke user input.

## Architecture

```
Chrome Extension (popup.js / content.js)
        │
        ▼  GET /form-data
API Gateway (AWS SAM HttpApi)
        │
        ▼
Lambda (src/index.mjs)
        │
        ▼
S3 Bucket (form-data.json)
```

## Project Structure

```
chrome-form-filler/
├── manifest.json        # Chrome extension manifest (MV3)
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic — fetches form data from API, triggers fill
├── content.js           # fillForm() — simulates realistic user input per field
├── test.html            # Sample form for local testing
└── backend/
    ├── template.yaml    # AWS SAM template (API Gateway + Lambda + S3)
    ├── form-data.json   # Sample form-data payload to upload to S3
    └── src/
        └── index.mjs    # Lambda handler — reads form-data.json from S3
```

## Prerequisites

- Google Chrome
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

## Backend Deployment

1. Deploy the SAM stack:
   ```bash
   cd backend
   sam build
   sam deploy --guided
   ```
2. Note the **ApiEndpoint** output value (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com/form-data`).
3. Upload form data to the created S3 bucket:
   ```bash
   aws s3 cp form-data.json s3://form-filler-data-<ACCOUNT_ID>/form-data.json
   ```
4. Update `popup.js` — replace the `API_URL` placeholder with the endpoint from step 2.

## Extension Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/PropDream/chrome-form-filler.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `chrome-form-filler` folder

The extension icon will appear in your toolbar.

## Usage

1. Navigate to a page with form fields
2. Click the extension icon in the toolbar
3. Click **Fill Form**
4. The popup will show which fields were filled and which were skipped

## Configuration

Form field mappings are stored in `backend/form-data.json` and served via the API. Keys are element IDs; values are strings (for text inputs) or booleans (for checkboxes):

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "agreeTerms": true
}
```

After editing, re-upload the file to S3:

```bash
aws s3 cp backend/form-data.json s3://form-filler-data-<ACCOUNT_ID>/form-data.json
```

## Testing

Open `test.html` in Chrome to verify the extension works with a sample form.
