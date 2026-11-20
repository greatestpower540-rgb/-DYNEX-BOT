
/* =================================
   DYNEX BOT - DASHBOARD ENGINE
================================= */

const Dashboard = {

  render(page) {
    const container = document.getElementById("pageContent");

    if (!container) return;

    const pages = {
      dashboard: () => this.home(),
      connect: () => this.connect(),
      bots: () => this.bots(),
      autoReply: () => this.autoReply(),
      ai: () => this.ai(),
      scheduler: () => this.scheduler(),
      campaigns: () => this.campaigns(),
      analytics: () => this.analytics(),
      settings: () => this.settings(),
      account: () => this.account()
    };

    container.innerHTML = pages[page]
      ? pages[page]()
      : this.notFound();
  },

  home() {
    const status = localStorage.getItem("dynex_bot_status") === "true";

    return `
      <section class="welcome-banner">
        <h2>Welcome to <span class="green">DYNEX BOT</span></h2>
        <p>
          Manage your WhatsApp automation, customer messages
          and intelligent assistant from one dashboard.
        </p>
      </section>

      <div class="bot-status">
        <span class="status-dot ${status ? "" : "offline"}"></span>
        <strong id="botStatusText">
          ${status ? "Interface enabled — backend not connected" : "Bot interface is switched off"}
        </strong>
      </div>

      <div class="stats-grid">
        <article class="card">
          <div class="stat-icon">🤖</div>
          <div class="stat-label">My Bots</div>
          <div class="stat-value">0</div>
        </article>

        <article class="card">
          <div class="stat-icon">💬</div>
          <div class="stat-label">Messages Today</div>
          <div class="stat-value">0</div>
        </article>

        <article class="card">
          <div class="stat-icon">⚡</div>
          <div class="stat-label">Auto Replies</div>
          <div class="stat-value">0</div>
        </article>
      </div>

      <h2 class="section-title">Quick Actions</h2>

      <div class="feature-grid">
        ${this.quickCard("🔗", "Connect WhatsApp",
          "Connect your authorized WhatsApp Business account.", "connect")}

        ${this.quickCard("🤖", "My Bots",
          "Manage your connected bot sessions.", "bots")}

        ${this.quickCard("💬", "Auto Reply",
          "Configure automatic customer responses.", "autoReply")}

        ${this.quickCard("🧠", "AI Assistant",
          "Configure intelligent customer support.", "ai")}
      </div>
    `;
  },

  quickCard(icon, title, description, page) {
    return `
      <article class="feature-card">
        <div class="feature-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${description}</p>
        <button class="btn btn-outline"
          onclick="Dynex.navigate('${page}')">
          OPEN FEATURE →
        </button>
      </article>
    `;
  },

  connect() {
    return `
      <div class="page-heading">
        <h1>WhatsApp <span class="green">Connection</span></h1>
        <p>Connect a WhatsApp Business account you own or are authorized to manage.</p>
      </div>

      <div class="form-card">
        <div class="feature-icon">📱</div>
        <h2>Connect Your Account</h2>
        <p style="margin:12px 0 22px;color:var(--muted);font-size:13px;line-height:1.7">
          Connect through the official WhatsApp Business Platform.
          Your connection will be verified by our backend.
        </p>

        <div class="form-group">
          <label>WhatsApp Business Phone Number</label>
          <input class="form-control" id="waPhone"
            type="tel" placeholder="e.g. +2348012345678">
        </div>

        <button class="btn" onclick="Dashboard.connectWhatsApp()">
          CONNECT WHATSAPP
        </button>

        <div style="margin-top:22px;padding:15px;background:#39ff140b;border:1px solid var(--border);border-radius:9px">
          <p style="font-size:12px;color:var(--muted)">
            Connection status: <strong class="green">Not connected</strong>
          </p>
          <p style="font-size:12px;color:var(--muted);margin-top:8px">
            Backend and official API credentials are required.
          </p>
        </div>
      </div>
    `;
  },

  connectWhatsApp() {
    const phone = document.getElementById("waPhone")?.value.trim();

    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      Dynex.toast("Enter a valid phone number with country code.");
      return;
    }

    Dynex.toast("Phone number accepted. Real connection requires backend setup.");
  },

  bots() {
    return `
      <div class="page-heading">
        <h1>My <span class="green">Bots</span></h1>
        <p>View and manage your connected bot accounts.</p>
      </div>

      <div class="empty-state">
        <div class="icon">🤖</div>
        <h3>No Connected Bots</h3>
        <p>Your connected bot sessions will appear here.</p>
        <br>
        <button class="btn" onclick="Dynex.navigate('connect')">
          CONNECT WHATSAPP
        </button>
      </div>
    `;
  },

  autoReply() {
    return `
      <div class="page-heading">
        <h1>Automatic <span class="green">Replies</span></h1>
        <p>Configure replies to incoming customer messages.</p>
      </div>

      <div class="form-card">
        <form data-dynex-form>
          <div class="form-group">
            <label>Welcome Message</label>
            <textarea class="form-control" id="welcomeMessage"
              placeholder="Hello! Welcome to our business. How can we help?">${this.escape(Dynex.getSetting("welcome_message"))}</textarea>
          </div>

          <div class="form-group">
            <label>Default Reply</label>
            <textarea class="form-control" id="defaultReply"
              placeholder="Thank you for your message. We'll get back to you.">${this.escape(Dynex.getSetting("default_reply"))}</textarea>
          </div>

          <button class="btn" type="button"
            onclick="Dashboard.saveAutoReply()">
            SAVE SETTINGS
          </button>
        </form>
      </div>
    `;
  },

  saveAutoReply() {
    Dynex.saveSetting("welcome_message",
      document.getElementById("welcomeMessage").value);

    Dynex.saveSetting("default_reply",
      document.getElementById("defaultReply").value);

    Dynex.toast("Reply settings saved in this browser.");
  },

  ai() {
    return `
      <div class="page-heading">
        <h1>AI <span class="green">Assistant</span></h1>
        <p>Configure your automated customer support assistant.</p>
      </div>

      <div class="form-card">
        <div class="feature-icon">🧠</div>

        <div class="form-group">
          <label>Assistant Name</label>
          <input class="form-control" id="aiName"
            value="${this.escape(Dynex.getSetting("ai_name", "DYNEX AI"))}">
        </div>

        <div class="form-group">
          <label>Assistant Instructions</label>
          <textarea class="form-control" id="aiInstructions"
            placeholder="Describe how your assistant should communicate.">${this.escape(Dynex.getSetting("ai_instructions"))}</textarea>
        </div>

        <button class="btn" onclick="Dashboard.saveAI()">
          SAVE AI SETTINGS
        </button>

        <p style="margin-top:17px;font-size:12px;color:var(--muted)">
          An AI provider and secure server-side API integration
          are required before the assistant can answer real messages.
        </p>
      </div>
    `;
  },

  saveAI() {
    Dynex.saveSetting("ai_name",
      document.getElementById("aiName").value);

    Dynex.saveSetting("ai_instructions",
      document.getElementById("aiInstructions").value);

    Dynex.toast("AI settings saved locally.");
  },

  scheduler() {
    return `
      <div class="page-heading">
        <h1>Message <span class="green">Scheduler</span></h1>
        <p>Prepare messages for scheduled delivery to opted-in customers.</p>
      </div>

      <div class="form-card">
        <div class="form-group">
          <label>Message</label>
          <textarea class="form-control" id="scheduledMessage"
            placeholder="Write your message..."></textarea>
        </div>

        <div class="form-group">
          <label>Schedule Date and Time</label>
          <input class="form-control" id="scheduledDate"
            type="datetime-local">
        </div>

        <button class="btn" onclick="Dashboard.scheduleMessage()">
          SAVE SCHEDULE
        </button>

        <p style="margin-top:15px;font-size:12px;color:var(--muted)">
          Scheduling and delivery require the backend and
          WhatsApp Business API.
        </p>
      </div>

      <div id="scheduleList" style="margin-top:20px">
        ${this.getSchedules()}
      </div>
    `;
  },

  scheduleMessage() {
    const message = document.getElementById("scheduledMessage").value.trim();
    const date = document.getElementById("scheduledDate").value;

    if (!message || !date || new Date(date) <= new Date()) {
      Dynex.toast("Enter a message and a future date.");
      return;
    }

    const schedules = JSON.parse(
      localStorage.getItem("dynex_schedules") || "[]"
    );

    schedules.push({
      id: Date.now(),
      message,
      date,
      status: "Prepared"
    });

    localStorage.setItem("dynex_schedules", JSON.stringify(schedules));

    Dynex.toast("Schedule saved locally. It has not been sent.");

    this.render("scheduler");
  },

  getSchedules() {
    const schedules = JSON.parse(
      localStorage.getItem("dynex_schedules") || "[]"
    );

    if (!schedules.length) {
      return `<div class="empty-state">
        <div class="icon">🕒</div>
        <h3>No Scheduled Messages</h3>
        <p>Your prepared schedules will appear here.</p>
      </div>`;
    }

    return schedules.map(item => `
      <div class="notification">
        <strong>${this.escape(item.message)}</strong>
        <p>${this.escape(item.date)} · ${item.status}</p>
        <button class="btn btn-danger"
          onclick="Dashboard.deleteSchedule(${item.id})">
          DELETE
        </button>
      </div>
    `).join("");
  },

  deleteSchedule(id) {
    const schedules = JSON.parse(
      localStorage.getItem("dynex_schedules") || "[]"
    );

    localStorage.setItem(
      "dynex_schedules",
      JSON.stringify(schedules.filter(item => item.id !== id))
    );

    this.render("scheduler");
    Dynex.toast("Schedule deleted.");
  },

  campaigns() {
    return `
      <div class="page-heading">
        <h1>Messaging <span class="green">Campaigns</span></h1>
        <p>Prepare compliant messages for customers who have opted in.</p>
      </div>

      <div class="form-card">
        <div class="form-group">
          <label>Campaign Name</label>
          <input class="form-control" id="campaignName"
            placeholder="Customer welcome campaign">
        </div>

        <div class="form-group">
          <label>Message Content</label>
          <textarea class="form-control" id="campaignMessage"
            placeholder="Write your campaign message..."></textarea>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="campaignConsent">
            I confirm recipients have opted in to receive these messages.
          </label>
        </div>

        <button class="btn" onclick="Dashboard.createCampaign()">
          SAVE CAMPAIGN
        </button>

        <p style="margin-top:15px;font-size:12px;color:var(--muted)">
          Saving a campaign does not send messages. Delivery requires
          backend integration and applicable WhatsApp approval.
        </p>
      </div>

      <div id="campaignList" style="margin-top:20px">
        ${this.getCampaigns()}
      </div>
    `;
  },

  createCampaign() {
    const name = document.getElementById("campaignName").value.trim();
    const message = document.getElementById("campaignMessage").value.trim();
    const consent = document.getElementById("campaignConsent").checked;

    if (!name || !message || !consent) {
      Dynex.toast("Complete the fields and confirm customer consent.");
      return;
    }

    const campaigns = JSON.parse(
      localStorage.getItem("dynex_campaigns") || "[]"
    );

    campaigns.push({ id: Date.now(), name, message });

    localStorage.setItem("dynex_campaigns", JSON.stringify(campaigns));

    this.render("campaigns");
    Dynex.toast("Campaign saved locally.");
  },

  getCampaigns() {
    const campaigns = JSON.parse(
      localStorage.getItem("dynex_campaigns") || "[]"
    );

    if (!campaigns.length) {
      return `<div class="empty-state">
        <div class="icon">📨</div>
        <h3>No Campaigns Yet</h3>
        <p>Your saved campaigns will appear here.</p>
      </div>`;
    }

    return campaigns.map(c => `
      <div class="notification">
        <strong>${this.escape(c.name)}</strong>
        <p>${this.escape(c.message)}</p>
      </div>
    `).join("");
  },

  analytics() {
    return `
      <div class="page-heading">
        <h1>Bot <span class="green">Analytics</span></h1>
        <p>Monitor your messaging activity.</p>
      </div>

      <div class="stats-grid">
        <div class="card">
          <div class="stat-label">Messages Received</div>
          <div class="stat-value">0</div>
        </div>

        <div class="card">
          <div class="stat-label">Messages Sent</div>
          <div class="stat-value">0</div>
        </div>

        <div class="card">
          <div class="stat-label">Successful Replies</div>
          <div class="stat-value">0</div>
        </div>
      </div>

      <div class="empty-state">
        <div class="icon">📊</div>
        <h3>Analytics Awaiting Connection</h3>
        <p>Real statistics will appear after backend integration.</p>
      </div>
    `;
  },

  settings() {
    return `
      <div class="page-heading">
        <h1>Bot <span class="green">Settings</span></h1>
        <p>Control your application preferences.</p>
      </div>

      <div class="form-card">
        <h3>Bot Controls</h3>
        <p style="color:var(--muted);font-size:13px;margin:12px 0 20px">
          This switch controls the local interface only.
        </p>

        <button class="btn" onclick="Dynex.toggleBot()">
          TOGGLE BOT INTERFACE
        </button>

        <hr style="border-color:var(--border);margin:25px 0">

        <h3>Security</h3>
        <p style="color:var(--muted);font-size:13px;margin:12px 0">
          Never share WhatsApp credentials, access tokens or API secrets.
        </p>
      </div>
    `;
  },

  account() {
    return `
      <div class="page-heading">
        <h1>My <span class="green">Account</span></h1>
        <p>Manage your DYNEX BOT profile.</p>
      </div>

      <div class="form-card">
        <div class="form-group">
          <label>Display Name</label>
          <input class="form-control" id="accountName"
            value="${this.escape(Dynex.getSetting("username", ""))}"
            placeholder="Your name">
        </div>

        <button class="btn" onclick="Dashboard.saveAccount()">
          SAVE PROFILE
        </button>
      </div>
    `;
  },

  saveAccount() {
    const name = document.getElementById("accountName").value.trim();

    if (!name) {
      Dynex.toast("Enter your display name.");
      return;
    }

    Dynex.saveSetting("username", name);
    Dynex.saveSetting("username", name);

    Dynex.toast("Profile saved locally.");
  },

  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  },

  notFound() {
    return `
      <div class="empty-state">
        <h3>Page Not Found</h3>
        <p>This section is not available.</p>
      </div>
    `;
  }
};
  
