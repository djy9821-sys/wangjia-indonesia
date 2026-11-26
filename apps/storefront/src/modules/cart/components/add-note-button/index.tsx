import { updateLineItem } from "@/lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Input, clx } from "@medusajs/ui"
import { useState, useRef, useEffect } from "react"

const AddNoteButton = ({
  item,
  disabled,
}: {
  item: HttpTypes.StoreCartLineItem
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState((item.metadata?.note as string) || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const setNoteMetadata = async (newNote: string) => {
    setIsOpen(false)
    await updateLineItem({
      lineId: item.id,
      data: { quantity: item.quantity, metadata: { note: newNote?.trim() } },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setNoteMetadata(note)
    }
  }

  const handleBlur = () => {
    setNoteMetadata(note)
    setIsOpen(false)
  }

  const deleteNote = () => {
    setNote("")
    setNoteMetadata("")
    setIsOpen(false)
  }

  return (
    <div
      className={clx(
        "relative flex items-center",
        isOpen ? "w-full" : "w-fit justify-center"
      )}
    >
      {!note && !isOpen && (
        <button
          className={clx(
            "flex h-11 w-fit min-w-20 items-center justify-center rounded-full px-4 text-[14px] text-neutral-950 shadow-[0_0_0_1px_rgba(0,0,0,0.14)] hover:bg-neutral-100 transition-opacity duration-300",
            isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
            disabled ? "opacity-50 pointer-events-none" : "opacity-100"
          )}
          onClick={() => setIsOpen(true)}
          disabled={disabled}
        >
          Tambah catatan
        </button>
      )}
      {note?.length > 0 && !isOpen && (
        <span className="flex min-h-[44px] items-center justify-center gap-x-1 text-[14px] text-neutral-600 line-clamp-none">
          <span className="text-neutral-950">Catatan:&nbsp;</span>
          <span
            className="text-neutral-600 italic cursor-pointer hover:text-neutral-950 hover:underline"
            onClick={() => setIsOpen(true)}
          >
            {note}
          </span>
          <button
            type="button"
            aria-label="Hapus catatan"
            className="-my-2 ml-1 grid h-11 w-11 place-items-center rounded-full text-[16px] text-neutral-600 hover:bg-neutral-100"
            onClick={deleteNote}
          >
            ×
          </button>
        </span>
      )}
      {/* the field exists only while it is open: hidden but laid out, it pushed a 320 px page
          sideways, and at 12 px iOS zoomed the page on focus */}
      {isOpen && (
        <div className="w-full min-w-0 max-w-64">
          <Input
            ref={inputRef}
            className="h-11 w-full rounded-full text-[16px] text-neutral-950"
            type="text"
            placeholder="Tulis catatan"
            aria-label="Catatan untuk barang ini"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
            onBlur={() => handleBlur()}
          />
        </div>
      )}
    </div>
  )
}

export default AddNoteButton
