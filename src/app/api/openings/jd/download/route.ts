/**
 * JD reads.
 *
 * Less sensitive than resumes (a JD is content the company wants circulated),
 * but the file still lives in the private store, so reads stream through this
 * handler after an ownership check. Today the only readers are recruiters of
 * the owning company; when the student side ships, students viewing a LIVE
 * opening join the permitted set here — one gate to widen, in one place.
 *
 * Failure mode is 404 rather than 403, consistent with the portal.
 */

import { get } from "@vercel/blob";
import { getOpeningForCompanies } from "@/db/queries/openings";
import { requireRecruiter } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const actor = await requireRecruiter();

  const url = new URL(request.url);
  const rawId = url.searchParams.get("openingId");
  const openingId = Number(rawId);

  if (!rawId || !Number.isInteger(openingId) || openingId <= 0) {
    return new Response("Bad request", { status: 400 });
  }

  // Carries the company filter into the query — another company's opening is
  // indistinguishable from one that does not exist.
  const opening = await getOpeningForCompanies(openingId, actor.companyIds);
  if (!opening?.jdBlobKey) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const result = await get(opening.jdBlobKey, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result) return new Response("Not found", { status: 404 });

    const isPdf = opening.jdContentType === "application/pdf";
    // Filename rebuilt from our own data — never echoed from the upload path.
    const filename = `opening-${opening.id}-jd.${isPdf ? "pdf" : "docx"}`;

    return new Response(result.stream, {
      headers: {
        "Content-Type": opening.jdContentType ?? "application/octet-stream",
        "Content-Disposition": `${isPdf ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[jd-download] blob read failed:", error);
    return new Response("Not found", { status: 404 });
  }
}
