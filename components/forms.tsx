"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function Submit({
  children,
  variant = "",
  disabled = false,
  name,
  value,
}: {
  children: ReactNode;
  variant?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`button ${variant}`}
      disabled={pending || disabled}
      name={name}
      value={value}
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}
export function ConfirmForm({
  action,
  children,
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Excluir esta atividade? Esta ação não pode ser desfeita.",
          )
        )
          e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
