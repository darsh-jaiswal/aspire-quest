import { get } from "@vercel/blob";
import { companiesWithAccessToStudent } from "@/db/queries/bundles";
import { getStudent } from "@/db/queries/students";
import { canReadStudentResume } from "@/lib/access-policy";
import { recordAudit } from "@/lib/audit";
import { requireActor } from "@/lib/auth";

/**
 * Resume reads.
 *
 * This is the single most sensitive route in the application, so the rules are
 * strict and stated:
 *
 *   1. The raw blob URL is NEVER returned to the client. The bytes are streamed
 *      through this handler after an authorization check.
 *   2. An admin may read any resume. A recruiter may read a resume ONLY if the
 *      student sits in a RELEASED bundle belonging to a company that recruiter
 *      is a member of — checked against the database, never against anything
 *      the client sent.
 *   3. Every successful read writes an audit row before the bytes go out.
 *
 * Failure mode is 404 rather than 403 for recruiters: telling an unauthorised
 * caller that a given student id exists is itself a disclosure.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const actor = await requireActor();

  const url = new URL(request.url);
  const rawId = url.searchParams.get("studentId");
  const studentId = Number(rawId);

  if (!rawId || !Number.isInteger(studentId) || studentId <= 0) {
    return new Response("Bad request", { status: 400 });
  }

  const student = await getStudent(studentId);
  if (!student?.resumeBlobKey) {
    return new Response("Not found", { status: 404 });
  }

  // Decided by the tested policy in @/lib/access-policy, not inline here.
  const permitted = await companiesWithAccessToStudent(studentId);
  if (!canReadStudentResume(actor, permitted)) {
    return new Response("Not found", { status: 404 });
  }

  await recordAudit({
    actor,
    action: "view_resume",
    studentId,
    detail: `Resume read · ${student.refCode}`,
  });

  try {
    const result = await get(student.resumeBlobKey, { access: "private" });
    if (!result) return new Response("Not found", { status: 404 });

    // Filename is rebuilt from our own data — never echoed from the upload.
    const filename = `${student.refCode}-resume.pdf`;

    return new Response(result.stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[resume-download] blob read failed:", error);
    return new Response("Could not read that file", { status: 502 });
  }
}
