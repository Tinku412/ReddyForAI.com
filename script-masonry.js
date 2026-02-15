// Supabase Configuration
const SUPABASE_URL = 'https://cptyulgugrykwgltriom.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdHl1bGd1Z3J5a3dnbHRyaW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzgwMjIsImV4cCI6MjA4Mzg1NDAyMn0.PywFZSO1508wLPG2ix7aAQGqXROHIF9VkTkgXaPgupg';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// No mock data - using only database images

// State management
let currentPage = 1;
let allPrompts = [];
let isLoading = false;
let currentPrompt = null;

// Fetch prompts from Supabase (optional filter: set window.PROMPT_MODEL_FILTER e.g. 'Gemini', 'ChatGPT')
async function fetchPromptsFromSupabase() {
    try {
        const modelFilter = typeof window.PROMPT_MODEL_FILTER !== 'undefined' ? window.PROMPT_MODEL_FILTER : null;
        console.log('📡 Fetching prompts from Supabase...' + (modelFilter ? ` (filter: ${modelFilter})` : ''));
        
        let query = supabaseClient
            .from('prompts')
            .select('*')
            .eq('is_active', true);
        
        if (modelFilter) {
            query = query.eq('model_name', modelFilter);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error fetching prompts:', error);
            allPrompts = [];
            return;
        }
        
        // Transform database data to match expected format
        allPrompts = (data || []).map(item => ({
            id: item.id,
            title: item.title || 'Untitled',
            prompt: item.prompt || '',
            image_url: item.image_url || 'https://via.placeholder.com/400x500?text=No+Image',
            model_name: item.model_name || 'AI',
            platform: item.model_name || 'AI',
            category: item.tags && item.tags.length > 0 ? item.tags[0] : 'General',
            tags: item.tags || [],
            creator: item.creator || 'Anonymous',
            notes: item.notes || ''
        }));
        
        console.log(`✅ Loaded ${allPrompts.length} prompts from database`);
        
        if (allPrompts.length === 0) {
            console.warn('⚠️ No active prompts in database');
        }
    } catch (err) {
        console.error('❌ Exception fetching prompts:', err);
        allPrompts = [];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✨ DOM loaded, initializing masonry gallery...');
    
    // Fetch data from Supabase first
    await fetchPromptsFromSupabase();
    
    // Render all prompts without duplication
    renderPrompts(allPrompts);
    setupInfiniteScroll();
    setupEventListeners();
    
    // Check for deep link after rendering
    handleDeepLink();
    
    console.log('✅ Gallery initialized with', allPrompts.length, 'prompts');
});

