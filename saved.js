/**
 * Saved page: show sign-in CTA or list of user's saved prompts.
 * Uses only ReddyAuth (auth.js) - no second Supabase client, to avoid LockManager timeout.
 */
(function() {
    function showSection(id) {
        var sections = document.querySelectorAll('.saved-page-section');
        sections.forEach(function(s) {
            s.style.display = s.id === id ? 'block' : 'none';
        });
    }

    function renderSignIn() {
        showSection('saved-signin-section');
        var btn = document.getElementById('savedSignInBtn');
        if (btn) {
            btn.addEventListener('click', function() {
                if (window.ReddyAuth) window.ReddyAuth.signInWithGoogle('/saved.html');
            });
        }
    }

    function showError(msg) {
        var el = document.getElementById('saved-error');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
        showSection('saved-list-section');
    }

    var savedPromptsList = [];

    function renderCards(prompts) {
        var grid = document.getElementById('savedGrid');
        if (!grid) return;
        grid.innerHTML = '';
        savedPromptsList = prompts || [];
        if (savedPromptsList.length === 0) {
            grid.innerHTML = '<p class="saved-empty">No saved prompts yet. Explore and save images you like!</p>';
            showSection('saved-list-section');
            return;
        }
        var placeholderUrl = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f0f0f0" width="400" height="400"/><text x="50%" y="50%" fill="#999" font-size="14" text-anchor="middle" dy=".3em">No image</text></svg>');
        savedPromptsList.forEach(function(p) {
            var card = document.createElement('div');
            card.className = 'saved-card prompt-card saved-grid-card';
            var displayTags = (p.tags && p.tags.length) ? p.tags.slice(0, 2) : [];
            var promptPreview = (p.prompt || '').substring(0, 120);
            if (p.prompt && p.prompt.length > 120) promptPreview += '…';
            var imgUrl = p.image_url || p.imageUrl || '';
            if (!imgUrl || typeof imgUrl !== 'string') imgUrl = placeholderUrl;
            card.innerHTML =
                '<div class="card-image-wrapper">' +
                '<img src="" alt="' + String(p.title || '').replace(/</g, '&lt;').replace(/"/g, '&quot;') + '" class="card-image" loading="lazy">' +
                '</div>' +
                '<div class="card-content">' +
                '<div class="card-header">' +
                '<button type="button" class="save-btn saved-remove-btn" data-prompt-id="' + p.id + '" title="Remove from saved">Remove</button>' +
                '</div>' +
                '<div class="card-footer">' +
                (displayTags.length ? '<div class="card-tags">' + displayTags.map(function(t) { return '<span class="tag">' + String(t).replace(/</g, '&lt;') + '</span>'; }).join('') + '</div>' : '') +
                '<p class="card-prompt">' + promptPreview.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
                '<div class="card-actions">' +
                '<button type="button" class="copy-btn" data-prompt-id="' + p.id + '">Copy</button>' +
                '</div>' +
                '</div>' +
                '</div>';
            var img = card.querySelector('.card-image');
            img.src = imgUrl;
            img.onerror = function() { this.src = placeholderUrl; this.onerror = null; };
            card.querySelector('.saved-remove-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-prompt-id');
                if (window.ReddyAuth && id) {
                    window.ReddyAuth.unsavePrompt(id).then(function(r) {
                        if (r.ok) card.remove();
                    });
                }
            });
            card.querySelector('.copy-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                var pid = this.getAttribute('data-prompt-id');
                var prom = savedPromptsList.find(function(x) { return x.id === pid; });
                var text = (prom && prom.prompt) ? prom.prompt : '';
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        if (window.showNotification) showNotification('Copied!');
                    });
                }
            });
            card.addEventListener('click', function(e) {
                if (e.target.closest('button')) return;
                window.location.href = '/promptdetails.html?id=' + p.id;
            });
            grid.appendChild(card);
        });
        showSection('saved-list-section');
    }

    function loadSaved() {
        if (!window.ReddyAuth) {
            renderSignIn();
            return;
        }
        window.ReddyAuth.getSavedPromptsWithDetails().then(function(list) {
            if (!list || !Array.isArray(list)) {
                showError('Could not load saved prompts.');
                return;
            }
            renderCards(list);
        }).catch(function() {
            showError('Could not load saved prompts.');
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (!window.ReddyAuth) {
            document.getElementById('saved-signin-section').style.display = 'block';
            return;
        }
        window.ReddyAuth.getSession().then(function(session) {
            if (session) {
                loadSaved();
            } else {
                renderSignIn();
            }
        });
    });
})();
