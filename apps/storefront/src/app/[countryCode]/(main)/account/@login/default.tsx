import { listRegions } from "@/lib/data/regions"
import LoginTemplate from "@/modules/account/templates/login-template"

/*
  Parallel-route fallback: a signed-out visitor opening any account sub-page
  (/account/orders, /account/garansi, …) lands on the login form instead of
  a 404, and the dashboard renders once they are signed in.
*/
export default async function LoginDefault() {
  const regions = await listRegions()
  return <LoginTemplate regions={regions} />
}
