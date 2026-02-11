import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email y password requeridos" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const ok = await bcrypt.compare(String(password), user.password);

    if (!ok) {
      return Response.json({ error: "Password incorrecta" }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    return Response.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
