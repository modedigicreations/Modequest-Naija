/** Short invite link: /invite/CODE → the game, remembering who invited you. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  // Relative redirect, so it works behind any proxy or custom domain.
  return new Response(null, { status: 307, headers: { location: clean ? `/?ref=${clean}` : "/" } });
}
