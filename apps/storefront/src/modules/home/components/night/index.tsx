import { archivo } from "@/lib/fonts/archivo"
import { whatsappLink } from "@/lib/util/whatsapp"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import GroupBuyStrip from "@/modules/home/components/group-buy-strip"
import { GeistMono } from "geist/font/mono"
import Image from "next/image"
import { CSSProperties, Suspense } from "react"
import { getNightHomeData, type PartKey, type Price } from "./data"
import DawnForm from "./dawn-form"
import { ArrowIcon, PauseIcon, PlayIcon, WhatsAppIcon } from "./icons"
import NightStage from "./stage"
import "./night.css"

/*
  Home page "Satu malam di tambak" (mock-up A2): one fixed 3D scene of a night pond
  behind the page, chapters that scroll over it. The markup is server-rendered and
  readable without JavaScript; NightStage adds the scene and the scroll choreography.
*/

const vars = (v: Record<string, string | number>) => v as CSSProperties
const HERO_HANDLE = "kincir-air-wangjia-2-hp"

const PARTS: { key: PartKey; label: string; title: string; text: string; short: string }[] = [
  { key: "motor", label: "01 · Motor", title: "1,5 kW · 1.400 rpm", text: "Kumparan tembaga murni. Garansi 1 tahun.", short: "Motor 1,5 kW" },
  { key: "gearbox", label: "02 · Gearbox", title: "Bevel gear 1:14", text: "Mechanical seal, bukan worm gear. Hemat listrik sampai 25 %.", short: "Gearbox bevel 1:14" },
  { key: "shaft", label: "03 · Poros & rangka", title: "Stainless SS304", text: "Full solid, bukan besi sepuh.", short: "Poros SS304" },
  { key: "impeller", label: "04 · Kipas", title: "4 × PP Ø 67 cm", text: "8 daun kaki bebek, tahan UV.", short: "Kipas PP Ø 67 cm" },
  { key: "float", label: "05 · Pelampung", title: "3 × HDPE 175 cm", text: "175 × 32 × 20 cm, tahan UV.", short: "Pelampung HDPE" },
]

const PROOF = [
  { label: "Garansi", big: <><em>1</em> tahun</>, text: "Garansi motor. Scan QR di mesin untuk cek keaslian dan mengaktifkan garansi.", href: "/garansi" },
  { label: "Suku cadang", big: <><em>11</em> jenis</>, text: "Kipas, gearbox, motor, pelampung, poros, pillow block, kopel, mechanical seal, rangka; dijual satuan.", href: "/categories/suku-cadang" },
  { label: "Pengiriman", big: <>Seluruh <em>RI</em></>, text: "Dikirim ke alamat tambak Anda. Ongkos kirim terlihat sebelum bayar.", href: "/shipping" },
  { label: "Pembayaran", big: <>Ber<em>tahap</em></>, text: "Bayar bertahap, atau patungan bersama tetangga tambak.", href: "/patungan" },
]

const SPEC_ROWS: { label: string; cells: string[] }[] = [
  { label: "Motor", cells: ["1,5 kW · 1.400 rpm", "0,75 kW · 1.400 rpm", "0,55 kW", "1,5 kW · 2.800 rpm"] },
  { label: "Listrik", cells: ["1 phase atau 3 phase", "1 phase atau 3 phase", "1 phase atau 3 phase", "3 phase"] },
  { label: "Penggerak", cells: ["Gearbox bevel gear 1:14", "Gearbox bevel gear 1:14", "Langsung, tanpa gearbox", "Gearbox bevel gear"] },
  { label: "Kipas", cells: ["4", "2", "2", "—"] },
  { label: "Garansi", cells: ["Motor 1 tahun", "Motor 1 tahun", "Motor 1 tahun", "Motor 1 tahun"] },
]

const PriceText = ({ price, fallback = "Tanya harga" }: { price: Price | null; fallback?: string }) => <>{price?.from ?? fallback}</>

