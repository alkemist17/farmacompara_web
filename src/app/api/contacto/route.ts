import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { isRateLimited, getIp } from "@/lib/rate-limit";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Límites de entrada: acotan el trabajo del parser de direcciones de nodemailer
// (avisos de DoS sin corregir en la rama 8.x, la máxima compatible con Auth.js).
const MAX_NOMBRE  = 100;
const MAX_CORREO  = 254;
const MAX_MENSAJE = 5000;

// Sin saltos de línea ni caracteres de control: el nombre va en el asunto y en Reply-To.
function limpiarLinea(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  if (isRateLimited(`contacto:${getIp(req)}`, { max: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Demasiados mensajes. Intenta en 10 minutos." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { nombre: nombreRaw, correo: correoRaw, mensaje } = body ?? {};

    if (typeof nombreRaw !== "string" || typeof correoRaw !== "string" || typeof mensaje !== "string"
        || !nombreRaw.trim() || !correoRaw.trim() || !mensaje.trim()) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const nombre = limpiarLinea(nombreRaw);
    const correo = correoRaw.trim();

    if (!nombre || nombre.length > MAX_NOMBRE) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }

    if (correo.length > MAX_CORREO || !/^[^\s@<>"(),;:]+@[^\s@<>"(),;:]+\.[^\s@<>"(),;:]+$/.test(correo)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    if (mensaje.trim().length < 10) {
      return NextResponse.json({ error: "El mensaje es demasiado corto" }, { status: 400 });
    }

    if (mensaje.length > MAX_MENSAJE) {
      return NextResponse.json({ error: "El mensaje es demasiado largo" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"MediOfertas" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO ?? "contacto@mediofertas.co",
      // Objeto en vez de cadena: nodemailer codifica el nombre y no tiene que parsear la dirección.
      replyTo: { name: nombre, address: correo },
      subject: `Contacto MediOfertas — ${nombre}`,
      text: `Nombre: ${nombre}\nCorreo: ${correo}\n\n${mensaje}`,
      html: `
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Correo:</strong> <a href="mailto:${escapeHtml(correo)}">${escapeHtml(correo)}</a></p>
        <hr/>
        <p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contacto]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
