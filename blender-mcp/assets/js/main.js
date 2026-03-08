/* ═══════════════════════════════════════════════
  SIDEBAR / NAV TOGGLE
  Works on both desktop (collapse) and mobile (drawer)
═══════════════════════════════════════════════ */
const MOBILE_BP = 768;

function isMobile() {
    return window.innerWidth < MOBILE_BP;
}

function toggleNav() {
    if (isMobile()) {
        const open = document.body.classList.toggle('sidebar-open');
        document.getElementById('sidebar-overlay').style.display = open ? 'block' : 'none';
        document.getElementById('sidebar-toggle-btn').setAttribute('aria-expanded', open);
    } else {
        const collapsed = document.body.classList.toggle('nav-collapsed');
        document.getElementById('sidebar-toggle-btn').setAttribute('aria-expanded', !collapsed);
        try {
            localStorage.setItem('bmcp-nav-collapsed', collapsed ? '1' : '0');
        } catch (e) {
        }
    }
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    document.getElementById('sidebar-overlay').style.display = 'none';
}

// Restore desktop collapse state
(function () {
    try {
        if (!isMobile() && localStorage.getItem('bmcp-nav-collapsed') === '1') {
            document.body.classList.add('nav-collapsed');
            document.getElementById('sidebar-toggle-btn').setAttribute('aria-expanded', 'false');
        }
    } catch (e) {
    }
})();

// Close drawer on resize to desktop
window.addEventListener('resize', () => {
    if (!isMobile()) closeSidebar();
});

/* ═══════════════════════════════════════════════
  THEME TOGGLE — dark (default) / light
  <html data-theme="dark"> is set in markup + anti-flash script.
  JS only toggles between 'dark' and 'light'.
═══════════════════════════════════════════════ */

var _themeTransitionTimer = null;

function applyTheme(theme, animate) {
    /* Normalize: anything not 'light' falls back to 'dark' */
    var t = theme === 'light' ? 'light' : 'dark';
    var root = document.documentElement;

    /* Apply smooth transition when explicitly toggling (not on page load) */
    if (animate) {
        if (_themeTransitionTimer) clearTimeout(_themeTransitionTimer);
        root.setAttribute('data-theme-transition', '');
        _themeTransitionTimer = setTimeout(function () {
            root.removeAttribute('data-theme-transition');
        }, 350);
    }

    root.setAttribute('data-theme', t);

    /* Update meta theme-color for browser chrome */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#07070f' : '#eaecf6');

    /* Update toggle button label + aria */
    var btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        var label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
    }

    /* Persist */
    try {
        localStorage.setItem('bmcp-theme', t);
    } catch (e) {
    }
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
}

/* On load: restore saved preference — dark is already set in markup */
(function () {
    try {
        var saved = localStorage.getItem('bmcp-theme');
        /* If saved is 'light', override the default dark — no transition (no flash) */
        if (saved === 'light') applyTheme('light', false);
        else applyTheme('dark', false); /* ensures aria-label is correct on load */
    } catch (e) {
        applyTheme('dark', false);
    }
})();

/* ═══════════════════════════════════════════════
  GLOBAL OS SELECTOR
═══════════════════════════════════════════════ */
function setOS(os) {
    document.documentElement.dataset.os = os;
    document.querySelectorAll('.os-btn').forEach(b => {
        const active = b.classList.contains(os);
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try {
        localStorage.setItem('bmcp-os', os);
    } catch (e) {
    }
    // Announce to screen readers
    const label = { mac: 'macOS', win: 'Windows', linux: 'Linux' }[os];
    announce('Platform set to ' + label);
}

// Restore saved OS
(function () {
    try {
        const saved = localStorage.getItem('bmcp-os');
        if (saved && ['mac', 'win', 'linux'].includes(saved)) setOS(saved);
    } catch (e) {
    }
})();

// Screen reader live region
function announce(msg) {
    let r = document.getElementById('sr-live');
    if (!r) {
        r = document.createElement('div');
        r.id = 'sr-live';
        r.setAttribute('aria-live', 'polite');
        r.setAttribute('aria-atomic', 'true');
        r.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(r);
    }
    r.textContent = '';
    setTimeout(() => {
        r.textContent = msg;
    }, 50);
}

/* ═══════════════════════════════════════════════
  ACCORDION (TROUBLESHOOTING)
═══════════════════════════════════════════════ */
function toggleIssue(issue) {
    if (issue.dataset.animating === '1') return;
    const body = issue.querySelector('.issuebody');
    const header = issue.querySelector('.issueh');
    const isOpen = issue.classList.contains('open');
    issue.dataset.animating = '1';
    const done = () => {
        issue.dataset.animating = '0';
    };

    if (isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        void body.offsetHeight;
        body.style.maxHeight = '0';
        body.style.padding = '0 14px';
        body.style.borderColor = 'transparent';
        issue.classList.remove('open');
        header.setAttribute('aria-expanded', 'false');
        setTimeout(done, 340);
    } else {
        // Measure closed
        body.style.visibility = 'hidden';
        body.style.maxHeight = 'none';
        body.style.padding = '12px 14px';
        const h = body.scrollHeight;
        body.style.maxHeight = '0';
        body.style.padding = '0 14px';
        body.style.visibility = '';
        void body.offsetHeight;
        issue.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = h + 'px';
        body.style.padding = '12px 14px';
        body.style.borderColor = 'var(--border)';
        const onEnd = () => {
            body.style.maxHeight = ''; // release so inner tab-switches can grow it
            body.removeEventListener('transitionend', onEnd);
            done();
        };
        body.addEventListener('transitionend', onEnd);
        setTimeout(done, 400);
    }
}

// Keyboard support
document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('issueh')) {
        e.preventDefault();
        toggleIssue(e.target.closest('.issue'));
    }
});

