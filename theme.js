// Theme Management Module (Light/Dark/System Sync)

export function initTheme() {
  const btn = document.getElementById("btn-theme-toggle");
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  
  if (!btn) return;
  
  const updateThemeIcon = (theme) => {
    const sun = btn.querySelector(".theme-icon-sun");
    const moon = btn.querySelector(".theme-icon-moon");
    if (!sun || !moon) return;
    
    if (theme === "dark") {
      sun.style.display = "block";
      moon.style.display = "none";
    } else {
      sun.style.display = "none";
      moon.style.display = "block";
    }
  };
  
  // Set initial icon based on storage or system default
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
  const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkNow = currentTheme === 'dark' || (currentTheme === 'system' && systemIsDark);
  updateThemeIcon(isDarkNow ? "dark" : "light");

  // Toggle button event
  btn.addEventListener("click", () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    let nextTheme = "dark";
    
    if (current === "dark") {
      nextTheme = "light";
    } else if (current === "light") {
      nextTheme = "system";
    }
    
    html.setAttribute('data-theme', nextTheme);
    
    if (nextTheme === "system") {
      localStorage.removeItem("color-scheme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      metaColorScheme.content = "light dark";
      updateThemeIcon(systemDark ? "dark" : "light");
    } else {
      localStorage.setItem("color-scheme", nextTheme);
      metaColorScheme.content = nextTheme;
      updateThemeIcon(nextTheme);
    }
  });

  // Listen to system theme changes dynamically
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (document.documentElement.getAttribute('data-theme') === "system") {
      updateThemeIcon(e.matches ? "dark" : "light");
    }
  });
}
