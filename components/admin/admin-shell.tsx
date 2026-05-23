"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Scissors,
  Image as ImageIcon,
  Calendar,
  Clock,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Users,
  Tag,
  Star,
  BarChart3,
  FileText,
  KeyRound
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/citas", label: "Citas", icon: Calendar },
  { href: "/admin/clientas", label: "Clientas", icon: Users },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/galeria", label: "Galería", icon: ImageIcon },
  { href: "/admin/testimonios", label: "Testimonios", icon: Star },
  { href: "/admin/descuentos", label: "Descuentos", icon: Tag },
  { href: "/admin/horarios", label: "Horarios", icon: Clock },
  { href: "/admin/contenido", label: "Contenido", icon: FileText },
  { href: "/admin/metricas", label: "Métricas", icon: BarChart3 },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: KeyRound }
];

export function AdminShell({
  user,
  children
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-mauve-50/40 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-mauve-100 flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-mauve-100">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-base font-semibold text-charcoal">
                Beauty Tasha
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-mauve-700">
                Admin
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-gradient-brand text-white shadow-soft"
                        : "text-charcoal-soft hover:bg-mauve-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-mauve-100 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-charcoal-soft hover:bg-mauve-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver sitio público
          </a>

          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-mauve-50/60">
            <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold">
              {user.email?.[0]?.toUpperCase() ?? "T"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-charcoal truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-charcoal/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-mauve-100 px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-semibold text-charcoal">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-lg hover:bg-mauve-50 flex items-center justify-center cursor-pointer"
            aria-label="Abrir menú"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <main className="p-6 lg:p-10 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
