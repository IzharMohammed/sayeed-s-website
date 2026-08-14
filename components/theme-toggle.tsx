"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return (
    <button className="icon-button" onClick={toggle} aria-label="Toggle colour theme">
      <Moon className="theme-icon-light" size={18} />
      <Sun className="theme-icon-dark" size={18} />
    </button>
  );
}
