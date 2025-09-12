// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  // Verifică dacă datele de login corespund cu cele din .env
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Dacă da, setăm un cookie pentru a marca sesiunea ca activă
    (
      await // Dacă da, setăm un cookie pentru a marca sesiunea ca activă
      cookies()
    ).set("auth_token", "secret-authenticated-value", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 ore
      path: "/",
    });
    return NextResponse.json({ message: "Login successful" });
  }

  // Dacă nu, returnăm o eroare
  return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
}
