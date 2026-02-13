// Initialize Supabase client
const supabaseClient = supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

// Get prompt ID from URL
const urlParams = new URLSearchParams(window.location.search);
const promptId = urlParams.get('id');

// Store all prompts for related section
let allPrompts = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (promptId) {
        loadPromptDetails(promptId);
    } else {
        showNotification('No prompt ID provided', 'error');
        setTimeout(() => {
            window.location.href = 'index-masonry.html';
        }, 2000);
    }
});

// Load prompt details from Supabase
async function loadPromptDetails(id) {
    try {
        console.log('📡 Loading prompt:', id);
        
        // Fetch specific prompt
        const { data: prompt, error } = await supabaseClient
            .from('prompts')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();
        
        if (error) {
            console.error('❌ Error loading prompt:', error);
            showNotification('Prompt not found', 'error');
            setTimeout(() => {
                window.location.href = 'index-masonry.html';
            }, 2000);
            return;
        }
        
        if (!prompt) {
            showNotification('Prompt not found', 'error');
            setTimeout(() => {
                window.location.href = 'index-masonry.html';
            }, 2000);
            return;
        }
        
        console.log('✅ Prompt loaded:', prompt);
        
        // Populate the page
        populatePromptDetails(prompt);
        
        // Load related prompts
        loadRelatedPrompts(id);
        
    } catch (err) {
        console.error('❌ Exception loading prompt:', err);
        showNotification('Error loading prompt', 'error');
    }
}

// Populate prompt details on the page
function populatePromptDetails(prompt) {
    // Define currentUrl at the top for use throughout the function
    const currentUrl = `https://reddyforai.com/promptdetails.html?id=${prompt.id}`;
    
    // Update page title
    const pageTitle = `${prompt.title} - AI Image Prompt | REDDY FOR AI`;
    document.getElementById('pageTitle').textContent = pageTitle;
    
    // Update breadcrumb
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = prompt.title;
    }
    
    // Update breadcrumb schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://reddyforai.com/index.html"
        },{
            "@type": "ListItem",
            "position": 2,
            "name": "Explore",
            "item": "https://reddyforai.com/ai-image-prompts.html"
        },{
            "@type": "ListItem",
            "position": 3,
            "name": prompt.title,
            "item": currentUrl
        }]
    };
    
    const breadcrumbSchemaElement = document.getElementById('breadcrumbSchema');
    if (breadcrumbSchemaElement) {
        breadcrumbSchemaElement.textContent = JSON.stringify(breadcrumbSchema);
    }
    
    // Update SEO meta tags dynamically
    const metaDescription = `${prompt.prompt.substring(0, 150)}... - AI image prompt for ${prompt.model_name || 'Midjourney, DALL-E, Stable Diffusion'}. Copy and use this prompt to create stunning AI-generated artwork.`;
    
    // Update description meta tags
    const descriptionMeta = document.getElementById('pageDescription');
    if (descriptionMeta) {
        descriptionMeta.setAttribute('content', metaDescription);
    }
    
    // Update Open Graph tags
    const ogTitle = document.getElementById('ogTitle');
    const ogDescription = document.getElementById('ogDescription');
    const ogImage = document.getElementById('ogImage');
    
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    if (ogDescription) ogDescription.setAttribute('content', metaDescription);
    if (ogImage) ogImage.setAttribute('content', prompt.image_url || 'https://reddyforai.com/og-image.jpg');
    
    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
        ogUrl.setAttribute('content', currentUrl);
    } else {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        ogUrl.setAttribute('content', currentUrl);
        document.head.appendChild(ogUrl);
    }
    
    // Update Twitter Card tags
    const twitterTitle = document.getElementById('twitterTitle');
    const twitterDescription = document.getElementById('twitterDescription');
    const twitterImage = document.getElementById('twitterImage');
    
    if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);
    if (twitterDescription) twitterDescription.setAttribute('content', metaDescription);
    if (twitterImage) twitterImage.setAttribute('content', prompt.image_url || 'https://reddyforai.com/twitter-image.jpg');
    
    // Update twitter:url
    let twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (!twitterUrl) {
        twitterUrl = document.createElement('meta');
        twitterUrl.setAttribute('property', 'twitter:url');
        document.head.appendChild(twitterUrl);
    }
    twitterUrl.setAttribute('content', currentUrl);
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);
    
    // Set image with beautiful loading
    const imageEl = document.getElementById('promptImage');
    const imageWrapper = imageEl.parentElement;
    
    // Add loading class initially
    if (imageWrapper) {
        imageWrapper.classList.remove('loaded');
    }
    
    imageEl.src = prompt.image_url || 'https://via.placeholder.com/600x800?text=No+Image';
    imageEl.alt = `${prompt.title} - AI image generated with ${prompt.model_name || 'AI'}`;
    
    // Add loaded class when image loads
    imageEl.addEventListener('load', () => {
        if (imageWrapper) {
            imageWrapper.classList.add('loaded');
        }
    });
    
    // If already cached
    if (imageEl.complete && imageWrapper) {
        imageWrapper.classList.add('loaded');
    }
    
    // Set title
    document.getElementById('promptTitle').textContent = prompt.title || 'Untitled';
    
    // Set model
    document.getElementById('promptModel').textContent = prompt.model_name || 'AI';
    
    // Set creator
    document.getElementById('promptCreator').textContent = prompt.creator || 'Anonymous';
    
    // Set prompt text
    document.getElementById('promptText').textContent = prompt.prompt || 'No prompt provided';
    
    // Set tags
    if (prompt.tags && prompt.tags.length > 0) {
        const tagsContainer = document.getElementById('tagsContainer');
        tagsContainer.style.display = 'flex';
        tagsContainer.innerHTML = prompt.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
    }
    
    // Set notes
    if (prompt.notes) {
        const notesContainer = document.getElementById('notesContainer');
        notesContainer.style.display = 'block';
        document.getElementById('promptNotes').textContent = prompt.notes;
    }
    
    // Setup copy button
    document.getElementById('copyBtn').addEventListener('click', () => {
        copyPromptText(prompt.prompt);
    });
    
    // Setup share button
    document.getElementById('shareBtn').addEventListener('click', () => {
        sharePrompt(prompt.id);
    });
    
    // Setup save button
    document.getElementById('saveBtn').addEventListener('click', () => {
        savePrompt(prompt.id);
    });
}

