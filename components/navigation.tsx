"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const main = [
  ["/app", "⌂", "Início"],
  ["/app/activities", "▤", "Atividades"],
  ["/app/approvals", "✓", "Aprovações"],
  ["/app/rewards", "♧", "Recompensas"],
  ["/app/profile", "○", "Perfil"],
];
export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  const links = mobile
    ? main
    : [
        ...main.slice(0, 1),
        ["/app/children", "☺", "Crianças"],
        ["/app/subjects", "▦", "Categorias"],
        ...main.slice(1, 4),
        ["/app/redemptions", "☆", "Resgates"],
        main[4],
      ];
  return (
    <nav
      aria-label={mobile ? "Navegação inferior" : "Principal"}
      className={mobile ? "bottom-nav" : "nav"}
    >
      {links.map(([url, icon, label]) => (
        <Link
          key={url}
          href={url}
          data-tour-link={url}
          className={
            path === url || (url !== "/app" && path.startsWith(url + "/"))
              ? "active"
              : ""
          }
          aria-current={path === url ? "page" : undefined}
        >
          <span className="nav-icon" aria-hidden>
            {icon}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
