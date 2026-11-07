import { NextResponse } from "next/server"

/*
  iOS Universal Links: lets https://<store>/id/garansi/<code> open the WANGJIA
  app when installed. Set NEXT_PUBLIC_IOS_TEAM_ID (Apple Developer team id).
  Served with application/json and no extension, as Apple requires.
*/
export const dynamic = "force-static"

export function GET() {
  const teamId = process.env.NEXT_PUBLIC_IOS_TEAM_ID || "TEAMID"
  const appId = `${teamId}.id.co.wangjia.wangjiaApp`
  const body = {
    applinks: {
      apps: [],
      details: [{ appIDs: [appId], components: [{ "/": "/*/garansi/*", comment: "warranty QR labels" }] }],
    },
    webcredentials: { apps: [appId] },
  }
  return NextResponse.json(body, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" } })
}
