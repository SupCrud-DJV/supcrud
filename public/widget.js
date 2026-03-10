(function () {
  function init() {
    const scriptTag    = document.querySelector('script[src*="widget.js"]');
    const workspaceKey = scriptTag ? scriptTag.getAttribute('data-workspace') : null;

    if (!workspaceKey) return console.error('SupCrud: missing data-workspace attribute');

    const API_URL = 'http://localhost:3000';

    // ── Inject styles ──
    const style = document.createElement('style');
    style.textContent = `
      #supcrud-btn {
        position: fixed; bottom: 24px; right: 24px;
        width: 56px; height: 56px; border-radius: 50%;
        background: #2563eb; color: white; border: none;
        cursor: pointer; font-size: 24px;
        box-shadow: 0 4px 16px rgba(37,99,235,0.4);
        z-index: 9999; display: flex; align-items: center;
        justify-content: center; transition: transform 0.2s, box-shadow 0.2s;
      }
      #supcrud-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(37,99,235,0.5);
      }
      #supcrud-panel {
        position: fixed; bottom: 90px; right: 24px;
        width: 360px; max-width: calc(100vw - 48px);
        background: #ffffff; border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 9998; display: none; flex-direction: column;
        overflow: hidden; font-family: 'Segoe UI', sans-serif;
        animation: supcrud-slide-up 0.25s ease;
      }
      @keyframes supcrud-slide-up {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      #supcrud-panel.open { display: flex; }
      .sc-header {
        background: #2563eb; color: white;
        padding: 16px 20px; display: flex;
        align-items: center; justify-content: space-between;
      }
      .sc-header-title { font-weight: 700; font-size: 15px; }
      .sc-header-sub   { font-size: 11px; opacity: 0.8; margin-top: 2px; }
      .sc-close {
        background: none; border: none; color: white;
        font-size: 20px; cursor: pointer; opacity: 0.8; line-height: 1;
      }
      .sc-close:hover { opacity: 1; }
      .sc-body  { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
      .sc-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .sc-input {
        width: 100%; padding: 9px 12px;
        border: 1.5px solid #e2e8f0; border-radius: 8px;
        font-size: 13px; outline: none; box-sizing: border-box;
        font-family: inherit; transition: border-color 0.15s;
      }
      .sc-input:focus      { border-color: #2563eb; }
      textarea.sc-input    { resize: none; height: 80px; }
      .sc-btn {
        width: 100%; padding: 11px; background: #2563eb;
        color: white; border: none; border-radius: 8px;
        font-size: 14px; font-weight: 700; cursor: pointer;
        transition: background 0.2s; font-family: inherit;
      }
      .sc-btn:hover    { background: #1d4ed8; }
      .sc-btn:disabled { background: #93c5fd; cursor: not-allowed; }
      .sc-error {
        background: #fef2f2; color: #dc2626;
        border: 1px solid #fecaca; border-radius: 8px;
        padding: 10px 12px; font-size: 12px; display: none;
      }
      .sc-success {
        padding: 24px 20px; text-align: center;
        display: none; flex-direction: column;
        align-items: center; gap: 8px;
      }
      .sc-success-icon  { font-size: 40px; }
      .sc-success-title { font-size: 16px; font-weight: 700; color: #0f172a; }
      .sc-success-code  {
        font-family: monospace; font-size: 18px; font-weight: 700;
        color: #2563eb; background: #eff6ff;
        padding: 8px 20px; border-radius: 8px; letter-spacing: 1px;
      }
      .sc-success-sub  { font-size: 12px; color: #64748b; }
      .sc-success-back {
        margin-top: 8px; background: none;
        border: 1.5px solid #e2e8f0; border-radius: 8px;
        padding: 8px 20px; font-size: 13px;
        cursor: pointer; font-family: inherit; color: #0f172a;
      }
      .sc-success-back:hover { background: #f8fafc; }
      .sc-spinner {
        display: inline-block; width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: white; border-radius: 50%;
        animation: sc-spin 0.6s linear infinite;
        vertical-align: middle; margin-right: 6px;
      }
      @keyframes sc-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    // ── Inject HTML ──
    const btn   = document.createElement('button');
    btn.id        = 'supcrud-btn';
    btn.title     = 'Support';
    btn.innerHTML = '💬';

    const panel   = document.createElement('div');
    panel.id        = 'supcrud-panel';
    panel.innerHTML = `
      <div class="sc-header">
        <div>
          <div class="sc-header-title">💬 Support</div>
          <div class="sc-header-sub">We'll get back to you shortly</div>
        </div>
        <button class="sc-close" id="sc-close-btn">✕</button>
      </div>

      <div class="sc-body" id="sc-form">
        <div class="sc-error" id="sc-error"></div>
        <div>
          <div class="sc-label">Email *</div>
          <input type="email" class="sc-input" id="sc-email" placeholder="you@example.com"/>
        </div>
        <div>
          <div class="sc-label">Subject *</div>
          <input type="text" class="sc-input" id="sc-subject" placeholder="Brief summary of your issue"/>
        </div>
        <div>
          <div class="sc-label">Type *</div>
          <select class="sc-input" id="sc-type">
            <option value="">Select a type</option>
            <option value="P">📋 Petition</option>
            <option value="Q">😞 Complaint</option>
            <option value="R">⚖️ Claim</option>
            <option value="S">💡 Suggestion</option>
          </select>
        </div>
        <div>
          <div class="sc-label">Description *</div>
          <textarea class="sc-input" id="sc-description" placeholder="Describe your issue in detail..."></textarea>
        </div>
        <button class="sc-btn" id="sc-submit">Send Message</button>
      </div>

      <div class="sc-success" id="sc-success">
        <div class="sc-success-icon">✅</div>
        <div class="sc-success-title">Ticket Created!</div>
        <div class="sc-success-sub">Your reference code is:</div>
        <div class="sc-success-code" id="sc-ref-code"></div>
        <div class="sc-success-sub">Save this code to track your ticket status.</div>
        <button class="sc-success-back" id="sc-new-ticket">Submit another ticket</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // ── Toggle panel ──
    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      btn.innerHTML = panel.classList.contains('open') ? '✕' : '💬';
    });

    document.getElementById('sc-close-btn').addEventListener('click', () => {
      panel.classList.remove('open');
      btn.innerHTML = '💬';
    });

    // ── Submit form ──
    document.getElementById('sc-submit').addEventListener('click', async () => {
      const email       = document.getElementById('sc-email').value.trim();
      const subject     = document.getElementById('sc-subject').value.trim();
      const type        = document.getElementById('sc-type').value;
      const description = document.getElementById('sc-description').value.trim();
      const errorEl     = document.getElementById('sc-error');
      const submitBtn   = document.getElementById('sc-submit');

      errorEl.style.display = 'none';

      if (!email || !subject || !type || !description) {
        errorEl.textContent   = 'Please fill in all required fields.';
        errorEl.style.display = 'block';
        return;
      }

      submitBtn.disabled  = true;
      submitBtn.innerHTML = '<span class="sc-spinner"></span> Sending...';

      try {
        const res  = await fetch(`${API_URL}/api/tickets/public`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ workspaceKey, email, subject, type, description })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Something went wrong');

        document.getElementById('sc-form').style.display   = 'none';
        document.getElementById('sc-success').style.display = 'flex';
        document.getElementById('sc-ref-code').textContent  = data.reference_code;

      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = 'Send Message';
      }
    });

    // ── Submit another ──
    document.getElementById('sc-new-ticket').addEventListener('click', () => {
      document.getElementById('sc-email').value       = '';
      document.getElementById('sc-subject').value     = '';
      document.getElementById('sc-type').value        = '';
      document.getElementById('sc-description').value = '';
      document.getElementById('sc-form').style.display    = 'flex';
      document.getElementById('sc-success').style.display = 'none';
    });
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();