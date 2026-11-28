
const adminContent = document.getElementById("adminContent");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const navButtons = document.querySelectorAll(".admin-nav button");

const views = {
  overview: `
    <div class="welcome-section">
      <p>WELCOME BACK, ADMIN</p>
      <h2>DYNEX BOT Control Center</h2>
      <p>Manage and monitor your platform from one place.</p>
    </div>

    <div class="stats-grid">
      <div class="admin-card">
        <span class="stat-icon">♙</span>
        <p>Total Users</p>
        <h2>—</h2>
        <small>Awaiting database connection</small>
      </div>

      <div class="admin-card">
        <span class="stat-icon">⌁</span>
        <p>WhatsApp Connections</p>
        <h2>—</h2>
        <small>Awaiting API integration</small>
      </div>

      <div class="admin-card">
        <span class="stat-icon">◇</span>
        <p>Active Subscriptions</p>
        <h2>—</h2>
        <small>Awaiting payment integration</small>
      </div>

      <div class="admin-card">
        <span class="stat-icon">₦</span>
        <p>Total Revenue</p>
        <h2>—</h2>
        <small>Awaiting verified payment records</small>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="panel">
        <h3>Platform Overview</h3>
        <p>Your administration workspace is ready.</p>
        <div class="overview-line">
          <span>Admin interface</span>
          <strong class="green-text">READY</strong>
        </div>
        <div class="overview-line">
          <span>Database</span>
          <strong>NOT CONNECTED</strong>
        </div>
        <div class="overview-line">
          <span>WhatsApp API</span>
          <strong>NOT CONNECTED</strong>
        </div>
        <div class="overview-line">
          <span>Payment system</span>
          <strong>NOT CONNECTED</strong>
        </div>
      </div>

      <div class="panel">
        <h3>Quick Actions</h3>
        <p>Choose an administration section.</p>
        <div class="quick-actions">
          <button data-go="users">Manage Users</button>
          <button data-go="connections">WhatsApp Connections</button>
          <button data-go="plans">Manage Plans</button>
          <button data-go="settings">Platform Settings</button>
        </div>
      </div>
    </div>
  `,

  users: `
    <h2>User Accounts</h2>
    <p>Review and manage DYNEX BOT customer accounts.</p>
    <div class="panel">
      <h3>Account Management</h3>
      <p>User records will appear here after secure authentication and database integration.</p>
      <div class="empty-state">
        <span>♙</span>
        <h3>No live user records</h3>
        <p>Connect the platform database to load real accounts.</p>
      </div>
    </div>
  `,

  connections: `
    <h2>WhatsApp Connections</h2>
    <p>Monitor customers' official WhatsApp Business API connections.</p>
    <div class="panel">
      <h3>Connection Monitor</h3>
      <div class="empty-state">
        <span>⌁</span>
        <h3>No connected accounts</h3>
        <p>WhatsApp Cloud API integration is required to display live connections.</p>
      </div>
    </div>
  `,

  plans: `
    <h2>Plans & Subscriptions</h2>
    <p>Manage platform packages and subscription status.</p>
    <div class="dashboard-grid">
      <div class="panel">
        <h3>Starter Plan</h3>
        <p>Subscription package configuration.</p>
        <strong>NOT CONFIGURED</strong>
      </div>
      <div class="panel">
        <h3>Professional Plan</h3>
        <p>Subscription package configuration.</p>
        <strong>NOT CONFIGURED</strong>
      </div>
      <div class="panel">
        <h3>Business Plan</h3>
        <p>Subscription package configuration.</p>
        <strong>NOT CONFIGURED</strong>
      </div>
    </div>
  `,

  payments: `
    <h2>Payments</h2>
    <p>Monitor verified subscription payments and transactions.</p>
    <div class="panel">
      <h3>Payment Records</h3>
      <div class="empty-state">
        <span>₦</span>
        <h3>No payment records</h3>
        <p>Payment provider and database integration are required before real transactions can appear.</p>
      </div>
    </div>
  `,

  announcements: `
    <h2>Announcements</h2>
    <p>Prepare important platform updates for customers.</p>
    <div class="panel">
      <h3>Announcement Composer</h3>
      <label for="announcementTitle">Announcement title</label>
      <input id="announcementTitle" placeholder="Enter announcement title">

      <label for="announcementMessage">Message</label>
      <textarea id="announcementMessage" rows="5" placeholder="Write your announcement..."></textarea>

      <button id="saveAnnouncement" disabled>Publish announcement</button>
      <p>Publishing will be enabled after secure backend integration.</p>
    </div>
  `,

  audit: `
    <h2>Activity Log</h2>
    <p>Track administrative actions and platform events.</p>
    <div class="panel">
      <h3>Audit History</h3>
      <div class="empty-state">
        <span>≡</span>
        <h3>No audit records</h3>
        <p>Secure backend audit logging has not yet been connected.</p>
      </div>
    </div>
  `,

  api: `
    <h2>DYNEX API Platform</h2>
    <p>Manage developer access, free and paid plans, and API usage.</p>
    <div class="panel">
      <h3>Owner authorization</h3>
      <label for="dynexAdminSecret">DYNEX admin secret</label>
      <input id="dynexAdminSecret" type="password" autocomplete="off" placeholder="Enter the Cloudflare DYNEX_ADMIN_SECRET">
      <button id="loadApiDevelopers" type="button">Load developer accounts</button>
      <p id="apiAdminMessage">The secret is used only for this request and is not saved.</p>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>Developer accounts</h3>
      <div id="apiDeveloperList" class="empty-state"><p>Authorize to view API developers.</p></div>
    </div>
  `,

  settings: `
    <h2>Platform Settings</h2>
    <p>Configure DYNEX BOT platform preferences.</p>
    <div class="panel">
      <h3>General Settings</h3>
      <label>Platform name</label>
      <input value="DYNEX BOT" readonly>

      <label>Platform status</label>
      <input value="Frontend interface — backend pending" readonly>

      <label>WhatsApp integration</label>
      <input value="Meta WhatsApp Cloud API — pending" readonly>

      <p>Live configuration controls will be added after backend security and database setup.</p>
    </div>
  `
};

