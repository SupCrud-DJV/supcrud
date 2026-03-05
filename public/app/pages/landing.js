export function renderLanding(container) {
  container.innerHTML = `
    <div style="min-height:100vh; background:var(--bg);">

      <!-- Navbar -->
      <nav style="background:var(--bg-white); border-bottom:1px solid var(--border); padding:0 40px; height:64px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px;height:34px;background:var(--primary);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;">S</div>
          <span style="font-size:16px;font-weight:700;">SupCrud <span style="color:var(--text-muted);font-weight:400;font-size:13px;">by Crudzaso</span></span>
        </div>
        <a href="#/login" class="btn btn-primary btn-sm">Sign In</a>
      </nav>

      <!-- Hero -->
      <div style="max-width:680px; margin:0 auto; text-align:center; padding:100px 24px 60px;">
        <span class="badge badge-primary" style="margin-bottom:20px;">PQRS Management Platform</span>
        <h1 style="font-size:3rem;font-weight:700;color:var(--text);line-height:1.2;margin-bottom:20px;">
          Support that scales<br/>with your business
        </h1>
        <p style="font-size:1.1rem;color:var(--text-muted);line-height:1.7;margin-bottom:36px;">
          Embed SupCrud into any website and manage Petitions, Complaints, Claims and Suggestions — all in one place.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="#/login" class="btn btn-primary btn-lg">Get Started Free</a>
          <a href="#/track" class="btn btn-ghost btn-lg">Track a Ticket</a>
        </div>
      </div>

      <!-- Features -->
      <div style="max-width:900px;margin:0 auto;padding:0 24px 80px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
        ${[
          { icon: '🎧', title: 'Embeddable Widget',  desc: 'One script tag. Works on any website.' },
          { icon: '🤖', title: 'AI Auto-assign',     desc: 'Let AI classify and assign tickets for you.' },
          { icon: '🏢', title: 'Multi-workspace',    desc: 'Manage multiple businesses from one account.' },
          { icon: '📎', title: 'File Attachments',   desc: 'Cloudinary-powered attachment support.' },
        ].map(f => `
          <div class="card">
            <div style="font-size:28px;margin-bottom:12px;">${f.icon}</div>
            <div class="card-title">${f.title}</div>
            <div class="card-subtitle" style="margin-top:4px;">${f.desc}</div>
          </div>`).join('')}
      </div>

    </div>`;
}