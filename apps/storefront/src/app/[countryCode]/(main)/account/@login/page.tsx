import { listRegions } from "@/lib/data/regions"
import LoginTemplate from "@/modules/account/templates/login-template"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun WANGJIA Anda.",
}

export default async function Login() {
  const regions = await listRegions()

  return <LoginTemplate regions={regions} />
}
