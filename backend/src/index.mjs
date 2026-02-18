const PROPLY_DOWNLOAD_URL =
  process.env.PROPLY_DOWNLOAD_URL ||
  "http://proply-backend-alb-1624948625.us-west-1.elb.amazonaws.com/files/download";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { user_id, file_id } = body;

    if (!user_id || !file_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields: user_id, file_id" }),
      };
    }

    // Step 1: Get presigned download URL from proply-backend
    const downloadRes = await fetch(PROPLY_DOWNLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, file_id }),
    });

    if (!downloadRes.ok) {
      const errData = await downloadRes.json().catch(() => ({}));
      return {
        statusCode: downloadRes.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: errData.error || "Failed to get download URL" }),
      };
    }

    const { download_url } = await downloadRes.json();

    // Step 2: Fetch the actual file content from the presigned S3 URL
    const fileRes = await fetch(download_url);
    if (!fileRes.ok) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Failed to download file from S3" }),
      };
    }

    const formData = await fileRes.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to retrieve form data" }),
    };
  }
};
