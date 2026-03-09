import "../../assets/styles/sidebar.css";
export default class Sidebar {
  constructor(router) {
    this.router = router;
    this.user = getCurrentUser();
    this.currentRoute = "dashboard";
  }

  render() {
    const links = getNavLinks(this.user?.role);

    return `
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-slate-300 transition-transform transition-all duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:inset-0 -translate-x-full"
        id="sidebar"
      >
        <div class="flex flex-col h-full">
          <!-- Logo Area -->
          <div
            class="flex items-center gap-3 px-6 py-8 border-b border-slate-700/50"
          >
            <div
              class="bg-primary rounded-lg p-1.5 flex items-center justify-center"
            >
              <span class="material-symbols-outlined text-white text-2xl"
                >rocket_launch</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-white font-bold text-lg leading-none"
                >NexusSaaS</span
              >
              <span class="text-xs text-slate-500 font-medium">v2.4.0</span>
            </div>
          </div>
          <!-- Workspace Switcher (Condensed for Sidebar) -->
          <div class="px-4 py-6">
            <div
              class="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between cursor-pointer border border-slate-700/50"
            >
              <div class="flex items-center gap-3">
                <div
                  class="size-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs"
                >
                  SW
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-xs font-semibold text-slate-100 truncate"
                    >SaaS Workspace</span
                  >
                  <span class="text-[10px] text-slate-400"
                    >Enterprise Plan</span
                  >
                </div>
              </div>
              <span class="material-symbols-outlined text-slate-500 text-lg"
                >unfold_more</span
              >
            </div>
          </div>
          <!-- Navigation -->
          <nav class="flex-1 px-4 space-y-1 overflow-y-auto">
            <a
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white font-medium transition-colors"
              href="#"
            >
              <span class="material-symbols-outlined text-xl">dashboard</span>
              <span>Dashboard</span>
            </a>
            <a
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              <span class="material-symbols-outlined text-xl"
                >confirmation_number</span
              >
              <span>Tickets</span>
            </a>
            <a
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              <span class="material-symbols-outlined text-xl"
                >support_agent</span
              >
              <span>Agents</span>
            </a>
            <a
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              <span class="material-symbols-outlined text-xl">extension</span>
              <span>Add-ons</span>
            </a>
            <a
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              href="#"
            >
              <span class="material-symbols-outlined text-xl">settings</span>
              <span>Settings</span>
            </a>
          </nav>
          <!-- Sidebar Footer -->
          <div class="p-4 border-t border-slate-700/50">
            <div class="flex items-center gap-3 px-3 py-2">
              <div
                class="size-8 rounded-full bg-slate-700 overflow-hidden bg-cover bg-center"
                data-alt="Avatar profile of Alex Rivera"
                style="
                  background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuD-ii5JOLXAfp3ZBfH69WkzkbaPmq9VpbZLMGyJ0bAG-joU9phkMAjXCDPZxxYPhuQguhEp_GAnY9gIoqae3kBEdW6YX3GD0CTB9N1tjARqLpLKcIVdJaGMF8Fe8seNPZzKh1V_ALfxWt7j2Ignh7QP6CpYxgERHw9TQ0_TLe_kpOveOEhAixuiVjvrt6kNCPeavcr9MMr5lUSMd4NOrL3nxqTVRrGEiQfKLzmzuxLDUFgiBySF2CXCpRpYqAcVpk8aUe8lOVo1Fynl&quot;);
                "
              ></div>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-white"
                  >Alex Rivera</span
                >
                <span class="text-xs text-slate-500">Admin Account</span>
              </div>
            </div>
          </div>
        </div>
      </aside>


    `;
  }

  closeSidebarMobile() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    sidebar?.classList.remove("active");
    overlay?.classList.remove("active");
  }

  setActiveRoute(route) {
    this.currentRoute = route;

    document.querySelectorAll(".nav-link").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === route);
    });
  }

  attachEventHandlers() {
    document.querySelectorAll(".nav-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.setActiveRoute(btn.dataset.route);
        this.router.navigate(btn.dataset.route);
      });
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      logout();
      this.router.navigate("login");
    });

    document.getElementById("profileBtn")?.addEventListener("click", () => {
      this.setActiveRoute("profile");
      this.router.navigate("profile");

      this.closeSidebarMobile();
    });

    const hamburger = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("overlay");

    hamburger?.addEventListener("click", () => {
      sidebar?.classList.toggle("active");
      overlay?.classList.toggle("active");
    });

    overlay?.addEventListener("click", () => {
      this.closeSidebarMobile();
    });
  }
}