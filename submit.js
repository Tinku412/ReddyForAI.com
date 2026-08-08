// Config is loaded from config.js script tag. Use shared client when available (e.g. from auth.js on other pages).
const { createClient } = window.supabase || {};
let supabaseClient = window.ReddySupabase;
if (!supabaseClient && createClient && supabaseConfig) {
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

// Upload image to Supabase Storage
async function uploadImage(file) {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized.');
    }

    const bucket = (typeof supabaseConfig !== 'undefined' && supabaseConfig.storageBucket)
        ? supabaseConfig.storageBucket
        : 'prompt-images';
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, file, {
            contentType: file.type || 'image/jpeg',
            upsert: false
        });

    if (error) {
        throw new Error(error.message || 'Failed to upload image');
    }

    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
    if (!data || !data.publicUrl) {
        throw new Error('Upload succeeded but public URL was not returned.');
    }
    return data.publicUrl;
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
        if (selectedFile) {
            try {
                formData.image_url = await uploadImage(selectedFile);
            } catch (error) {
                console.error('Image upload failed:', error);
                showNotification('Warning: Image upload failed. Submitting without image.', 'error');
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