export default async function NightHome({ countryCode }: { countryCode: string }) {
  const { machines, parts } = await getNightHomeData(countryCode)
  const hero = machines.find((m) => m.handle === HERO_HANDLE) ?? machines[0]
  const heroFrom = hero.price?.varies ? " · mulai" : ""
  const askHero = whatsappLink("Halo WANGJIA, saya mau tanya tentang Kincir Air 2 HP.")

  return (
    <div data-wj-night className={`wj-night ${archivo.variable} ${GeistMono.variable}`}>
      <NightStage family={archivo.style.fontFamily} />

      {/* 1 · What it is, the idea, the price */}
      <section className="hero" data-scene aria-labelledby="hero-title">
        <div className="wrap hero-top">
          <p className="mono label">
            Kincir air tambak <b translate="no">WANGJIA®</b>
          </p>
          <div className="top-r">
            <p className="mono clock" data-clock aria-live="off" />
            <button className="pause mono" type="button" data-pause aria-pressed="false" hidden>
              <PauseIcon />
              <PlayIcon />
              <span>Jeda</span>
            </button>
          </div>
        </div>
        <div className="wrap hero-foot">
          <div>
            <h1 id="hero-title">
              <span className="sr-only">Kincir air WANGJIA 2 HP. </span>
              <span className="line">Saat Anda tidur,</span>
              <span className="line dim">kolam tetap bernapas.</span>
            </h1>
            <ul className="proofline">
              <li>4 kipas</li>
              <li>Gearbox bevel gear 1:14</li>
              <li>Poros SS304</li>
              <li>Garansi motor 1 tahun</li>
            </ul>
          </div>
          <div className="buy">
            <div className="price-row">
              <span className="name">Kincir Air 2 HP{heroFrom}</span>
              <span className="price num">
                <PriceText price={hero.price} />
              </span>
              <span className="ppn">Belum termasuk PPN 11%</span>
            </div>
            <div className="ctas">
              <LocalizedClientLink href={`/products/${HERO_HANDLE}`} className="btn btn-primary">
                <span>Lihat Kincir 2 HP</span>
                <ArrowIcon />
              </LocalizedClientLink>
              <a className="btn btn-ghost" href={askHero} target="_blank" rel="noreferrer" aria-label="Tanya via WhatsApp">
                <WhatsAppIcon />
                Tanya via WhatsApp
              </a>
            </div>
            <p className="note">Bisa bayar bertahap · Kirim ke seluruh Indonesia</p>
          </div>
        </div>
        <span className="cue" aria-hidden="true" />
      </section>

      {/* 2 · Why it matters: the night shift, told by the clock */}
      <section className="night" id="malam" data-scene aria-labelledby="night-title">
        <div className="stick">
          <div className="wrap night-in">
            <div>
              <p className="mono label">
                18.00 – 06.00 <b>Shift malam</b>
              </p>
              <h2 className="h2 rv" id="night-title">
                <span className="ln"><span>Malam adalah</span></span>
                <span className="ln"><span>kerja terberat.</span></span>
              </h2>
            </div>
            <p className="clockbig" aria-hidden="true">
              <b data-nclock>18.00</b>
              <span className="mono">WIB</span>
            </p>
            <div className="steps">
              <p className="on">
                Siang hari, plankton di kolam membuat oksigen. <strong>Malam hari mereka berhenti</strong>, sementara udang dan ikan terus bernapas.
              </p>
              <p>
                <strong>Oksigen terlarut turun pelan-pelan</strong> sepanjang malam, sampai menjelang subuh.
              </p>
              <p>
                Kipas kincir memercikkan air ke udara dan mengalirkan air kolam, <strong>jadi oksigen dari udara terus masuk</strong> ke air sepanjang malam.
              </p>
            </div>
          </div>
          <figure className="chartmini">
            <svg viewBox="0 0 600 250" role="img" aria-labelledby="chart-t">
              <title id="chart-t">Gambaran oksigen terlarut di kolam dari jam 18.00 sampai 06.00: turun sepanjang malam, paling rendah menjelang subuh. Tanpa skala.</title>
              <text x="0" y="16">Oksigen terlarut</text>
              <line className="gl" x1="0" y1="60" x2="600" y2="60" />
              <line className="gl" x1="0" y1="130" x2="600" y2="130" />
              <line className="axis" x1="0" y1="200" x2="600" y2="200" />
              <path className="curve" data-curve pathLength={1} d="M0 50 C 120 60, 250 110, 380 158 C 450 182, 500 190, 560 186" />
              <circle className="now" data-now r="6" cx="0" cy="50" />
              <g className="low" data-low>
                <circle cx="560" cy="186" r="13" fill="none" stroke="#ffb547" strokeOpacity=".45" />
                <text x="540" y="168" textAnchor="end">Paling rendah: menjelang subuh</text>
              </g>
              <g>
                <text x="0" y="232">18.00</text>
                <text x="200" y="232" textAnchor="middle">22.00</text>
                <text x="400" y="232" textAnchor="middle">02.00</text>
                <text x="600" y="232" textAnchor="end">06.00</text>
              </g>
            </svg>
            <figcaption className="foot mono">
              <span>Gambaran umum</span>
              <span>Tanpa skala</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3 · How it works: the same machine, opened up */}
      <section className="anatomy" id="anatomi" data-scene aria-labelledby="ana-title">
        <div className="stick">
          <div className="wrap ana-head">
            <p className="mono label">
              Anatomi <b>Kincir 2 HP</b>
            </p>
            <h2 className="h2 rv" id="ana-title">
              <span className="ln"><span>Setiap malam,</span></span>
              <span className="ln"><span>setiap bagian.</span></span>
            </h2>
          </div>
          <svg className="leaders" data-leaders aria-hidden="true">
            {PARTS.map((p) => (
              <g key={p.key}>
                <polyline />
                <circle r="4" />
              </g>
            ))}
          </svg>
          {PARTS.map((p) => (
            <div className="callout" data-anchor={p.key} key={p.key}>
              <p className="mono n">{p.label}</p>
              <h3 className="h3">{p.title}</h3>
              <p>{p.text}</p>
              {parts[p.key] && (
                <p className="pp mono">
                  Suku cadang mulai <b>{parts[p.key]?.from}</b>
                </p>
              )}
            </div>
          ))}
          {PARTS.map((p, i) => (
            <span className="dot" data-anchor={p.key} key={p.key} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
          <ol className="ana-list">
            {PARTS.map((p, i) => (
              <li key={p.key}>
                <span className="mono n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b>{p.short}</b>
                </span>
                <span className="pr num">{parts[p.key]?.from ?? ""}</span>
              </li>
            ))}
            <li className="cap mono">
              <span />
              <span>Harga suku cadang, mulai dari</span>
              <span />
            </li>
          </ol>
          <p className="ana-foot">
            Satu bagian rusak? Ganti satu bagian, bukan satu mesin.{" "}
            <LocalizedClientLink href="/categories/suku-cadang">
              11 suku cadang dijual satuan <ArrowIcon />
            </LocalizedClientLink>
          </p>
        </div>
      </section>

      {/* 4 · The range with prices from the shop */}
      <section className="chapter range" id="model" aria-labelledby="range-title">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="mono label">
                Model &amp; harga <b>4 mesin</b>
              </p>
              <h2 className="h2 rv" id="range-title">
                <span className="ln"><span>Pilih sesuai kolam.</span></span>
              </h2>
            </div>
            <p className="lead fade">
              Harga toko, belum termasuk PPN 11%. Ongkos kirim dihitung saat checkout.{" "}
              <LocalizedClientLink href="/store" className="lead-link">
                Lihat semua produk
              </LocalizedClientLink>
            </p>
          </div>
          <div className="cards">
            {machines.map((m, i) => (
              <article className="card fade" style={vars({ "--i": i === 0 || i === 3 ? 1 : 0 })} key={m.handle}>
                <div className="pic">
                  <Image src={m.image.src} width={m.image.width} height={m.image.height} alt={m.image.alt} sizes="(max-width: 639px) 45vw, (max-width: 1099px) 45vw, 22vw" />
                </div>
                <div className="info">
                  <p className="mono tag">{m.tag}</p>
                  <h3 className="name">{m.name}</h3>
                  <p className="kv">
                    {m.specs[0]}
                    <br />
                    {m.specs[1]}
                  </p>
                  <div className="bottom">
                    <span className="p num">
                      {m.price?.varies && <small>mulai</small>}
                      <PriceText price={m.price} />
                      <small className="ppn">belum termasuk PPN</small>
                    </span>
                    <span className="go">
                      <ArrowIcon />
                    </span>
                  </div>
                </div>
                <LocalizedClientLink className="cover" href={`/products/${m.handle}`} aria-label={`${m.name}, ${m.price?.varies ? "mulai " : ""}${m.price?.from ?? ""}`} />
              </article>
            ))}
          </div>
          <details className="compare">
            <summary>
              Bandingkan spesifikasi <span className="plus" aria-hidden="true">+</span>
            </summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    {machines.map((m) => (
                      <td key={m.handle}>
                        <b>{m.name}</b>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SPEC_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {row.cells.map((c, i) => (
                        <td key={i}>{c}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="price-tr">
                    <th scope="row">Harga (belum PPN 11%)</th>
                    {machines.map((m) => (
                      <td key={m.handle}>
                        {m.price
                          ? m.price.variants.map((v) => (
                              <span className="vp" key={v.title}>
                                {v.title}: {v.price}
                              </span>
                            ))
                          : "Tanya harga"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
          <Suspense fallback={null}>
            <div className="gb-band">
              <GroupBuyStrip countryCode={countryCode} />
            </div>
          </Suspense>
        </div>
      </section>

      {/* 5 · Proof and objections */}
      <section className="chapter proof" id="jaminan" aria-labelledby="proof-title">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="mono label">
                Jaminan <b>Setelah beli</b>
              </p>
              <h2 className="h2 rv" id="proof-title">
                <span className="ln"><span>Tenang sampai panen.</span></span>
              </h2>
            </div>
            <p className="lead fade">Yang biasa ditanyakan petambak sebelum membeli, dijawab di sini.</p>
          </div>
          <div className="proof-grid">
            {PROOF.map((p, i) => (
              <LocalizedClientLink href={p.href} className="fade" style={vars({ "--i": i })} key={p.label}>
                <p className="mono label">{p.label}</p>
                <p className="big">{p.big}</p>
                <p>{p.text}</p>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · Dawn: ask on WhatsApp with the pond size */}
      <section className="dawn" id="tanya" data-scene aria-labelledby="dawn-title">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="mono label">
                05.30 <b>Subuh</b>
              </p>
              <h2 className="h2 rv" id="dawn-title">
                <span className="ln"><span>Tidur tenang</span></span>
                <span className="ln"><span>malam ini.</span></span>
              </h2>
            </div>
            <p className="lead fade">Kirim ukuran kolam lewat WhatsApp. Tim WANGJIA bantu hitung berapa kincir yang cocok.</p>
          </div>
          <DawnForm />
          <p className="ask-note">Dibalas di jam kerja · tanpa biaya</p>
        </div>
      </section>

      {/* The buy action follows once the hero has scrolled away */}
      <div className="buybar" data-buybar inert>
        <div className="wrap bb-in">
          <Image className="bb-img" src={hero.image.src} width={hero.image.width} height={hero.image.height} alt="" sizes="52px" />
          <div className="t">
            <span>Kincir 2 HP{heroFrom}</span>
            <b className="num">
              <PriceText price={hero.price} />
            </b>
          </div>
          <div className="acts">
            <a className="btn btn-ghost wa" href={askHero} target="_blank" rel="noreferrer" aria-label="Tanya via WhatsApp">
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
            <LocalizedClientLink className="btn btn-primary" href={`/products/${HERO_HANDLE}`}>
              Lihat
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}
