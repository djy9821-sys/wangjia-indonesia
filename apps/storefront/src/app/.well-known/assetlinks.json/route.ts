import { NextResponse } from "next/server"

/*
  Android App Links verification. NEXT_PUBLIC_ANDROID_SHA256 holds the
  release signing certificate fingerprints, comma separated
  (keytool -list -v -keystore upload.jks | grep SHA256).
*/
export const dynamic = "force-static"

export function GET() {
  const fingerprints = (process.env.NEXT_PUBLIC_ANDROID_SHA256 || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "id.co.wangjia.wangjia_app",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } })
}
