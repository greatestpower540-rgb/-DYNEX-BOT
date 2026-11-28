const API_BASE = window.DYNEX_API_BASE || "https://dynex-bot-ai5dcf.destinychukwudi209.workers.dev";
const $ = (id) => document.getElementById(id);
const authPanel = $("authPanel"), dashboard = $("dashboard");
let currentKey = "";
async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, { credentials: "include", ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function message(id, text, good = false) { const node=$(id); node.textContent=text; node.style.color=good?"#a3ff45":"#ff9c9c"; }
function showAuth() { authPanel.hidden=false; dashboard.hidden=true; }
function showDashboard() { authPanel.hidden=true; dashboard.hidden=false; }
async function refresh() {
  try {
    const me=await api("/developers/me");
    if(!me.authenticated){showAuth();return;}
    showDashboard();
    $("planValue").textContent=me.developer.plan.toUpperCase();
    $("usageValue").textContent=me.usage.requests.toLocaleString()+" / "+me.usage.limit.toLocaleString();
    $("keyCount").textContent=me.active_keys;
    await loadKeys();
  } catch(e) { $("connection").textContent=e.message; showAuth(); }
}
async function loadKeys() {
  const data=await api("/developers/keys");
  const list=$("keysList");
  if(!data.keys.length){list.innerHTML='<p class="muted">You have not created an API key yet.</p>';return;}
  list.innerHTML=data.keys.map(k=>'<div class="key-row"><div><strong></strong><small></small><code></code></div><button type="button">Revoke</button></div>').join("");
  [...list.children].forEach((row,i)=>{
    const k=data.keys[i];row.querySelector("strong").textContent=k.name;
    row.querySelector("small").textContent=k.status.toUpperCase()+" · Created "+new Date(k.created_at+"Z").toLocaleDateString();
    row.querySelector("code").textContent=k.key_prefix+"••••••••";
    const btn=row.querySelector("button");btn.disabled=k.status!=="active";
    btn.addEventListener("click",async()=>{if(!confirm("Revoke this API key? Applications using it will stop working."))return;try{await api("/developers/keys/"+k.id,{method:"DELETE"});await loadKeys();await refreshStats();}catch(e){alert(e.message);}});
  });
}
async function refreshStats(){const me=await api("/developers/me");$("keyCount").textContent=me.active_keys;}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api("/developers/login",{method:"POST",body:JSON.stringify({email:f.get("email"),password:f.get("password")})});message("loginMessage","Signed in.",true);await refresh();}catch(err){message("loginMessage",err.message);}});
$("registerForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api("/developers/register",{method:"POST",body:JSON.stringify({email:f.get("email"),password:f.get("password")})});message("registerMessage","Account created.",true);await refresh();}catch(err){message("registerMessage",err.message);}});
$("createKey").addEventListener("click",async()=>{const name=prompt("Name this API key (e.g. My website):","My project");if(name===null)return;try{const data=await api("/developers/keys",{method:"POST",body:JSON.stringify({name})});currentKey=data.key;$("newKeyValue").textContent=currentKey;$("newKey").hidden=false;await loadKeys();await refreshStats();}catch(e){alert(e.message);}});
$("copyKey").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(currentKey);$("copyKey").textContent="Copied";}catch{$("copyKey").textContent="Select and copy the key";}});
$("logout").addEventListener("click",async()=>{try{await api("/developers/logout",{method:"POST"});}finally{showAuth();}});
$("connection").textContent="API service";
refresh();
