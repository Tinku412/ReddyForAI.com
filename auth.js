/**
 * Auth + Save feature: Google OAuth and saved_prompts.
 * Load after Supabase script. Single shared client to avoid LockManager / multiple GoTrueClient.
 * Client is created after a short delay to reduce lock contention with any stale lock.
 */
(function() {
    const SUPABASE_URL = typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG
        ? SUPABASE_CONFIG.url
        : 'https://cptyulgugrykwgltriom.supabase.co';
    const SUPABASE_ANON_KEY = typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG
        ? SUPABASE_CONFIG.anonKey
        : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdHl1bGd1Z3J5a3dnbHRyaW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzgwMjIsImV4cCI6MjA4Mzg1NDAyMn0.PywFZSO1508wLPG2ix7aAQGqXROHIF9VkTkgXaPgupg';

    var supabase = null;

    function initClient() {
        if (supabase) return supabase;
        if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) return null;
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.ReddySupabase = supabase;
            window.dispatchEvent(new Event('reddy-supabase-ready'));
            return supabase;
        } catch (e) {
            console.warn('Auth: Supabase client init failed', e);
            return null;
        }
    }

    window.ReddySupabaseReady = function(cb) {
        if (window.ReddySupabase) { cb(window.ReddySupabase); return; }
        window.addEventListener('reddy-supabase-ready', function onReady() {
            window.removeEventListener('reddy-supabase-ready', onReady);
            cb(window.ReddySupabase);
        }, { once: true });
    };

    setTimeout(function() {
        initClient();
        if (supabase) refreshSession();
        if (!supabase) {
            console.warn('Auth: Supabase not loaded. Modal will still show; sign-in may fail until the page is refreshed.');
        }
    }, 0);

    let pendingSavePromptId = null;
    let authModalEl = null;
    let cachedSession = null;

    function sb() { return supabase || window.ReddySupabase || null; }

    async function refreshSession() {
        var client = sb();
        if (!client) return null;
        try {
            const { data: { session } } = await client.auth.getSession();
            cachedSession = session;
            return session;
        } catch (e) {
            cachedSession = null;
            return null;
        }
    }

    function getSession() {
        return cachedSession;
    }

    async function getSessionAsync() {
        if (cachedSession) return cachedSession;
        return refreshSession();
    }

    function isLoggedIn() {
        return !!cachedSession;
    }

    function createAuthModal() {
        if (authModalEl) return authModalEl;
        const div = document.createElement('div');
        div.id = 'auth-modal-overlay';
        div.className = 'auth-modal-overlay';
        div.setAttribute('aria-hidden', 'true');
        div.innerHTML = `
            <div class="auth-modal" role="dialog" aria-labelledby="auth-modal-title" aria-modal="true">
                <button type="button" class="auth-modal-close" aria-label="Close">&times;</button>
                <h2 id="auth-modal-title" class="auth-modal-title">Save prompts you like</h2>
                <p class="auth-modal-text">Sign in with Google to save images and prompts to your collection. You can view them anytime on your Saved page.</p>
                <button type="button" class="auth-google-btn" id="authGoogleBtn">
                    <span class="auth-google-icon"></span>
                    Sign in with Google
                </button>
                <p class="auth-modal-footer">We only use your email to associate your saved prompts. No spam.</p>
            </div>
        `;
        div.addEventListener('click', function(e) {
            if (e.target === div) hideAuthModal();
        });
        const closeBtn = div.querySelector('.auth-modal-close');
        closeBtn.addEventListener('click', hideAuthModal);
        const googleBtn = div.querySelector('#authGoogleBtn');
        googleBtn.addEventListener('click', function() { signInWithGoogle(); });
        document.body.appendChild(div);
        authModalEl = div;
        return div;
    }

    function showAuthModal(promptIdToSaveAfterLogin) {
        pendingSavePromptId = promptIdToSaveAfterLogin || null;
        createAuthModal();
        authModalEl.classList.add('auth-modal-visible');
        authModalEl.setAttribute('aria-hidden', 'false');
        authModalEl.style.display = 'flex';
        authModalEl.style.visibility = 'visible';
        authModalEl.style.opacity = '1';
        authModalEl.style.position = 'fixed';
        authModalEl.style.inset = '0';
        authModalEl.style.zIndex = '10000';
        authModalEl.style.background = 'rgba(1, 39, 50, 0.6)';
        authModalEl.style.alignItems = 'center';
        authModalEl.style.justifyContent = 'center';
        authModalEl.style.padding = '16px';
        document.body.style.overflow = 'hidden';
    }

    function hideAuthModal() {
        if (authModalEl) {
            authModalEl.classList.remove('auth-modal-visible');
            authModalEl.style.display = '';
            authModalEl.style.visibility = '';
            authModalEl.style.opacity = '';
            authModalEl.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        pendingSavePromptId = null;
    }

    async function signInWithGoogle(redirectToPath) {
        var client = sb();
        if (!client) {
            if (typeof showNotification === 'function') showNotification('Please refresh the page and try again.', 'error');
            return;
        }
        const btn = document.getElementById('authGoogleBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Signing in...';
        }
        try {
            const options = { provider: 'google' };
            if (typeof redirectToPath === 'string' && redirectToPath) {
                options.options = { redirectTo: window.location.origin + (redirectToPath.startsWith('/') ? redirectToPath : '/' + redirectToPath) };
            }
            const { data, error } = await client.auth.signInWithOAuth(options);
            if (error) throw error;
            if (data && data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            if (typeof showNotification === 'function') {
                showNotification(err.message || 'Sign-in failed. Try again.', 'error');
            }
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Sign in with Google';
            }
        }
    }

    async function savePromptToBackend(promptId) {
        var client = sb();
        if (!client) return { ok: false, error: 'Not connected' };
        const session = await getSessionAsync();
        if (!session) return { ok: false, error: 'Not logged in' };
        try {
            const { error } = await client
                .from('saved_prompts')
                .upsert({ user_id: session.user.id, prompt_id: promptId }, { onConflict: 'user_id,prompt_id' });
            if (error) throw error;
            return { ok: true };
        } catch (e) {
            console.error('Save prompt error:', e);
            return { ok: false, error: e.message };
        }
    }

    async function unsavePrompt(promptId) {
        var client = sb();
        if (!client) return { ok: false };
        const session = await getSessionAsync();
        if (!session) return { ok: false };
        try {
            const { error } = await client
                .from('saved_prompts')
                .delete()
                .eq('user_id', session.user.id)
                .eq('prompt_id', promptId);
            if (error) throw error;
            return { ok: true };
        } catch (e) {
            console.error('Unsave error:', e);
            return { ok: false };
        }
    }

    async function getSavedPromptIds() {
        var client = sb();
        if (!client) return [];
        const session = await getSessionAsync();
        if (!session) return [];
        try {
            const { data, error } = await client
                .from('saved_prompts')
                .select('prompt_id')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(r => r.prompt_id);
        } catch (e) {
            console.error('getSavedPromptIds error:', e);
            return [];
        }
    }

    /** Returns full prompt objects for the Saved page. Uses single client to avoid LockManager timeout. */
    async function getSavedPromptsWithDetails() {
        var client = sb();
        if (!client) return [];
        const session = await getSessionAsync();
        if (!session) return [];
        try {
            const { data: savedRows, error: err1 } = await client
                .from('saved_prompts')
                .select('prompt_id')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (err1) throw err1;
            const ids = (savedRows || []).map(r => r.prompt_id);
            if (ids.length === 0) return [];
            const { data: prompts, error: err2 } = await client
                .from('prompts')
                .select('id, title, prompt, image_url, model_name, tags, creator')
                .eq('is_active', true)
                .in('id', ids);
            if (err2) throw err2;
            const order = ids.reduce((acc, id, i) => { acc[id] = i; return acc; }, {});
            return (prompts || []).slice().sort((a, b) => (order[a.id] ?? 999) - (order[b.id] ?? 999));
        } catch (e) {
            console.error('getSavedPromptsWithDetails error:', e);
            return [];
        }
    }

    setTimeout(function() {
        var client = sb();
        if (!client) return;
        client.auth.onAuthStateChange(async (event) => {
            await refreshSession();
            if (event === 'SIGNED_IN' && pendingSavePromptId) {
                var idToSave = pendingSavePromptId;
                const result = await savePromptToBackend(idToSave);
                hideAuthModal();
                pendingSavePromptId = null;
                if (result.ok) {
                    if (typeof showNotification === 'function') {
                        showNotification('Saved! View your collection on the Saved page.');
                    }
                    try {
                        window.dispatchEvent(new CustomEvent('reddy-prompt-saved', { detail: { promptId: idToSave } }));
                    } catch (e) {}
                }
            }
        });
    }, 100);

    window.ReddyAuth = {
        getSession: getSessionAsync,
        isLoggedIn,
        showAuthModal,
        hideAuthModal,
        signInWithGoogle,
        savePromptToBackend,
        unsavePrompt,
        getSavedPromptIds,
        getSavedPromptsWithDetails
    };
})();
