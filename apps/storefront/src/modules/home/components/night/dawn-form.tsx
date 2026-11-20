"use client"

import { FormEvent, useId, useState } from "react"
import { WhatsAppIcon } from "./icons"
import { whatsappLink } from "./whatsapp"

/* Pond size, depth, species and power supply turned into a WhatsApp message to the sales team. */

const JENIS = ["Udang", "Ikan", "Lainnya"]
const LISTRIK = ["1 phase", "3 phase", "Belum tahu"]

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="field">
      <span className="mono legend" id={id}>
        {label}
      </span>
      <div className="chips" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <button type="button" key={o} aria-pressed={o === value} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DawnForm() {
  const [luas, setLuas] = useState("")
  const [dalam, setDalam] = useState("")
  const [jenis, setJenis] = useState(JENIS[0])
  const [listrik, setListrik] = useState(LISTRIK[2])
  const [sent, setSent] = useState("")

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const message = `Halo WANGJIA, saya mau tanya kincir. Luas kolam ${luas || "…"} m², kedalaman ${dalam || "…"} m, ${jenis.toLowerCase()}, listrik ${listrik.toLowerCase()}.`
    setSent(message)
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer")
  }

  return (
    <form className="ask" onSubmit={onSubmit}>
      <div className="field">
        <label className="mono" htmlFor="night-luas">
          Luas kolam (m²)
        </label>
        <input id="night-luas" inputMode="decimal" placeholder="mis. 2.500" value={luas} onChange={(e) => setLuas(e.target.value)} />
      </div>
      <div className="field">
        <label className="mono" htmlFor="night-dalam">
          Kedalaman (m)
        </label>
        <input id="night-dalam" inputMode="decimal" placeholder="mis. 1,2" value={dalam} onChange={(e) => setDalam(e.target.value)} />
      </div>
      <Chips label="Jenis" options={JENIS} value={jenis} onChange={setJenis} />
      <Chips label="Listrik" options={LISTRIK} value={listrik} onChange={setListrik} />
      <button className="btn btn-primary" type="submit">
        <WhatsAppIcon />
        Kirim lewat WhatsApp
      </button>
      <p className="ask-out" aria-live="polite">
        {sent && `Pesan yang dikirim: “${sent}”`}
      </p>
    </form>
  )
}