// Render prompt cards with Pinterest-style hover
function renderPrompts(prompts) {
    const gallery = document.getElementById('galleryGrid');
    
    prompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.dataset.promptId = prompt.id;
        
        // Get first 2 tags
        const displayTags = prompt.tags ? prompt.tags.slice(0, 2) : [];
        
        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${prompt.image_url}" alt="${prompt.title}" class="card-image" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <button class="save-btn" onclick="event.stopPropagation(); savePrompt(${prompt.id})">Save</button>
                </div>
                <div class="card-footer">
                    ${displayTags.length > 0 ? `
                        <div class="card-tags">
                            ${displayTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <p class="card-prompt">${prompt.prompt}</p>
                    <div class="card-actions">
                        <button class="copy-btn" onclick="event.stopPropagation(); copyPrompt('${prompt.prompt.replace(/'/g, "\\'")}')">
                            Copy
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Beautiful image loading - immediately mark as loaded to prevent layout shift
        const img = card.querySelector('.card-image');
        const imgWrapper = card.querySelector('.card-image-wrapper');
        
        if (img && imgWrapper) {
            // Mark as loaded immediately to prevent shimmer animation from causing layout shifts
            imgWrapper.classList.add('loaded');
            
            // Add fade-in animation when image loads
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
            
            // If image is already cached/loaded
            if (img.complete) {
                img.style.opacity = '1';
            }
        }
        
        // Card is visible immediately
        card.classList.add('visible');
        
        // Click to open modal
        card.addEventListener('click', () => navigateToPromptPage(prompt.id));
        
        gallery.appendChild(card);
    });
}

// Open Pinterest-style modal
// Navigate to prompt detail page
function navigateToPromptPage(promptId) {
    window.location.href = `/promptdetails.html?id=${promptId}`;
}

// Render single prompt detail view (full page)
function renderPromptDetailView(prompt) {
    console.log('🎨 Rendering detail view for:', prompt.title);
    console.log('📷 Image URL:', prompt.image_url);
    
    const mainContent = document.querySelector('.main-content');
    const gallery = document.getElementById('galleryGrid');
    const container = document.querySelector('.container-full');
    
    // Hide gallery title
    const title = document.querySelector('.gallery-title');
    if (title) title.style.display = 'none';
    
    // Remove masonry styles from container and gallery
    if (container) {
        container.style.maxWidth = '100%';
        container.style.padding = '0';
    }
    
    // Clear and reset gallery styles completely
    gallery.innerHTML = '';
    gallery.style.columnCount = '1';
    gallery.style.columns = '1';
    gallery.style.maxWidth = '100%';
    gallery.style.width = '100%';
    gallery.style.margin = '0';
    gallery.style.padding = '0';
    gallery.style.display = 'block';
    gallery.classList.remove('gallery-masonry');
    
    // Create detail view
    const detailView = document.createElement('div');
    detailView.className = 'prompt-detail-page';
    detailView.innerHTML = `
        <div class="detail-header">
            <button class="back-btn" onclick="window.location.href='${window.location.pathname}'">
                ← Back to Gallery
            </button>
            <button class="share-btn" onclick="sharePrompt('${prompt.id}')">
                📤 Share
            </button>
        </div>
        
        <div class="detail-main">
            <div class="detail-image-section">
                <img src="${prompt.image_url}" alt="${prompt.title}" class="detail-image">
            </div>
            
            <div class="detail-info-section">
                <h1 class="detail-title">${prompt.title}</h1>
                
                <div class="detail-meta">
                    <div class="meta-item">
                        <span class="meta-label">Model:</span>
                        <span class="meta-value">${prompt.model_name || prompt.platform || 'AI'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Creator:</span>
                        <span class="meta-value">${prompt.creator || 'Anonymous'}</span>
                    </div>
                </div>
                
                ${prompt.tags && prompt.tags.length > 0 ? `
                    <div class="detail-tags">
                        ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="detail-prompt-box">
                    <h3>Prompt:</h3>
                    <p class="prompt-text">${prompt.prompt}</p>
                    <button class="copy-btn-large" onclick="copyPromptText(\`${prompt.prompt.replace(/`/g, '\\`')}\`)">
                        📋 Copy Prompt
                    </button>
                </div>
                
                ${prompt.notes ? `
                    <div class="detail-notes">
                        <h3>Notes:</h3>
                        <p>${prompt.notes}</p>
                    </div>
                ` : ''}
                
                <button class="save-btn-large" onclick="savePrompt('${prompt.id}')">
                    ❤️ Save to Collection
                </button>
            </div>
        </div>
        
        <div class="related-section">
            <h2>More like this</h2>
            <div class="related-grid" id="relatedGrid"></div>
        </div>
    `;
    
    gallery.appendChild(detailView);
    
    // Load related prompts
    loadRelatedPrompts(prompt);
}

// Load related prompts for detail view
function loadRelatedPrompts(currentPrompt) {
    const relatedGrid = document.getElementById('relatedGrid');
    if (!relatedGrid) return;
    
    // Get 12 related prompts
    const related = allPrompts
        .filter(p => p.id !== currentPrompt.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 12);
    
    related.forEach(prompt => {
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
        
        // Beautiful image loading for related images
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
        
        card.addEventListener('click', () => navigateToPromptPage(prompt.id));
        relatedGrid.appendChild(card);
    });
}

// Share prompt - Copy link to clipboard
function sharePrompt(promptId) {
    const url = `${window.location.origin}${window.location.pathname}?prompt=${promptId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied! Share it anywhere 📋✨');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy link');
        });
    } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Link copied! Share it anywhere 📋✨');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showNotification('Failed to copy link');
        }
        document.body.removeChild(textArea);
    }
}

// Copy prompt text
function copyPromptText(promptText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText).then(() => {
            showNotification('Prompt copied! 📋');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy prompt');
        });
    } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Prompt copied! 📋');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showNotification('Failed to copy prompt');
        }
        document.body.removeChild(textArea);
    }
}

// Placeholder for save function (implement later)
function savePrompt(promptId) {
    showNotification('Save feature coming soon! ❤️');
    console.log('Save prompt:', promptId);
}

// Handle deep linking - Check URL for prompt parameter on page load
async function handleDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const promptId = urlParams.get('prompt');
    
    if (promptId) {
        console.log('🔗 Deep link detected:', promptId);
        
        // Wait for data to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the prompt (handle both string and numeric IDs)
        const prompt = allPrompts.find(p => String(p.id) === String(promptId));
        
        if (prompt) {
            console.log('✅ Found prompt, showing detail page...');
            renderPromptDetailView(prompt);
        } else {
            console.warn('⚠️ Prompt not found for ID:', promptId);
            showNotification('Prompt not found');
            // Redirect to main page after 2 seconds
            setTimeout(() => {
                window.location.href = window.location.pathname;
            }, 2000);
        }
    }
}

// Copy prompt functionality
function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Prompt copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy prompt', 'error');
    });
}


// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    const bgColor = type === 'error' ? 'rgba(255, 68, 68, 0.95)' : 
                   type === 'success' ? 'rgba(0, 200, 0, 0.95)' : 
                   'rgba(255, 255, 255, 0.95)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${bgColor};
        color: ${type === 'success' || type === 'error' ? '#fff' : '#000'};
        padding: 14px 24px;
        border-radius: 24px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
    `;
    
    notification.onclick = () => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 400);
    };
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Infinite Scroll
function setupInfiniteScroll() {
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        // Check if near bottom (within 500px)
        if (scrollTop + clientHeight >= scrollHeight - 500 && !isLoading && scrollTop > lastScrollTop) {
            loadMorePrompts();
        }
        
        lastScrollTop = scrollTop;
    });
}

