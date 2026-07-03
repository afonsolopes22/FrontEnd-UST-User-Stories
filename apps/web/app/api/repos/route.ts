import { getUserIdFromRequest } from "@/lib/getAuthUser";
import { NextResponse } from "next/server";
import { getInstallationRepos } from "@/lib/github";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const repos = await getInstallationRepos();
  return NextResponse.json(repos);
}
