// Supabase Configuration
const SUPABASE_URL = 'https://cptyulgugrykwgltriom.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdHl1bGd1Z3J5a3dnbHRyaW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzgwMjIsImV4cCI6MjA4Mzg1NDAyMn0.PywFZSO1508wLPG2ix7aAQGqXROHIF9VkTkgXaPgupg';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let allPrompts = [];
let currentFilter = 'all';
let displayedPrompts = 8;
const promptsPerLoad = 4;

// Initialize the gallery
async function initGallery() {
    console.log('🚀 Initializing gallery...');
    await fetchPromptsFromSupabase();
    renderPrompts();
    setupEventListeners();
}

// Fetch prompts from Supabase
async function fetchPromptsFromSupabase() {
    try {
        console.log('📡 Fetching prompts from Supabase...');
        const { data, error } = await supabaseClient
            .from('prompts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
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
            imageUrl: item.image_url || 'https://via.placeholder.com/400x500?text=No+Image',
            platform: item.model_name || 'AI',
            category: item.tags && item.tags.length > 0 ? item.tags[0] : 'General',
            tags: item.tags || [],
            creator: item.creator || 'Anonymous',
            notes: item.notes || ''
        }));
        
        console.log(`✅ Loaded ${allPrompts.length} prompts from database`);
        
        if (allPrompts.length === 0) {
            console.warn('⚠️ No active prompts found in database');
            showNotification('No prompts available yet. Submit some prompts!');
        }
    } catch (err) {
        console.error('❌ Exception fetching prompts:', err);
        allPrompts = [];
    }
}

// Render prompts to the gallery
function renderPrompts() {
    const galleryGrid = document.getElementById('galleryGrid');
    const filteredPrompts = filterPrompts();
    const promptsToShow = filteredPrompts.slice(0, displayedPrompts);
    
    galleryGrid.innerHTML = '';
    
    if (promptsToShow.length === 0) {
        galleryGrid.innerHTML = '<div style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;"><p style="font-size: 18px; color: #666;">No prompts found. Be the first to submit one!</p></div>';
        return;
    }
    
    promptsToShow.forEach(prompt => {
        const card = createPromptCard(prompt);
        galleryGrid.appendChild(card);
    });
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (displayedPrompts >= filteredPrompts.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Filter prompts based on current filter
function filterPrompts() {
    if (currentFilter === 'all') {
        return allPrompts;
    }
    return allPrompts.filter(prompt => 
        prompt.platform.toLowerCase().replace(/\s+/g, '-') === currentFilter
    );
}

// Create a prompt card element
function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;
    
    // Get first 2 tags
    const displayTags = prompt.tags ? prompt.tags.slice(0, 2) : [];
    
    card.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${prompt.imageUrl}" alt="${prompt.title}" class="card-image" loading="lazy">
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
                    <button class="copy-btn" onclick="event.stopPropagation(); copyPrompt(${prompt.id})">
                        Copy
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Beautiful image loading
    const img = card.querySelector('.card-image');
    const imgWrapper = card.querySelector('.card-image-wrapper');
    
    if (img && imgWrapper) {
        // Add fade-in animation when image loads
        img.addEventListener('load', () => {
            imgWrapper.classList.add('loaded');
        });
        
        // If image is already cached/loaded
        if (img.complete) {
            imgWrapper.classList.add('loaded');
        }
    }
    
    // Smooth card entrance
    setTimeout(() => {
        card.classList.add('visible');
    }, 50);
    
    // Click to open detail page
    card.addEventListener('click', () => navigateToPromptPage(prompt.id));
    
    return card;
}

// Navigate to prompt detail page
function navigateToPromptPage(promptId) {
    window.location.href = `/promptdetails.html?id=${promptId}`;
}

// Save prompt functionality
function savePrompt(promptId) {
    showNotification('Save feature coming soon! ❤️');
    console.log('Save prompt:', promptId);
}

// Copy prompt to clipboard
function copyPrompt(promptId) {
    const prompt = allPrompts.find(p => p.id === promptId);
    if (prompt) {
        const promptText = prompt.prompt;
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(promptText).then(() => {
                showNotification('Prompt copied! 📋');
            }).catch(err => {
                // Fallback method
                copyToClipboardFallback(promptText);
            });
        } else {
            // Use fallback for older browsers
            copyToClipboardFallback(promptText);
        }
    }
}

// Fallback copy method
function copyToClipboardFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showNotification('Prompt copied! 📋');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showNotification('Failed to copy');
    }
    document.body.removeChild(textArea);
}

// Show notification
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

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                displayedPrompts = 8;
                renderPrompts();
            });
        });
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayedPrompts += promptsPerLoad;
            renderPrompts();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Newsletter subscription (handled by newsletter.js)
    const subscribeBtn = document.querySelector('.subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', handleSubscribe);
    }
    
    // Navigation active state management
    const navLinks = document.querySelectorAll('.nav-links a');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Only prevent default for anchor links on the same page
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                }
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }
}

// Search handler
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Searching for:', searchTerm);
    // TODO: Implement search functionality with Supabase
}

// Newsletter subscription handler
function handleSubscribe() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value;
    
    if (email && validateEmail(email)) {
        console.log('Subscribing email:', email);
        // TODO: Implement newsletter subscription with Supabase
        alert('Thank you for subscribing!');
        emailInput.value = '';
    } else {
        alert('Please enter a valid email address.');
    }
}

// Utility function: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility function: Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ DOM loaded, initializing gallery...');
    initGallery();
});