// Load more prompts (infinite scroll)
async function loadMorePrompts() {
    if (isLoading) return;
    
    isLoading = true;
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.classList.add('active');
    
    try {
        currentPage++;
        const offset = (currentPage - 1) * promptsPerPage;
        
        const { data, error } = await supabaseClient
            .from('prompts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + promptsPerPage - 1);
        
        if (error) {
            console.error('❌ Error loading more prompts:', error);
            if (loadingIndicator) loadingIndicator.classList.remove('active');
            isLoading = false;
            return;
        }
        
        if (data && data.length > 0) {
            const newPrompts = data.map(item => ({
                id: item.id,
                title: item.title || 'Untitled',
                prompt: item.prompt || '',
                image_url: item.image_url,
                model_name: item.model_name || 'AI',
                platform: item.model_name || 'AI',
                category: item.tags && item.tags.length > 0 ? item.tags[0] : 'General',
                tags: item.tags || [],
                creator: item.creator || 'Anonymous',
                notes: item.notes || ''
            }));
            
            allPrompts = [...allPrompts, ...newPrompts];
            renderPrompts(newPrompts);
        }
        
        if (loadingIndicator) {
            setTimeout(() => {
                loadingIndicator.classList.remove('active');
                isLoading = false;
            }, 500);
        } else {
            isLoading = false;
        }
    } catch (err) {
        console.error('❌ Exception loading more prompts:', err);
        if (loadingIndicator) loadingIndicator.classList.remove('active');
        isLoading = false;
    }
}

// "More" button functionality
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        loadMorePrompts();
    });
}

// Close modal on outside click
document.getElementById('promptModal').addEventListener('click', (e) => {
    if (e.target.id === 'promptModal') {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('promptModal').classList.contains('active')) {
        closeModal();
    }
});

// Additional event listeners setup
function setupEventListeners() {
    // Any additional global event listeners can be added here
}

console.log('Pinterest-style masonry layout initialized with infinite scroll! 🎨');