function showView(viewName) {
  if (!views[viewName]) return;

  adminContent.innerHTML = views[viewName];

  const activeButton = document.querySelector(
    `.admin-nav button[data-view="${viewName}"]`
  );

  pageTitle.textContent = activeButton
    ? activeButton.textContent.trim().replace(/^[^\w]+/, "")
    : "Overview";

  navButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === viewName
    );
  });

  sidebar.classList.remove("open");

  if (viewName === "api") setupApiAdminView();

  adminContent.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
      showView(button.dataset.go);
    });
  });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.addEventListener("click", event => {
  if (
    window.innerWidth <= 800 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    sidebar.classList.remove("open");
  }
});

showView("overview");


function setupApiAdminView() {
  const loadButton = document.getElementById("loadApiDevelopers");
  if (!loadButton) return;
  loadButton.addEventListener("click", loadApiDevelopers);
}
async function loadApiDevelopers() {
  const secret = document.getElementById("dynexAdminSecret")?.value || "";
  const message = document.getElementById("apiAdminMessage");
  const list = document.getElementById("apiDeveloperList");
  if (!secret) { message.textContent = "Enter the DYNEX admin secret first."; return; }
  message.textContent = "Loading developer accounts…";
  try {
    const response = await fetch("https://dynex-bot-ai5dcf.destinychukwudi209.workers.dev/admin/api/developers", {
      headers: { "Authorization": "Bearer " + secret }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load developer accounts.");
    list.innerHTML = "";
    if (!data.developers?.length) { list.textContent = "No developer accounts yet."; message.textContent = "API platform connected."; return; }
    const table = document.createElement("table");
    table.innerHTML = "<thead><tr><th>Developer</th><th>Plan</th><th>Status</th><th>Monthly requests</th><th>Save</th></tr></thead>";
    const tbody = document.createElement("tbody");
    data.developers.forEach(dev => {
      const tr = document.createElement("tr");
      const email = document.createElement("td"); email.textContent = dev.email;
      const planCell = document.createElement("td");
      const plan = document.createElement("select");
      [["free","Free"],["paid","Paid"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;plan.appendChild(o);});
      plan.value=dev.plan; planCell.appendChild(plan);
      const statusCell = document.createElement("td");
      const status = document.createElement("select");
      [["active","Active"],["suspended","Suspended"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;status.appendChild(o);});
      status.value=dev.status; statusCell.appendChild(status);
      const usage = document.createElement("td"); usage.textContent=String(dev.monthly_requests)+" requests · "+String(dev.active_keys)+" keys";
      const action = document.createElement("td"); const save=document.createElement("button");save.textContent="Save";
      save.addEventListener("click",async()=>{
        save.disabled=true;
        try {
          const result=await fetch("https://dynex-bot-ai5dcf.destinychukwudi209.workers.dev/admin/api/developers/"+dev.id,{
            method:"POST",headers:{"Authorization":"Bearer "+secret,"Content-Type":"application/json"},
            body:JSON.stringify({plan:plan.value,status:status.value})
          });
          const payload=await result.json();if(!result.ok)throw new Error(payload.error||"Save failed.");
          message.textContent="Updated "+dev.email+"."; 
        } catch(error){message.textContent=error.message;} finally{save.disabled=false;}
      });
      action.appendChild(save);tr.append(email,planCell,statusCell,usage,action);tbody.appendChild(tr);
    });
    table.appendChild(tbody);list.appendChild(table);message.textContent="Loaded "+data.developers.length+" developer accounts.";
  } catch(error) { message.textContent=error.message; list.textContent="Unable to load developer accounts."; }
}
