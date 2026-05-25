import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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
  try {
    const body = await req.json();
    const { nombre, correo, mensaje } = body;

    if (!nombre || !correo || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (typeof correo !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    if (typeof mensaje !== "string" || mensaje.trim().length < 10) {
      return NextResponse.json({ error: "El mensaje es demasiado corto" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"FarmaCompara" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO ?? "contacto@farmacompara.co",
      replyTo: `"${nombre}" <${correo}>`,
      subject: `Contacto FarmaCompara — ${nombre}`,
      text: `Nombre: ${nombre}\nCorreo: ${correo}\n\n${mensaje}`,
      html: `
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Correo:</strong> <a href="mailto:${correo}">${correo}</a></p>
        <hr/>
        <p>${mensaje.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contacto]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