// Init ARIA on open accordion
document.querySelectorAll('.issue').forEach(issue => {
    const h = issue.querySelector('.issueh');
    if (h) h.setAttribute('aria-expanded', issue.classList.contains('open') ? 'true' : 'false');
});

/* ═══════════════════════════════════════════════
  COPY BUTTONS — injected into every .cb and .term
═══════════════════════════════════════════════ */
document.querySelectorAll('.cb, .term').forEach(block => {
    const pre = block.querySelector('pre');
    if (!pre) return;
    block.style.position = 'relative';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cb-copy';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>COPY</span>';
    btn.addEventListener('click', () => {
        const text = (pre.innerText || pre.textContent).trim();
        const finish = ok => {
            btn.querySelector('span').textContent = ok ? 'COPIED' : 'FAILED';
            btn.classList.toggle('copied', ok);
            setTimeout(() => {
                btn.querySelector('span').textContent = 'COPY';
                btn.classList.remove('copied');
            }, 2200);
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => finish(true)).catch(() => finish(false));
        } else {
            const ta = Object.assign(document.createElement('textarea'), {
                value: text,
                style: 'position:fixed;left:-9999px;opacity:0;'
            });
            document.body.appendChild(ta);
            ta.select();
            finish(document.execCommand('copy'));
            document.body.removeChild(ta);
        }
    });
    block.appendChild(btn);
});

/* ═══════════════════════════════════════════════
  SCROLL SPY — topmost-visible section wins
═══════════════════════════════════════════════ */
const navLinks2 = Array.from(document.querySelectorAll('.ni[href^="#"]'));
const linkedIds = new Set(navLinks2.map(n => n.getAttribute('href').slice(1)));
const spyTargets = Array.from(document.querySelectorAll('[id]')).filter(el => linkedIds.has(el.id));
const navItems = document.querySelectorAll('.ni');
const visSet = new Set();

const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
        e.isIntersecting ? visSet.add(e.target) : visSet.delete(e.target);
    });
    if (!visSet.size) return;
    let winner = null, best = Infinity;
    visSet.forEach(el => {
        const t = el.getBoundingClientRect().top;
        if (t >= 0 && t < best) {
            best = t;
            winner = el;
        }
    });
    if (!winner) winner = [...visSet][0];
    navItems.forEach(n => n.classList.toggle('active', n.getAttribute('href') === '#' + winner.id));
}, { rootMargin: '-8% 0px -70% 0px', threshold: 0 });

spyTargets.forEach(s => spy.observe(s));

/* ═══════════════════════════════════════════════
  CLOSE SIDEBAR ON NAV CLICK (MOBILE)
═══════════════════════════════════════════════ */
document.querySelectorAll('.ni').forEach(link => {
    link.addEventListener('click', () => {
        if (isMobile()) closeSidebar();
    });
});

/* ═══════════════════════════════════════════════
  LIVE GITHUB STAR COUNT
  Fetches from GitHub API — graceful fallback to "17K+"
═══════════════════════════════════════════════ */
(function fetchGitHubStars() {
    const targets = document.querySelectorAll('[data-gh-stars]');
    if (!targets.length) return;
    const CACHE_KEY = 'bmcp-gh-stars';
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    function fmt(n) {
        if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
        return n.toLocaleString() + '+';
    }

    function apply(val) {
        targets.forEach(el => {
            el.textContent = '★ ' + val;
        });
    }

    // Serve from cache if fresh
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            apply(fmt(cached.stars));
            return;
        }
    } catch (e) {
    }

    // Fetch live count (no auth token required for public repos under rate limit)
    fetch('https://api.github.com/repos/ahujasid/blender-mcp', {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (data && data.stargazers_count != null) {
                const stars = data.stargazers_count;
                apply(fmt(stars));
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ stars, ts: Date.now() }));
                } catch (e) {
                }
            } else {
                apply('17K+');
            }
        })
        .catch(() => apply('17K+'));
})();