import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT ?? "465"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `MediOfertas <${process.env.SMTP_USER}>`;
const BASE = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#1f9871;padding:28px 32px;text-align:center">
      <div style="display:inline-block;background:#fff;border-radius:10px;padding:9px 18px">
        <span style="font-size:18px;font-weight:800;color:#1f9871;letter-spacing:-0.5px">Farma</span><span style="font-size:18px;font-weight:800;color:#1e3a5f;letter-spacing:-0.5px">Compara</span>
      </div>
    </div>
    <div style="padding:36px 32px">
      <h2 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#111827">${title}</h2>
      ${body}
    </div>
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        Si no solicitaste este correo, puedes ignorarlo — tu cuenta está segura.<br>
        &copy; ${new Date().getFullYear()} MediOfertas
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE}/nueva-contrasena?token=${token}`;
  const body = `
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.65">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Haz clic en el botón para crear una nueva contraseña:
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${url}"
         style="display:inline-block;background:#1f9871;color:#ffffff;font-weight:600;
                font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
        Restablecer contraseña
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center">
      Este enlace expira en <strong>1 hora</strong>.
      Si no lo solicitaste, puedes ignorar este correo.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;text-align:center;word-break:break-all">
      ${url}
    </p>`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Restablecer contraseña — MediOfertas",
    html: layout("Restablecer contraseña", body),
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE}/api/auth/verify-email?token=${token}`;
  const body = `
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.65">
      ¡Bienvenido a MediOfertas! Para activar tu cuenta y poder iniciar sesión,
      verifica tu dirección de correo electrónico:
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${url}"
         style="display:inline-block;background:#1f9871;color:#ffffff;font-weight:600;
                font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
        Verificar correo electrónico
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center">
      Este enlace expira en <strong>24 horas</strong>.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;text-align:center;word-break:break-all">
      ${url}
    </p>`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verifica tu correo — MediOfertas",
    html: layout("Verifica tu correo electrónico", body),
  });
}
