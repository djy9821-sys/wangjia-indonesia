import localFont from "next/font/local"

/*
  Archivo, the shop's display face (home page, prices and headings on product pages) (SIL Open Font License, from
  @fontsource-variable/archivo). Width axis 62–125 % and weight 100–900 in one
  file: the giant word uses 62 % at 850, headings 70–85 %.
*/
export const archivo = localFont({
  src: "../../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
})
