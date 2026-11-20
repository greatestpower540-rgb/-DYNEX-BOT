
/* =================================
   DYNEX BOT - MAIN APPLICATION
================================= */

const Dynex = {
  currentPage: "dashboard",

  pages: {
    dashboard: "Dashboard",
    connect: "WhatsApp Connection",
    bots: "My Bots",
    autoReply: "Auto Reply",
    ai: "AI Assistant",
    scheduler: "Message Scheduler",
    campaigns: "Messaging Campaigns",
    analytics: "Analytics",
    settings: "Settings",
    account: "My Account"
  },

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupBotStatus();
    this.setupForms();
    this.setupWelcome();
    this.navigate("dashboard");
  },

  navigate(page) {
    if (!this.pages[page]) {
      this.toast("Page not found.");
      return;
    }

    this.currentPage = page;

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.page === page
      );
    });

    const title = document.getElementById("pageTitle");

    if (title) {
      title.textContent = this.pages[page];
    }

    if (typeof Dashboard !== "undefined") {
      Dashboard.render(page);
    }

    document.querySelector(".sidebar")?.classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  setupNavigation() {
    document.addEventListener("click", event => {
      const link = event.target.closest("[data-page]");

      if (!link) return;

      event.preventDefault();
      this.navigate(link.dataset.page);
    });
  },

  setupMobileMenu() {
    const toggle = document.getElementById("menuToggle");

    toggle?.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  },

  setupBotStatus() {
    const savedStatus = localStorage.getItem("dynex_bot_status");
    this.setBotStatus(savedStatus === "true");
  },

  setBotStatus(active) {
    localStorage.setItem("dynex_bot_status", String(active));

    const status = document.getElementById("botStatus");
    const statusText = document.getElementById("botStatusText");

    if (status) {
      status.classList.toggle("offline", !active);
    }

    if (statusText) {
      statusText.textContent = active
        ? "Interface enabled — WhatsApp backend not connected"
        : "Bot interface is switched off";
    }
  },

  toggleBot() {
    const current = localStorage.getItem("dynex_bot_status") === "true";

    this.setBotStatus(!current);

    this.toast(
      !current
        ? "Bot interface enabled. Backend connection is still required."
        : "Bot interface switched off."
    );
  },

  setupForms() {
    document.addEventListener("submit", event => {
      const form = event.target;

      if (form.matches("[data-dynex-form]")) {
        event.preventDefault();
        this.toast("Saved locally. Backend integration is required for permanent storage.");
      }
    });
  },

  setupWelcome() {
    const user = localStorage.getItem("dynex_username");
    const name = document.getElementById("welcomeName");

    if (name && user) {
      name.textContent = user;
    }
  },

  saveSetting(key, value) {
    localStorage.setItem("dynex_" + key, value);
  },

  getSetting(key, fallback = "") {
    return localStorage.getItem("dynex_" + key) || fallback;
  },

  toast(message) {
    const toast = document.getElementById("dynexToast");

    if (!toast) {
      alert(message);
      return;
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(this.toastTimer);

    this.toastTimer = setTimeout(() => {
      toast.style.display = "none";
    }, 3500);
  },

  logout() {
    localStorage.removeItem("dynex_username");
    this.toast("You have been logged out of this browser.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Dynex.init();
});
    
