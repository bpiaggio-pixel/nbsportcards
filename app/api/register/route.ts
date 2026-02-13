import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // ✅ Validación básica
    if (!email || !password) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // ✅ Normalizar email
    const cleanEmail = String(email).trim().toLowerCase();

    // ✅ Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return Response.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // ✅ Encriptar password
    const hashed = await bcrypt.hash(password, 10);

    // ✅ Crear usuario y devolverlo sin password
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashed,
      },
      select: {
        id: true,
        email: true,
      },
    });

    // ✅ Devolver user para que el frontend lo guarde en localStorage
    return Response.json({ user });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
