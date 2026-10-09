import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { loadActiveSessionUser } from "@/lib/auth-users";
import { canReadMediaKey } from "@/lib/jobs/access";
import { verifyPdfMediaSig } from "@/lib/pdf/media-url";
import { readStoredFile } from "@/lib/services/files";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  const exp = url.searchParams.get("exp") ?? "";
  const session = await auth();
  const signedPdfLink = Boolean(
    key && sig && exp && verifyPdfMediaSig(key, sig, exp),
  );
  if (!signedPdfLink) {
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const user = await loadActiveSessionUser(Number(session.user.id));
    if (!user || !(await canReadMediaKey(user, key))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }
  try {
    const { data, contentType } = await readStoredFile(key);
    const range = request.headers.get("range");
    let body = data;
    const headers = new Headers({
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
    });

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${data.byteLength}` },
        });
      }
      const suffixRange = !match[1];
      const start = suffixRange
        ? Math.max(0, data.byteLength - Number(match[2]))
        : Number(match[1]);
      const end = suffixRange
        ? data.byteLength - 1
        : match[2]
          ? Number(match[2])
          : data.byteLength - 1;
      if (start >= data.byteLength || end < start) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${data.byteLength}` },
        });
      }
      const last = Math.min(end, data.byteLength - 1);
      body = data.slice(start, last + 1);
      headers.set("Content-Range", `bytes ${start}-${last}/${data.byteLength}`);
      headers.set("Content-Length", String(body.byteLength));
      return new Response(new Uint8Array(body), { status: 206, headers });
    }

    headers.set("Content-Length", String(body.byteLength));
    return new Response(new Uint8Array(body), { headers });
  } catch {
    return NextResponse.json({ error: "Media file not found" }, { status: 404 });
  }
}
