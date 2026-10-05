"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { mutate } from "@/app/actions";
import { Hidden } from "@/components/ui";
import { Submit } from "@/components/forms";
import { points } from "@/lib/format";
import type {
  AvatarAppearance,
  AvatarData,
  AvatarItem,
  AvatarSlot,
} from "@/types";
import { defaultLabels, ItemArt, slotLabels } from "./item-art";

const AvatarView = dynamic(() => import("./avatar-view"), {
  ssr: false,
  loading: () => (
    <div className="avatar-canvas avatar-loading" role="status">
      Preparando seu avatar 3D…
    </div>
  ),
});
const slots: AvatarSlot[] = ["hair", "shirt", "pants", "hat", "accessory"];

export function AvatarStudio({
  data,
  childId,
  name,
  balance,
}: {
  data: AvatarData;
  childId: string;
  name: string;
  balance: number;
}) {
  const [section, setSection] = useState<"shop" | "wardrobe">("shop");
  const [category, setCategory] = useState<AvatarSlot | "all">("all");
  const [preview, setPreview] = useState<AvatarItem | null>(null);
  const [purchase, setPurchase] = useState<AvatarItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const showcase = useRef<HTMLElement>(null);
  const revision = `${balance}:${data.equipment
    .map((e) => `${e.slot}:${e.item_id}`)
    .sort()
    .join(",")}`;
  useEffect(() => {
    setPreview(null);
    setPurchase(null);
  }, [revision]);
  const owned = new Set(data.owned.map((item) => item.item_id));
  const equipped = new Set(data.equipment.map((item) => item.item_id));
  const currentAppearance: AvatarAppearance = {};
  for (const equipment of data.equipment) {
    const item = data.catalog.find((item) => item.id === equipment.item_id);
    if (item)
      currentAppearance[item.slot] = { color: item.color, style: item.style };
  }
  const appearance = preview
    ? {
        ...currentAppearance,
        [preview.slot]: { color: preview.color, style: preview.style },
      }
    : currentAppearance;
  const items = data.catalog.filter(
    (item) =>
      (category === "all" || item.slot === category) &&
      (section === "shop" ? item.active : owned.has(item.id)),
  );
  const returnTo = `/kid/${childId}?tab=profile`;
  useEffect(() => {
    if (purchase && !dialog.current?.open) dialog.current?.showModal();
    if (!purchase && dialog.current?.open) dialog.current.close();
  }, [purchase]);
  function startPurchase(item: AvatarItem) {
    setPreview(item);
    setPurchase(item);
  }
  return (
    <section className="avatar-studio" aria-labelledby="avatar-title">
      <div className="avatar-title-row">
        <div>
          <p className="eyebrow">Um avatar com a sua cara</p>
          <h2 id="avatar-title">Seu estilo. Sua aventura.</h2>
          <p className="muted small">
            Transforme suas conquistas em um visual só seu.
          </p>
        </div>
        <span className="avatar-wallet">✦ {points(balance)} pontos</span>
      </div>
      <div className="avatar-studio-grid">
        <section
          ref={showcase}
          className="avatar-showcase"
          aria-label="Meu avatar"
        >
          <div className="avatar-showcase-label">
            <span className="avatar-live-dot" />
            {preview ? "Experimentando" : "Meu avatar"}
            <span>3D</span>
          </div>
          <AvatarView appearance={appearance} name={name} />
          <div className="avatar-nameplate">
            <h3>{preview ? preview.name : name}</h3>
            <p>
              {preview
                ? "Só uma prévia. Seu visual ainda não mudou."
                : "Pronto para a próxima missão."}
            </p>
          </div>
          {preview ? (
            <button
              type="button"
              className="button secondary wide"
              onClick={() => setPreview(null)}
            >
              Voltar ao meu visual
            </button>
          ) : (
            <div className="avatar-equipped-list">
              {slots.map((slot) => {
                const item = data.catalog.find(
                  (item) =>
                    item.id ===
                    data.equipment.find((e) => e.slot === slot)?.item_id,
                );
                return (
                  <span key={slot}>{item?.name || defaultLabels[slot]}</span>
                );
              })}
            </div>
          )}
          <p className="avatar-fineprint">
            Seu avatar original é grátis. Trocar itens do armário também!
          </p>
        </section>
        <div className="avatar-shop">
          <div className="avatar-section-switch" aria-label="Loja e armário">
            <button
              type="button"
              aria-pressed={section === "shop"}
              onClick={() => setSection("shop")}
            >
              ✧ Loja de estilos
            </button>
            <button
              type="button"
              aria-pressed={section === "wardrobe"}
              onClick={() => setSection("wardrobe")}
            >
              ▦ Meu armário <span>{owned.size}</span>
            </button>
          </div>
          <div className="avatar-categories" aria-label="Filtrar itens">
            <button
              type="button"
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              Tudo
            </button>
            {slots.map((slot) => (
              <button
                type="button"
                key={slot}
                aria-pressed={category === slot}
                onClick={() => setCategory(slot)}
              >
                {slotLabels[slot]}
              </button>
            ))}
          </div>
          <p className="small muted avatar-shop-note">
            {section === "shop"
              ? "Compras usam os mesmos pontos das recompensas e ficam no seu armário. Você confirma antes de gastar."
              : "Seus itens são seus! Equipe, troque ou volte ao visual original sem gastar pontos."}
          </p>
          <div className="avatar-product-grid">
            {section === "wardrobe" &&
              slots
                .filter((slot) => category === "all" || category === slot)
                .map((slot) => {
                  const isDefault = !data.equipment.some(
                    (e) => e.slot === slot,
                  );
                  return (
                    <article
                      key={slot}
                      className="avatar-product avatar-default"
                    >
                      <div className="avatar-product-visual">
                        <span className="avatar-default-symbol" aria-hidden>
                          {slot === "shirt"
                            ? "✦"
                            : slot === "pants"
                              ? "Ⅱ"
                              : "○"}
                        </span>
                      </div>
                      <p className="eyebrow">Visual original</p>
                      <h3>{defaultLabels[slot]}</h3>
                      <span className="small muted">Sempre grátis</span>
                      <form action={mutate}>
                        <Hidden
                          values={{
                            action: "avatar_equip",
                            child_id: childId,
                            slot,
                            id: "",
                            returnTo,
                          }}
                        />
                        <Submit disabled={isDefault} variant="secondary wide">
                          {isDefault ? "Em uso" : "Usar original"}
                        </Submit>
                      </form>
                    </article>
                  );
                })}
            {items.map((item) => {
              const has = owned.has(item.id),
                using = equipped.has(item.id),
                missing = Math.max(0, item.points_cost - balance);
              return (
                <article
                  key={item.id}
                  className={`avatar-product ${using ? "is-equipped" : ""}`}
                  aria-label={item.name}
                >
                  <div className="avatar-product-visual">
                    <ItemArt item={item} />
                    {using ? (
                      <span className="avatar-product-tag">✓ Em uso</span>
                    ) : has ? (
                      <span className="avatar-product-tag owned">
                        No armário
                      </span>
                    ) : null}
                  </div>
                  <p className="eyebrow">{slotLabels[item.slot]}</p>
                  <h3>{item.name}</h3>
                  <p className="avatar-product-description">
                    {item.description}
                  </p>
                  <div className="between">
                    <span className={has ? "small muted" : "points"}>
                      {has
                        ? "Já é seu"
                        : `✦ ${points(item.points_cost)} pontos`}
                    </span>
                    <button
                      className="text-link"
                      type="button"
                      aria-label={`Experimentar ${item.name}`}
                      aria-pressed={preview?.id === item.id}
                      onClick={() => {
                        setPreview(item);
                        if (window.innerWidth <= 760)
                          showcase.current?.scrollIntoView({
                            block: "start",
                            behavior: window.matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches
                              ? "instant"
                              : "smooth",
                          });
                      }}
                    >
                      Experimentar
                    </button>
                  </div>
                  {has ? (
                    <form action={mutate}>
                      <Hidden
                        values={{
                          action: "avatar_equip",
                          child_id: childId,
                          slot: item.slot,
                          id: item.id,
                          returnTo,
                        }}
                      />
                      <Submit variant="secondary wide" disabled={using}>
                        {using ? "Equipado" : "Equipar"}
                      </Submit>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="button wide"
                      disabled={missing > 0}
                      onClick={() => startPurchase(item)}
                    >
                      {missing
                        ? `Faltam ${points(missing)} pontos`
                        : `Comprar por ${points(item.points_cost)} pontos`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
          {section === "wardrobe" && owned.size === 0 && (
            <p className="avatar-empty-note">
              Seu armário começa com o visual original. Complete missões para
              conquistar novos estilos!
            </p>
          )}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="avatar-purchase-dialog"
        aria-labelledby="avatar-purchase-title"
        onCancel={() => setPurchase(null)}
        onClose={() => setPurchase(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPurchase(null);
        }}
      >
        {purchase && (
          <>
            <div className="avatar-dialog-art">
              <ItemArt item={purchase} />
            </div>
            <p className="eyebrow">Uma nova conquista para seu avatar</p>
            <h2 id="avatar-purchase-title">Comprar {purchase.name}?</h2>
            <p className="muted" style={{ margin: "12px 0" }}>
              Você vai gastar{" "}
              <strong>{points(purchase.points_cost)} pontos</strong>. O item
              fica no seu armário e já será equipado.
            </p>
            <div className="avatar-purchase-balance">
              <span>Seu saldo depois da compra</span>
              <strong>✦ {points(balance - purchase.points_cost)} pontos</strong>
            </div>
            <p className="small muted" style={{ marginBottom: 20 }}>
              A compra é definitiva. Esses pontos deixam de estar disponíveis
              para outras recompensas.
            </p>
            <form
              action={mutate}
              className="form"
              onSubmit={() => dialog.current?.close()}
            >
              <Hidden
                values={{
                  action: "avatar_buy",
                  child_id: childId,
                  id: purchase.id,
                  returnTo,
                }}
              />
              <Submit>
                Confirmar compra · {points(purchase.points_cost)} pontos
              </Submit>
              <button
                className="button ghost"
                type="button"
                onClick={() => setPurchase(null)}
              >
                Agora não
              </button>
            </form>
          </>
        )}
      </dialog>
    </section>
  );
}
