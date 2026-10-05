import type { Metadata } from "next";
import { PRODUCT_NAME } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: PRODUCT_NAME, template: `%s · ${PRODUCT_NAME}` },
  description:
    "Pequenas conquistas. Grandes descobertas. Uma rotina de estudos mais leve para sua família.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
