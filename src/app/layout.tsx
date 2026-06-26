import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "IP Pulse — IP Geolocation & Intelligence",
  description:
    "Look up geolocation, ISP/ASN info, threat status, and Whois data for any public IP address.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
