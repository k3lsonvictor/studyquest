"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Driver } from "driver.js";

export function ProductTour({
  identity,
  role,
}: {
  identity: string;
  role: "parent" | "kid";
}) {
  const path = usePathname();
  const query = useSearchParams();
  const tab = query.get("tab") || "missions";
  const setupStep = query.get("step");
  const storageKey = `studyquest:tour:v1:${role}:${identity}${path === "/onboarding" ? ":setup" : ""}`;
  const [invitation, setInvitation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const instance = useRef<Driver | null>(null);
  const generation = useRef(0);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setInvitation(!localStorage.getItem(storageKey));
    } catch {
      setInvitation(true);
    }
    return () => {
      generation.current++;
      instance.current?.destroy();
      instance.current = null;
    };
  }, [storageKey]);

  useEffect(() => {
    setLoading(false);
    setError("");
    return () => {
      generation.current++;
      instance.current?.destroy();
      instance.current = null;
    };
  }, [path, tab, setupStep]);

  function remember() {
    setInvitation(false);
    try {
      localStorage.setItem(storageKey, "seen");
    } catch {
      /* Tour remains usable when storage is blocked. */
    }
  }

  async function start() {
    if (loading || instance.current?.isActive()) return;
    setLoading(true);
    setError("");
    const current = generation.current;
    try {
      const [{ driver }, { tourSteps }] = await Promise.all([
        import("driver.js"),
        import("./steps"),
      ]);
      if (current !== generation.current) return;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const tour = driver({
        steps: tourSteps(role, path, tab),
        animate: !reducedMotion,
        smoothScroll: false,
        disableActiveInteraction: true,
        allowKeyboardControl: true,
        allowClose: true,
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Próximo →",
        prevBtnText: "← Voltar",
        doneBtnText: "Concluir",
        popoverClass: "studyquest-tour",
        stagePadding: 6,
        stageRadius: 14,
        overlayColor: "#282740",
        overlayOpacity: 0.55,
        onPopoverRender(popover) {
          popover.closeButton.textContent = "Pular";
          popover.closeButton.setAttribute("aria-label", "Pular tour");
          popover.wrapper.setAttribute("aria-modal", "true");
          popover.nextButton.focus({ preventScroll: true });
        },
        onDestroyed() {
          instance.current = null;
          if (current === generation.current)
            trigger.current?.focus({ preventScroll: true });
        },
      });
      instance.current = tour;
      remember();
      tour.drive();
    } catch {
      if (current === generation.current)
        setError("Não foi possível abrir o guia. Tente novamente.");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }

  return (
    <section
      className={`tour-help ${invitation ? "tour-welcome" : ""}`}
      aria-label="Guia da plataforma"
    >
      {invitation && (
        <div className="tour-welcome-copy">
          <span className="tour-spark" aria-hidden="true">
            ✦
          </span>
          <div>
            <strong>
              {role === "kid"
                ? "Vamos conhecer sua aventura?"
                : "Conheça os caminhos da sua família"}
            </strong>
            <p>
              Um guia rápido para dar os primeiros passos. Você pode pular
              quando quiser.
            </p>
          </div>
        </div>
      )}
      <div className="tour-help-actions">
        <button
          ref={trigger}
          type="button"
          className={`button ${invitation ? "" : "secondary"}`}
          onClick={start}
          disabled={loading}
        >
          {loading
            ? "Abrindo guia…"
            : invitation
              ? "Conhecer a plataforma"
              : "Como funciona"}
        </button>
        {invitation && (
          <button type="button" className="button ghost" onClick={remember}>
            Agora não
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
