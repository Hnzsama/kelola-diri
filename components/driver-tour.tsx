"use client"

import { driver as createDriver } from "driver.js"
import { data as sidebarData } from "@/components/app-sidebar"

// We load the driver.js stylesheet at runtime to avoid Next.js build-time
// resolution issues for node_modules CSS imports.
function ensureDriverCss() {
  if (typeof document === "undefined") return
  if (document.querySelector("link[data-driver-css]")) return

  const link = document.createElement("link")
  link.setAttribute("rel", "stylesheet")
  link.setAttribute("data-driver-css", "true")
  link.href = "https://cdn.jsdelivr.net/npm/driver.js@1.4.0/dist/driver.min.css"
  document.head.appendChild(link)
}

export function startDriverTour() {
  ensureDriverCss()
  // `driver.js` exports a factory function `driver` which returns the driver
  // instance. Call the factory instead of using `new`.
  const driver = createDriver({
    animate: true,
    overlayOpacity: 0.6,
    doneBtnText: "Selesai",
    nextBtnText: "Berikutnya",
    prevBtnText: "Sebelumnya",
  })

  // `driver.js` instance uses `setSteps` and `drive` methods.
  const baseSteps = [
    {
      element: '[data-slot="sidebar-trigger"]',
      popover: {
        title: "Sidebar",
        description: "Buka/tutup navigasi utama aplikasi (fitur, profil, pengaturan).",
        position: "right",
      },
    },
    {
      element: '[data-slot="sidebar-menu"]',
      popover: {
        title: "Navigasi",
        description: "Akses fitur utama: akademik, keuangan, tujuan, kebiasaan, dan lainnya.",
        position: "right",
      },
    },
    {
      element: '[data-tour="app-title"]',
      popover: {
        title: "Nama Aplikasi",
        description: "Ini adalah Kelola Diri — sistem manajemen pribadi untuk mahasiswa.",
        position: "bottom",
      },
    },
    {
      element: '[data-tour="theme-toggle"]',
      popover: {
        title: "Tema",
        description: "Ganti antara mode terang dan gelap untuk kenyamanan mata.",
        position: "left",
      },
    },
  ]

  // Collect sidebar navigation targets (nav-*) and build steps for each.
  const navSteps: any[] = []
  // Build menu / submenu descriptions from `sidebarData` so all menu+submenus are covered.
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  const menuDescriptions: Record<string, string> = {}
  const submenuDescriptions: Record<string, string> = {}

  // Load handcrafted descriptions if available, otherwise generate defaults
  try {
    // dynamic import of possible manual descriptions file
    // prefer explicit mapping file if present
    // (do a static import fallback below)
  } catch (_) {}

  if (sidebarData?.navMain) {
    for (const item of sidebarData.navMain) {
      const group = slug(item.title)
      menuDescriptions[group] = `${item.title} — akses fitur terkait ${item.title.toLowerCase()} dan ringkasan modul.`

      if (item.items?.length) {
        for (const sub of item.items) {
          const subSlug = slug(sub.title)
          const key = `${group}-${subSlug}`
          submenuDescriptions[key] = `${sub.title} — buka halaman ${sub.title.toLowerCase()} untuk melihat detail dan melakukan tindakan.`
        }
      }
    }
  }

  // Merge handcrafted overrides if file exists
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const manual = require("@/components/menu-descriptions")
    if (manual?.menuDescriptions) {
      Object.assign(menuDescriptions, manual.menuDescriptions)
    }
    if (manual?.submenuDescriptions) {
      Object.assign(submenuDescriptions, manual.submenuDescriptions)
    }
  } catch (e) {
    // ignore if manual mapping not available
  }
  try {
    if (typeof document !== "undefined") {
      const navEls = Array.from(
        document.querySelectorAll<HTMLElement>('[data-tour^="nav-"]')
      )

      // Keep order as rendered in DOM and build richer descriptions per menu
      for (const el of navEls) {
        const text = (el.innerText || el.getAttribute("aria-label") || "").trim()
        if (!text) continue

        const dt = el.getAttribute("data-tour")
        if (!dt) continue
        const parts = dt.split("-") // ['nav', 'group', 'sub', ...]
        const title = text.split("\n")[0] || text

        // Detect if this is a submenu (has group + sub)
        const isSub = parts.length > 2

        let description = ""

        if (!isSub) {
          const groupSlug = parts[1]
          // Use custom description when available
          const custom = menuDescriptions[groupSlug]
          if (custom) {
            description = custom
          } else {
            // Fallback: list its submenu items (if any)
            const selector = `[data-tour^=\"nav-${groupSlug}-\"]`
            const subEls = Array.from(document.querySelectorAll<HTMLElement>(selector))
            const subTitles = subEls
              .map((s) => (s.innerText || s.getAttribute("aria-label") || "").trim().split("\n")[0] || "")
              .filter(Boolean)
            if (subTitles.length > 0) {
              description = `${title} — berisi: ${subTitles.join(", ")}. Klik salah satu untuk membuka halaman terkait.`
            } else {
              description = `${title} — klik untuk membuka menu ini.`
            }
          }
        } else {
          // Submenu: try to use a precise description if available
          const parent = parts[1]
          const sub = parts.slice(2).join("-")
          const key = `${parent}-${sub}`
          const specific = submenuDescriptions[key]
          if (specific) {
            description = specific
          } else {
            const parentTextEl = document.querySelector<HTMLElement>(`[data-tour=\"nav-${parent}\"]`)
            const parentTitle = parentTextEl ? (parentTextEl.innerText || parentTextEl.getAttribute("aria-label") || "").trim().split("\n")[0] : parent
            const parentCustom = menuDescriptions[parent]
            description = parentCustom
              ? `Submenu: ${title} — bagian dari ${parentTitle}. ${parentCustom}`
              : `Submenu: ${title} — bagian dari ${parentTitle}. Klik untuk membuka halaman terkait.`
          }
        }

        navSteps.push({
          element: el,
          popover: {
            title,
            description,
            position: "right",
          },
        })
      }
    }
  } catch (e) {
    // ignore DOM errors
  }

  driver.setSteps([...baseSteps, ...navSteps])

  driver.drive()
}
