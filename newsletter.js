// Newsletter Subscription Handler
// This script handles email signups for the weekly newsletter

// Initialize Supabase client (using existing configuration)
let newsletterSupabaseClient;

// Initialize the client when DOM is ready. Prefer single shared client to avoid LockManager / multiple GoTrueClient.
function initNewsletterClient() {
    if (window.ReddySupabase) {
        newsletterSupabaseClient = window.ReddySupabase;
        return;
    }
    if (typeof supabaseClient !== 'undefined') {
        newsletterSupabaseClient = supabaseClient;
        return;
    }
    if (typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        newsletterSupabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        return;
    }
    if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
        newsletterSupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

// Handle newsletter form submission
async function handleNewsletterSubmit(email, messageElementId, formId, inputElementId) {
    const messageElement = document.getElementById(messageElementId);
    const submitButton = document.querySelector(`#${formId} button[type="submit"]`);
    const inputElement = document.getElementById(inputElementId);
    const originalButtonText = submitButton ? submitButton.textContent : 'Subscribe';
    
    try {
        // Ensure Supabase client is initialized (e.g. on About page after config.js loads)
        if (!newsletterSupabaseClient) {
            initNewsletterClient();
        }
        if (!newsletterSupabaseClient) {
            showNewsletterMessage(messageElement, 'Newsletter service is not available. Please try again later.', 'error');
            return;
        }
        
        // Disable button and show loading state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Subscribing...';
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNewsletterMessage(messageElement, 'Please enter a valid email address', 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
            return;
        }
        
        // Check if email already exists (without .single() to avoid 406 errors)
        const { data: existingSubscribers, error: checkError } = await newsletterSupabaseClient
            .from('newsletter_subscribers')
            .select('email')
            .eq('email', email.toLowerCase())
            .limit(1);
        
        // If checkError and it's not a "no rows" error, show error
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Newsletter check error:', checkError);
            showNewsletterMessage(messageElement, 'Error checking subscription. Please try again.', 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
            return;
        }
        
        // If subscriber exists
        if (existingSubscribers && existingSubscribers.length > 0) {
            showNewsletterMessage(messageElement, 'You\'re already subscribed! 📧', 'info');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
            return;
        }
        
        // Insert new subscriber
        const { data, error } = await newsletterSupabaseClient
            .from('newsletter_subscribers')
            .insert([
                {
                    email: email.toLowerCase(),
                    subscribed_at: new Date().toISOString(),
                    is_active: true,
                    source: window.location.pathname
                }
            ]);
        
        if (error) {
            console.error('Newsletter subscription error:', error);
            showNewsletterMessage(messageElement, 'Oops! Something went wrong. Please try again.', 'error');
        } else {
            showNewsletterMessage(messageElement, 'Success! You\'re subscribed. 📧', 'success');
            // Clear the email input
            if (inputElement) {
                inputElement.value = '';
            }
        }
        
    } catch (err) {
        console.error('Newsletter exception:', err);
        showNewsletterMessage(messageElement, 'Error subscribing. Please try again later.', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

// Show message to user
function showNewsletterMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.style.opacity = '1';
    element.classList.add('show');
    element.classList.remove('ok', 'err');
    if (type === 'error') {
        element.classList.add('err');
        element.style.color = '#c0123c';
    } else if (type === 'info') {
        element.style.color = '#b8860b';
    } else {
        element.classList.add('ok');
        element.style.color = '#0a7a3e';
    }
    setTimeout(() => {
        element.style.opacity = '0';
        element.classList.remove('show');
    }, 5000);
}

// Setup newsletter form listeners
function setupNewsletterForms() {
    // Initialize Supabase client
    initNewsletterClient();
    
    // Home page newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            await handleNewsletterSubmit(email, 'newsletterMessage', 'newsletterForm', 'newsletterEmail');
        });
    }
    
    // About page newsletter form
    const newsletterFormAbout = document.getElementById('newsletterFormAbout');
    if (newsletterFormAbout) {
        newsletterFormAbout.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmailAbout').value;
            await handleNewsletterSubmit(email, 'newsletterMessageAbout', 'newsletterFormAbout', 'newsletterEmailAbout');
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNewsletterForms);
} else {
    setupNewsletterForms();
}
