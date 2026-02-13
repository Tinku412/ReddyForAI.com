# Making R2 Images Publicly Accessible

After uploading images to R2, you need to make them accessible. You have 3 options:

---

## Option 1: Enable Public Access (Easiest)

### In Cloudflare R2 Dashboard:

1. Go to your **images** bucket
2. Click on **Settings** tab
3. Scroll to **Public Access** section
4. Click **"Enable Public Access"**
5. You'll get a public URL like: `https://pub-xxxxx.r2.dev`

### Update submit.js to use public URL:

After enabling public access, you'll see a URL like:
```
https://pub-a1b2c3d4e5f6.r2.dev
```

Update the return statement in `uploadToCloudflare` function:

```javascript
// Instead of:
return `${cloudflareConfig.endpoint}/${cloudflareConfig.bucketName}/${fileName}`;

// Use:
return `https://pub-YOUR_PUBLIC_ID.r2.dev/${fileName}`;
```

**⚠️ Important:** Anyone with the URL can access the files!

---

## Option 2: Custom Domain (Production Recommended)

### Setup:

1. In R2 bucket settings, go to **Custom Domains**
2. Click **"Connect Domain"**
3. Enter your domain: `cdn.yourdomain.com`
4. Follow DNS setup instructions
5. Wait for DNS propagation

### Update submit.js:

```javascript
return `https://cdn.yourdomain.com/${fileName}`;
```

**Benefits:**
- Professional URLs
- Your domain control
- Better SEO

---

## Option 3: Presigned URLs (Most Secure)

For sensitive content, use presigned URLs that expire:

```javascript
async function uploadToCloudflare(file) {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const s3 = new AWS.S3({
        endpoint: cloudflareConfig.endpoint,
        accessKeyId: cloudflareConfig.accessKeyId,
        secretAccessKey: cloudflareConfig.secretAccessKey,
        region: cloudflareConfig.region,
        signatureVersion: 'v4',
        s3ForcePathStyle: true
    });
    
    // Upload without public ACL
    const uploadParams = {
        Bucket: cloudflareConfig.bucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type
        // No ACL - private by default
    };
    
    await s3.upload(uploadParams).promise();
    
    // Generate presigned URL (valid for 7 days)
    const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: cloudflareConfig.bucketName,
        Key: fileName,
        Expires: 604800 // 7 days in seconds
    });
    
    return signedUrl;
}
```

**When to use:** Private content, temporary access

---

## Quick Test

After setup, test the upload:

1. Go to submit.html
2. Upload an image
3. Check browser console for upload logs
4. Check R2 bucket - file should appear
5. Try opening the returned URL in browser

---

## Troubleshooting

### Error: "Access Denied"
- Enable Public Access on bucket, OR
- Use presigned URLs

### Error: "NoSuchBucket"
- Check bucket name in config.js
- Verify bucket exists in R2

### Error: "SignatureDoesNotMatch"
- Check accessKeyId and secretAccessKey
- Regenerate API token if needed

### Images upload but don't display
- Enable Public Access, OR
- Set up Custom Domain, OR
- Use presigned URLs

### CORS Error in console
- Add CORS policy to R2 bucket
- Include your domain in AllowedOrigins
- Make sure AllowedMethods includes PUT

---

## Current Config Status

Based on your screenshot, you need to:

1. ✅ Bucket created: `images`
2. ✅ Location: Eastern North America
3. ❌ **CORS Policy: ADD THIS** (see main instructions)
4. ❌ **Public Access: ENABLE THIS** (or use custom domain)

---

## Recommended for You

**For Development:**
- Enable Public Access
- Use the pub-xxxxx.r2.dev URL

**For Production:**
- Set up Custom Domain
- Use your own domain like cdn.promptwerk.com
- Better for branding and SEO

---

## Final Code Update

After enabling Public Access, update config.js:

```javascript
export const cloudflareConfig = {
    accountId: '80bb47b297958d6229b1c08e9d6cc43c',
    bucketName: 'images',
    accessKeyId: '651c692a0ad9a564fe849467032d0e24',
    secretAccessKey: 'f87a2ad73fad85b5833fe737467566c8e487a9051a9663122a49fd4b7a9873a7',
    endpoint: 'https://80bb47b297958d6229b1c08e9d6cc43c.r2.cloudflarestorage.com',
    region: 'auto',
    // Add your public URL after enabling public access
    publicUrl: 'https://pub-YOUR_ID.r2.dev'
};
```

Then in submit.js:

```javascript
// Return public URL instead of S3 endpoint
return `${cloudflareConfig.publicUrl}/${fileName}`;
```
