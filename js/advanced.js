
/* DYNEX BOT — ADVANCED WORKSPACE
   Local drafts only until secure backend integration.
*/
(() => {
  const read = (key, fallback = []) => {
    try {
      return JSON.parse(localStorage.getItem("dynex_" + key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const save = (key, value) =>
    localStorage.setItem("dynex_" + key, JSON.stringify(value));

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  const heading = (title, desc) => `
    <div class="page-heading">
      <h1>${title}</h1><p>${desc}</p>
    </div>`;

  const panel = content => `<div class="form-card workspace-panel">${content}</div>`;

  const note = text => `<p class="feature-note">${text}</p>`;

  const empty = (icon, title, desc) => `
    <div class="empty-state">
      <div class="icon">${icon}</div><h3>${title}</h3><p>${desc}</p>
    </div>`;

  const input = (label, id, placeholder, type = "text") => `
    <label>${label}</label>
    <input class="form-control" id="${id}" type="${type}" placeholder="${placeholder}">`;

  const pages = {
    builder() {
      const nodes = read("flow_nodes", [
        { id: 1, type: "trigger", title: "When a customer messages" },
        { id: 2, type: "reply", title: "Send a welcome reply" }
      ]);

      return heading(
        'Visual <span class="green">Bot Builder</span>',
        "Create automated conversation flows using steps."
      ) + `
        <div class="builder-layout">
          <div class="builder-toolbar">
            <strong>ADD FLOW STEPS</strong>
            <button class="btn btn-outline" onclick="DynexBuilder.add('condition')">＋ Condition</button>
            <button class="btn btn-outline" onclick="DynexBuilder.add('reply')">＋ Send reply</button>
            <button class="btn btn-outline" onclick="DynexBuilder.add('delay')">＋ Delay</button>
            <button class="btn btn-outline" onclick="DynexBuilder.add('ai')">＋ AI response</button>
          </div>
          <div class="builder-canvas">
            <div class="builder-top">
              <b>Automation flow</b><span class="draft-pill">LOCAL DRAFT</span>
            </div>
            <div id="flowNodes">
              ${nodes.map((n, i) => `
                <div class="flow-node">
                  <span class="flow-number">${i + 1}</span>
                  <div><b>${esc(n.title)}</b><small>${esc(n.type)} step</small></div>
                  <button class="node-remove" onclick="DynexBuilder.remove(${n.id})">×</button>
                </div>
                ${i < nodes.length - 1 ? '<div class="flow-connector">↓</div>' : ''}
              `).join("")}
            </div>
            <button class="btn" onclick="DynexBuilder.save()">SAVE FLOW DRAFT</button>
          </div>
        </div>
        ${note("Saved flow drafts are local to this browser. Publishing and running flows requires the backend.")}`;
    },

    inbox() {
      return heading(
        'Live Chat <span class="green">Inbox</span>',
        "Manage customer conversations in one workspace."
      ) + `
        <div class="inbox-layout">
          <div class="inbox-list">
            ${empty("💬", "No conversations yet",
              "Incoming WhatsApp conversations will appear after webhook and database setup.")}
          </div>
          <div class="inbox-chat">
            <div class="chat-placeholder">
              <span>✉</span><h3>Your conversations</h3>
              <p>Select a conversation to view messages and reply.</p>
            </div>
            <div class="chat-compose">
              <input class="form-control" disabled placeholder="Connect WhatsApp to enable replies">
              <button class="btn" disabled>Send</button>
            </div>
          </div>
        </div>
        ${note("Live conversations and replies require the WhatsApp webhook and secure inbox API.")}`;
    },

    team() {
      const members = read("team_drafts");

      return heading(
        'Team <span class="green">Access</span>',
        "Prepare teammate roles for your workspace."
      ) + panel(`
        <h2>Invite a teammate</h2>
        ${input("Email address", "teamEmail", "name@example.com", "email")}
        <label>Access role</label>
        <select class="form-control" id="teamRole">
          <option value="agent">Support agent</option>
          <option value="manager">Manager</option>
          <option value="analyst">Analyst</option>
        </select>
        <button class="btn" onclick="DynexWorkspace.invite()">SAVE INVITE DRAFT</button>
        ${note("This saves a local draft only. Real invitations require secure backend role checks.")}
      `) + `
        <h2 class="section-title">Invitation drafts</h2>
        ${members.length ? members.map(m => `
          <div class="notification"><b>${esc(m.email)}</b><p>${esc(m.role)} · Draft only</p></div>
        `).join("") : empty("👥", "No invitations", "Your invitation drafts will appear here.")}`;
    },

    api() {
      return heading(
        'API <span class="green">Access</span>',
        "Connect your applications to DYNEX BOT securely."
      ) + panel(`
        <h2>Developer access</h2>
        <div class="api-status"><span class="status-dot offline"></span>
          <b>API credentials not issued</b></div>
        <p>API access will support scoped credentials, permissions, usage limits and revocation.</p>
        <div class="api-permission">
          <b>Planned API capabilities</b>
          <ul>
            <li>Manage your bot profiles</li>
            <li>Read conversation metadata</li>
            <li>Manage approved message templates</li>
            <li>Read usage and analytics</li>
          </ul>
        </div>
        <button class="btn" disabled>GENERATE API KEY</button>
        ${note("API keys must be generated and stored securely by the backend, never in browser code.")}
      `);
    }
  };

  window.DynexBuilder = {
    add(type) {
      const labels = {
        condition: "Check a condition",
        reply: "Send a message reply",
        delay: "Wait before next step",
        ai: "Generate an AI response"
      };
      const nodes = read("flow_nodes");
      nodes.push({ id: Date.now(), type, title: labels[type] });
      save("flow_nodes", nodes);
      Dashboard.render("builder");
    },

    remove(id) {
      save("flow_nodes", read("flow_nodes").filter(n => n.id !== id));
      Dashboard.render("builder");
    },

    save() {
      Dynex.toast("Flow draft saved on this device. It is not published.");
    }
  };

  window.DynexWorkspace = {
    invite() {
      const email = document.getElementById("teamEmail").value.trim();
      const role = document.getElementById("teamRole").value;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Dynex.toast("Enter a valid email address.");
      }

      const drafts = read("team_drafts");
      drafts.push({ email, role });
      save("team_drafts", drafts);
      Dashboard.render("team");
      Dynex.toast("Invitation draft saved locally.");
    },

    addBot() {
      const name = document.getElementById("newBotName").value.trim();
      const phone = document.getElementById("newBotPhone").value.trim();

      if (!name || !/^\+[1-9]\d{7,14}$/.test(phone)) {
        return Dynex.toast("Enter a bot name and valid international phone number.");
      }

      const bots = read("bot_drafts");
      bots.push({ id: Date.now(), name, phone });
      save("bot_drafts", bots);
      Dashboard.render("bots");
      Dynex.toast("Bot profile draft saved. WhatsApp is not connected.");
    }
  };

  const originalRender = Dashboard.render.bind(Dashboard);

  Dashboard.render = function(page) {
    if (pages[page]) {
      document.getElementById("pageContent").innerHTML = pages[page]();
      document.getElementById("pageTitle").textContent = {
        builder: "Visual Bot Builder",
        inbox: "Live Chat Inbox",
        team: "Team Access",
        api: "API Access"
      }[page];

      document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
      });

      document.querySelector(".sidebar")?.classList.remove("open");
      return;
    }

    if (page === "bots") {
      const bots = read("bot_drafts");

      document.getElementById("pageContent").innerHTML =
        heading('Multiple <span class="green">Bots</span>',
          "Organize separate bot profiles and authorized business numbers.") +
        panel(`
          <h2>Add a bot profile</h2>
          ${input("Bot name", "newBotName", "e.g. Store Support")}
          ${input("WhatsApp Business number", "newBotPhone", "+2348012345678", "tel")}
          <button class="btn" onclick="DynexWorkspace.addBot()">SAVE BOT PROFILE</button>
          ${note("This creates a local profile draft. It does not connect a WhatsApp number.")}
        `) +
        `<h2 class="section-title">Your bot profiles</h2>
        <div class="feature-grid">
          ${bots.length ? bots.map(b => `
            <article class="feature-card">
              <div class="feature-icon">🤖</div>
              <h3>${esc(b.name)}</h3><p>${esc(b.phone)}</p>
              <span class="draft-pill">NOT CONNECTED</span>
            </article>
          `).join("") : empty("🤖", "No bot profiles yet", "Add a profile above.")}
        </div>`;

      document.getElementById("pageTitle").textContent = "My Bots";
      return;
    }

    if (page === "analytics") {
      const bots = read("bot_drafts");
      const schedules = read("schedules");
      const campaigns = read("campaigns");

      document.getElementById("pageContent").innerHTML =
        heading('Bot <span class="green">Analytics</span>',
          "Review workspace activity and performance.") +
        `<div class="stats-grid">
          <article class="card"><div class="stat-label">Bot profiles</div><div class="stat-value">${bots.length}</div></article>
          <article class="card"><div class="stat-label">Saved schedules</div><div class="stat-value">${schedules.length}</div></article>
          <article class="card"><div class="stat-label">Campaign drafts</div><div class="stat-value">${campaigns.length}</div></article>
        </div>` +
        empty("📊", "Live analytics not connected",
          "Real sent, delivered, read, failed and response metrics require verified backend events.");

      document.getElementById("pageTitle").textContent = "Analytics";
      return;
    }

    originalRender(page);
  };
})();
