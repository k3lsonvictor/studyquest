import type { AvatarItem, AvatarSlot } from "@/types";

export const slotLabels: Record<AvatarSlot, string> = {
  hair: "Cabelos",
  shirt: "Camisetas",
  pants: "Calças",
  hat: "Cabeça",
  accessory: "Acessórios",
};
export const defaultLabels: Record<AvatarSlot, string> = {
  hair: "Cabelo curto original",
  shirt: "Camiseta original",
  pants: "Calça original",
  hat: "Sem chapéu",
  accessory: "Sem acessório",
};

export function ItemArt({
  item,
}: {
  item: Pick<AvatarItem, "slot" | "style" | "color">;
}) {
  const color = item.color;
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true" className="avatar-item-art">
      <ellipse cx="60" cy="86" rx="32" ry="5" fill="#34304a" opacity=".07" />
      {item.slot === "hair" ? (
        <>
          <path
            d={
              item.style === "hair_long"
                ? "M30 81V39q0-27 30-27t30 27v42Z"
                : item.style === "hair_bob"
                  ? "M27 65V39q0-27 33-27t33 27v26Z"
                  : "M31 48V38q0-26 29-26t29 26v10Z"
            }
            fill={color}
          />
          {item.style === "hair_ponytail" && (
            <path d="M82 28q25 2 14 48L78 61Z" fill={color} />
          )}
          <rect x="40" y="31" width="40" height="43" rx="15" fill="#edb68f" />
          <path d="M33 40q-1-29 27-28t27 28L65 29 48 43V30Z" fill={color} />
          <circle cx="51" cy="50" r="2" fill="#34304a" />
          <circle cx="69" cy="50" r="2" fill="#34304a" />
          <path
            d="M54 61q6 5 12 0"
            fill="none"
            stroke="#34304a"
            strokeWidth="2"
          />
        </>
      ) : item.slot === "shirt" ? (
        <>
          <path
            d="m43 20-25 17 13 19 12-8v32h35V48l12 8 13-19-26-17Z"
            fill={color}
          />
          <path d="M49 19q11 17 22 0" fill="#f4efff" />
          <path
            d="m60 40 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z"
            fill="#ffdf91"
          />
          <path d="m78 48 8 4v28h-8Z" fill="#292243" opacity=".15" />
        </>
      ) : item.slot === "pants" ? (
        <>
          <path d="M36 20h48l-4 61H62l-2-33-3 33H39Z" fill={color} />
          <path d="M36 20h48v9H36Z" fill="#30314f" opacity=".25" />
          <path
            d="M59 29v16"
            stroke="#fff"
            strokeOpacity=".3"
            strokeWidth="2"
          />
        </>
      ) : item.style === "cap" ? (
        <>
          <path d="M29 60V48a30 30 0 0 1 60 0v12Z" fill={color} />
          <path d="M29 59h60l16 12H24Z" fill={color} />
          <path
            d="m60 29 3 7 8 1-6 5 1 7-6-4-6 4 1-7-6-5 8-1Z"
            fill="#f4efff"
          />
        </>
      ) : item.style === "crown" ? (
        <>
          <path d="m24 33 17 14 19-24 19 24 17-14-7 44H31Z" fill={color} />
          <path d="M31 67h58v10H31Z" fill="#ba791d" opacity=".35" />
          <path d="m60 48 7 9-7 9-7-9Z" fill="#a188ed" />
        </>
      ) : item.style === "headphones" ? (
        <>
          <path
            d="M30 56V44a30 30 0 0 1 60 0v12"
            fill="none"
            stroke={color}
            strokeWidth="10"
          />
          <rect x="21" y="48" width="19" height="30" rx="7" fill={color} />
          <rect x="80" y="48" width="19" height="30" rx="7" fill={color} />
          <path d="M32 53v19m56-19v19" stroke="#f4efff" strokeWidth="4" />
        </>
      ) : item.style === "glasses" ? (
        <>
          <path d="M17 43h35v26H22Zm51 0h35l-5 26H68Z" fill={color} />
          <path d="M25 49h21v14H29Zm49 0h21l-3 14H74Z" fill="#98b4cc" />
          <path
            d="M49 48q11-8 22 0"
            stroke={color}
            strokeWidth="6"
            fill="none"
          />
        </>
      ) : (
        <>
          <path d="M49 24v-6h22v6" stroke={color} strokeWidth="7" fill="none" />
          <rect x="33" y="25" width="54" height="57" rx="13" fill={color} />
          <rect
            x="43"
            y="51"
            width="34"
            height="25"
            rx="5"
            fill="#73432f"
            opacity=".27"
          />
          <path d="M47 57h26" stroke="#fff3db" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
