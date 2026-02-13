# Cloudflare R2 Setup Guide

## Step 1: Create R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to **R2 Object Storage** in the sidebar
3. Click **"Create bucket"**
4. Name your bucket (e.g., `images`)
5. Click **"Create bucket"**

## Step 2: Generate API Tokens

1. In R2, click **"Manage R2 API Tokens"**
2. Click **"Create API Token"**
3. Configure the token:
   - **Token name**: Give it a descriptive name (e.g., "PROMPTWERK Upload Token")
   - **Permissions**: Select "Object Read & Write"
   - **Specific buckets**: Select your bucket (e.g., `images`)
   - **TTL**: Optional (leave blank for no expiration)
4. Click **"Create API Token"**

## Step 3: Save Your Credentials

After creating the token, you'll see:
- **Access Key ID** - This is your `accessKeyId`
- **Secret Access Key** - This is your `secretAccessKey` (⚠️ Save this immediately, you won't see it again!)

Also note:
- **Account ID** - Found in your Cloudflare dashboard URL or R2 overview
- **S3 Endpoint** - Format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## Step 4: Update config.js

```javascript
export const cloudflareConfig = {
    accountId: 'YOUR_ACCOUNT_ID_HERE',
    bucketName: 'images',
    accessKeyId: 'YOUR_ACCESS_KEY_ID_HERE',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY_HERE',
    endpoint: 'https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com',
    region: 'auto'
};
```

## Step 5: Configure CORS (Important!)

To allow uploads from your website, configure CORS on your R2 bucket:

1. Go to your bucket in R2
2. Click on **Settings** tab
3. Scroll to **CORS Policy**
4. Add this configuration:

```json
[
  {
    "AllowedOrigins": ["http://localhost:8001", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 6: Install AWS SDK (for uploading)

The simplest way to upload to R2 is using AWS SDK since R2 is S3-compatible:

```bash
npm install @aws-sdk/client-s3
```

Or include via CDN in your HTML:
```html
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.1.24.min.js"></script>
```

## Step 7: Implement Upload Function

Update `submit.js` with proper S3 upload:

```javascript
// At the top of submit.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configure S3 client for R2
const s3Client = new S3Client({
    region: cloudflareConfig.region,
    endpoint: cloudflareConfig.endpoint,
    credentials: {
        accessKeyId: cloudflareConfig.accessKeyId,
        secretAccessKey: cloudflareConfig.secretAccessKey,
    },
});

async function uploadToCloudflare(file) {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const command = new PutObjectCommand({
        Bucket: cloudflareConfig.bucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type,
    });
    
    await s3Client.send(command);
    
    // Return the public URL
    return `${cloudflareConfig.endpoint}/${cloudflareConfig.bucketName}/${fileName}`;
}
```

## Alternative: Use Presigned URLs (Recommended for Production)

For better security, generate presigned URLs from your backend:

1. Create a backend endpoint that generates presigned URLs
2. Frontend requests a presigned URL
3. Frontend uploads directly to R2 using the presigned URL
4. No credentials exposed in frontend!

## Testing

1. Open submit.html in your browser
2. Fill out the form and upload an image
3. Submit the form
4. Check your R2 bucket to see the uploaded image

## Troubleshooting

### CORS Errors
- Make sure CORS is configured correctly
- Check that your origin matches (localhost vs 127.0.0.1)
- Verify the allowed methods include PUT and POST

### Authentication Errors
- Double-check your access key ID and secret access key
- Ensure the API token has correct permissions
- Verify the endpoint URL format

### 403 Forbidden
- Check bucket permissions
- Verify API token has access to the specific bucket
- Ensure token hasn't expired

## Public Access (Optional)

To make images publicly accessible:

1. Go to your bucket settings
2. Enable **Public Access**
3. Or create a custom domain for your bucket

Then images will be accessible at:
`https://pub-XXXXXX.r2.dev/your-image.jpg`

Or with custom domain:
`https://cdn.yourdomain.com/your-image.jpg`
