// Config is loaded from config.js script tag
// Initialize Supabase client
const { createClient } = window.supabase || {};
let supabaseClient;

// Check if Supabase is loaded
if (createClient) {
    supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);
}

// DOM Elements
const form = document.getElementById('submitForm');
const titleInput = document.getElementById('title');
const titleCount = document.getElementById('titleCount');
const imageUpload = document.getElementById('imageUpload');
const uploadArea = document.getElementById('uploadArea');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');
const submitBtn = document.getElementById('submitBtn');

let selectedFile = null;

// Character counter for title
titleInput.addEventListener('input', () => {
    titleCount.textContent = titleInput.value.length;
});

// Upload area click handler
uploadArea.addEventListener('click', (e) => {
    if (e.target !== removeImageBtn && !removeImageBtn.contains(e.target)) {
        imageUpload.click();
    }
});

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#000';
    uploadArea.style.background = '#fafafa';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFileSelect(files[0]);
    }
});

// File input change handler
imageUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Handle file selection
function handleFileSelect(file) {
    // Check file size (30MB max)
    if (file.size > 30 * 1024 * 1024) {
        showNotification('File size must be less than 30MB');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        uploadPlaceholder.style.display = 'none';
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove image handler
removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    imageUpload.value = '';
    uploadPlaceholder.style.display = 'flex';
    imagePreview.style.display = 'none';
    previewImg.src = '';
});

// Upload to Cloudflare R2 using S3 API
async function uploadToCloudflare(file) {
    try {
        console.log('=== UPLOAD STARTING ===');
        console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Check if AWS SDK is loaded
        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded. Check if script tag is present.');
        }
        console.log('✓ AWS SDK loaded');
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        console.log('Generated filename:', fileName);
        
        // Log configuration (without secrets)
        console.log('R2 Config:', {
            endpoint: cloudflareConfig.endpoint,
            bucket: cloudflareConfig.bucketName,
            region: cloudflareConfig.region,
            publicUrl: cloudflareConfig.publicUrl,
            hasAccessKey: !!cloudflareConfig.accessKeyId,
            hasSecretKey: !!cloudflareConfig.secretAccessKey
        });
        
        // Configure AWS SDK for Cloudflare R2
        const s3 = new AWS.S3({
            endpoint: cloudflareConfig.endpoint,
            accessKeyId: cloudflareConfig.accessKeyId,
            secretAccessKey: cloudflareConfig.secretAccessKey,
            region: cloudflareConfig.region,
            signatureVersion: 'v4',
            s3ForcePathStyle: true
        });
        console.log('✓ S3 client configured');
        
        // Upload parameters
        const uploadParams = {
            Bucket: cloudflareConfig.bucketName,
            Key: fileName,
            Body: file,
            ContentType: file.type,
            ACL: 'public-read' // Make file publicly accessible
        };
        
        console.log('Starting S3 upload...');
        
        // Perform upload using putObject (wrapped in Promise)
        const result = await new Promise((resolve, reject) => {
            s3.putObject(uploadParams, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        ...data,
                        Location: `${cloudflareConfig.publicUrl}/${fileName}`,
                        Key: fileName,
                        Bucket: cloudflareConfig.bucketName
                    });
                }
            });
        });
        
        console.log('✓✓✓ UPLOAD SUCCESSFUL ✓✓✓');
        console.log('Result:', result);
        
        // Return the public URL
        const baseUrl = cloudflareConfig.publicUrl || `${cloudflareConfig.endpoint}/${cloudflareConfig.bucketName}`;
        const finalUrl = `${baseUrl}/${fileName}`;
        console.log('Final URL:', finalUrl);
        
        return finalUrl;
        
    } catch (error) {
        console.error('❌❌❌ UPLOAD FAILED ❌❌❌');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        // Show error to user
        let errorMessage = 'Failed to upload image';
        
        if (error.message.includes('AWS SDK not loaded')) {
            errorMessage = 'AWS SDK not loaded. Please refresh the page.';
        } else if (error.code === 'NetworkingError') {
            errorMessage = 'Network error. Check your internet connection and CORS settings.';
        } else if (error.code === 'InvalidAccessKeyId') {
            errorMessage = 'Invalid R2 access key. Check config.js credentials.';
        } else if (error.code === 'SignatureDoesNotMatch') {
            errorMessage = 'Invalid R2 secret key. Check config.js credentials.';
        } else if (error.message) {
            errorMessage = `Upload failed: ${error.message}`;
        }
        
        throw new Error(errorMessage);
    }
}

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button
    submitBtn.disabled = true;
    document.querySelector('.btn-text').style.display = 'none';
    document.querySelector('.btn-loader').style.display = 'inline';
    
    try {
        // Get form data
        const formData = {
            prompt: document.getElementById('prompt').value || null,
            title: document.getElementById('title').value || null,
            model_name: document.getElementById('modelName').value || null,
            creator: document.getElementById('creator').value || null,
            notes: document.getElementById('notes').value || null,
            tags: document.getElementById('tags').value 
                ? document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
                : [],
            is_active: false // Default to inactive, admin will activate
        };
        
        // Upload image if selected
        let imageUrl = null;
        if (selectedFile) {
            try {
                console.log('📤 Uploading image to Cloudflare R2...');
                imageUrl = await uploadToCloudflare(selectedFile);
                formData.image_url = imageUrl;
                console.log('✓ Image uploaded successfully:', imageUrl);
            } catch (error) {
                console.error('❌ Image upload failed:', error);
                // For now, continue without image instead of blocking submission
                showNotification('Warning: Image upload failed. Submitting without image.', 'error');
                // Don't throw - allow submission to continue
            }
        }
        
        // Save to Supabase
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized. Please include Supabase JS library.');
        }
        
        const { data, error } = await supabaseClient
            .from('prompts')
            .insert([formData])
            .select();
        
        if (error) throw error;
        
        // Success
        showNotification('Prompt submitted successfully! It will be reviewed before going live.', 'success');
        
        // Reset form after short delay
        setTimeout(() => {
            form.reset();
            titleCount.textContent = '0';
            if (selectedFile) {
                removeImageBtn.click();
            }
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Submission error:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        document.querySelector('.btn-text').style.display = 'inline';
        document.querySelector('.btn-loader').style.display = 'none';
    }
});

// Show notification (reuse from main script)
function showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    
    const notification = document.createElement('div');
    notification.textContent = message;
    
    // Different colors for different types
    const bgColor = type === 'error' ? 'rgba(255, 68, 68, 0.95)' : 
                   type === 'success' ? 'rgba(0, 255, 0, 0.95)' : 
                   'rgba(255, 255, 255, 0.95)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${bgColor};
        color: #000;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 13px;
        letter-spacing: 0.3px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        font-weight: 500;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: 90%;
        cursor: pointer;
        word-wrap: break-word;
    `;
    
    // Click to dismiss
    notification.title = 'Click to dismiss';
    notification.onclick = () => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 400);
    };
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Keep errors visible longer (15 seconds), others shorter (4 seconds)
    const duration = type === 'error' ? 15000 : 4000;
    
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 400);
    }, duration);
}
