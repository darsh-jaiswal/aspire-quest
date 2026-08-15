/**
 * Mints short-lived client tokens for direct-to-Blob resume uploads.
 *
 * The bytes go browser → Blob and never pass through a function, so a
 * registration surge costs no function bandwidth. The trade-off is that this
 * route is the ONLY gate on what gets written, so the constraints here are
 * load-bearing:
 *
 *   - PDF only, enforced by the token itself, not by client-side `accept`
 *   - 5 MB ceiling, enforced by the token
 *   - `addRandomSuffix` so the stored key is never the user's filename
 *   - private access — no public URL exists for any resume
 *   - rate limited, because minting tokens is otherwise free to an attacker
 */

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { REGISTRATION } from "@/lib/content";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIp(request.headers);
  const limit = await checkRateLimit("upload", ip);

  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          limit.reason === "rate_limited"
            ? "Too many upload attempts. Try again in a few minutes."
            : "Uploads are temporarily unavailable. Please try again shortly.",
      },
      { status: limit.reason === "rate_limited" ? 429 : 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...REGISTRATION.resumeAcceptedTypes],
        maximumSizeInBytes: REGISTRATION.resumeMaxBytes,
        // Never trust the submitted filename as a storage key.
        addRandomSuffix: true,
        allowOverwrite: false,
        // Token is single-use in practice; keep the window short.
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
      // Nothing to persist here: the blob key is attached to the student row
      // by the registration Server Action, which is the transaction that
      // actually matters.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[resume-upload] token generation failed:", error);
    return NextResponse.json(
      { error: "Could not start the upload. Please try again." },
      { status: 400 },
    );
  }
}
