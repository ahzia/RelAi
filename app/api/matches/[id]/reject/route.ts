/**
 * POST /api/matches/:id/reject
 * TODO(BE): update Supabase + notify Telegram.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return Response.json({ ok: true, id, status: "rejected" as const });
}
