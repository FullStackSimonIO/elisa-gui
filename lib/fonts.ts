import { Geist, Geist_Mono, Rubik as RubikFont } from "next/font/google"

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const rubik = RubikFont({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
})