// Load related prompts
async function loadRelatedPrompts(currentId) {
    try {
        console.log('📡 Loading related prompts...');
        
        const { data, error } = await supabaseClient
            .from('prompts')
            .select('*')
            .eq('is_active', true)
            .neq('id', currentId)
            .order('created_at', { ascending: false })
            .limit(12);
        
        if (error) {
            console.error('❌ Error loading related prompts:', error);
            return;
        }
        
        console.log('✅ Loaded related prompts:', data.length);
        
        allPrompts = data || [];
        renderRelatedPrompts();
        
    } catch (err) {
        console.error('❌ Exception loading related prompts:', err);
    }
}

// Render related prompts with beautiful loading
function renderRelatedPrompts() {
    const grid = document.getElementById('relatedGrid');
    
    if (allPrompts.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666;">No related prompts found</p>';
        return;
    }
    
    grid.innerHTML = '';
    
    allPrompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'related-card';
        card.innerHTML = `
            <div class="related-image-wrapper">
                <img src="${prompt.image_url}" alt="${prompt.title}" class="related-image" loading="lazy">
            </div>
            <div class="related-overlay">
                <p class="related-title">${prompt.title}</p>
            </div>
        `;
        
        // Beautiful image loading
        const img = card.querySelector('.related-image');
        const imgWrapper = card.querySelector('.related-image-wrapper');
        
        if (img && imgWrapper) {
            img.addEventListener('load', () => {
                imgWrapper.classList.add('loaded');
            });
            
            if (img.complete) {
                imgWrapper.classList.add('loaded');
            }
        }
        
        card.addEventListener('click', () => {
            window.location.href = `promptdetails.html?id=${prompt.id}`;
        });
        
        grid.appendChild(card);
    });
}

// Copy prompt text to clipboard
function copyPromptText(text) {
    if (!text) {
        showNotification('No prompt text to copy', 'error');
        return;
    }
    
    // Try modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('Prompt copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopy(text);
            });
    } else {
        fallbackCopy(text);
    }
}

// Fallback copy method
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Prompt copied to clipboard!', 'success');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showNotification('Failed to copy. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Share prompt
function sharePrompt(id) {
    const shareUrl = `${window.location.origin}/promptdetails.html?id=${id}`;
    
    // Try modern share API
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('promptTitle').textContent,
            text: 'Check out this AI prompt!',
            url: shareUrl
        }).catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                copyToClipboard(shareUrl);
            }
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

// Copy URL to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('Link copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
                showNotification('Failed to copy link', 'error');
            });
    } else {
        fallbackCopy(text);
    }
}

// Save prompt (placeholder)
function savePrompt(id) {
    showNotification('Save feature coming soon!', 'info');
    console.log('Save prompt:', id);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
