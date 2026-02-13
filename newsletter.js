// Newsletter Subscription Handler
// This script handles email signups for the weekly newsletter

// Initialize Supabase client (using existing configuration)
let newsletterSupabaseClient;

// Initialize the client when DOM is ready
function initNewsletterClient() {
    if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
        newsletterSupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof supabaseClient !== 'undefined') {
        newsletterSupabaseClient = supabaseClient;
    }
}

// Handle newsletter form submission
async function handleNewsletterSubmit(email, messageElementId, formId, inputElementId) {
    const messageElement = document.getElementById(messageElementId);
    const submitButton = document.querySelector(`#${formId} button[type="submit"]`);
    const inputElement = document.getElementById(inputElementId);
    const originalButtonText = submitButton.textContent;
    
    try {
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Subscribing...';
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNewsletterMessage(messageElement, 'Please enter a valid email address', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
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
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }
        
        // If subscriber exists
        if (existingSubscribers && existingSubscribers.length > 0) {
            showNewsletterMessage(messageElement, 'You\'re already subscribed! 📧', 'info');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
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
            showNewsletterMessage(messageElement, 'Success!', 'success');
            // Clear the email input
            if (inputElement) {
                inputElement.value = '';
            }
        }
        
    } catch (err) {
        console.error('Newsletter exception:', err);
        showNewsletterMessage(messageElement, 'Error subscribing. Please try again later.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Show message to user
function showNewsletterMessage(element, message, type) {
    element.textContent = message;
    element.style.opacity = '1';
    element.style.color = type === 'error' ? '#ff6b6b' : type === 'info' ? '#ffd93d' : '#6bcf7f';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        element.style.opacity = '0';
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
