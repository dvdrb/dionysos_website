// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Ștergem cookie-ul pentru a încheia sesiunea
  (
    await // Ștergem cookie-ul pentru a încheia sesiunea
    cookies()
  ).set("auth_token", "", { expires: new Date(0) });
  return NextResponse.json({ message: "Logout successful" });
}
