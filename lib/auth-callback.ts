type Exchange = (
  code: string,
  options?: { flowId?: string },
) => Promise<{ error: unknown; data: { session: unknown } }>;

// Return only fixed internal destinations; do not forward tokens or raw errors.
export async function confirmationDestination(
  params: URLSearchParams,
  exchange: Exchange,
): Promise<string> {
  const fallback =
    "/login?error=" +
    encodeURIComponent(
      "Não foi possível iniciar a sessão pelo link. Se você já confirmou o e-mail, entre com sua senha. Abra novos links no mesmo navegador usado no cadastro.",
    );
  const code = params.get("code");
  if (!code || params.has("error") || params.has("error_code")) return fallback;
  try {
    const flowId = params.get("sb_flow_id");
    const { data, error } = await exchange(
      code,
      flowId ? { flowId } : undefined,
    );
    if (!error && data.session) return "/app";
  } catch {
    // Connection failures have the same safe retry path as expired links.
  }
  return fallback;
}
