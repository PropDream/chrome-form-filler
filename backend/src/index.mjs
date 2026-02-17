import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client();

export const handler = async () => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.OBJECT_KEY,
    });

    const response = await s3.send(command);
    const body = await response.Body.transformToString();
    const formData = JSON.parse(body);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    };
  } catch (err) {
    console.error("Error reading from S3:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to retrieve form data" }),
    };
  }
};
