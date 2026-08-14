import { ImageResponse } from "next/og";

export const runtime = "edge";

const supportedSizes = new Set([192, 512]);

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: requestedSize } = await params;
  const size = Number(requestedSize);

  if (!supportedSizes.has(size)) {
    return new Response("Icon not found", { status: 404 });
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#176b4a",
        color: "#ffffff",
        fontSize: size * 0.48,
        fontWeight: 800,
        letterSpacing: "-0.08em",
        borderRadius: size * 0.22,
      }}
    >
      K
    </div>,
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
