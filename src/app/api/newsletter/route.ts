import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (isRateLimited(`newsletter:${getIp(req)}`, { max: 3, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta en una hora." },
      { status: 429 }
    );
  }

  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }

  const apiKey = process.env.MAILERLITE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });
  }

  const payload: Record<string, unknown> = { email };
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  if (groupId) payload.groups = [groupId];

  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  // 200 = suscriptor actualizado (ya existía), 201 = nuevo suscriptor
  if (res.status === 200 || res.status === 201) {
    return NextResponse.json({ ok: true });
  }

  console.error("[newsletter] MailerLite error:", res.status, await res.text());
  return NextResponse.json(
    { error: "No pudimos registrarte. Intenta de nuevo." },
    { status: 502 }
  );
}
