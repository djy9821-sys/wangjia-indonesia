"use client"

import { updateCustomer } from "@/lib/data/customer"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import { B2BCustomer } from "@/types/global"
import { HttpTypes } from "@medusajs/types"
import { Container, Text, clx, toast } from "@medusajs/ui"
import { useState } from "react"

const ProfileCard = ({ customer }: { customer: B2BCustomer }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { first_name, last_name, phone } = customer

  const [customerData, setCustomerData] = useState({
    first_name,
    last_name,
    phone,
  } as HttpTypes.StoreUpdateCustomer)

  const handleSave = async () => {
    setIsSaving(true)
    await updateCustomer(customerData).catch(() => {
      toast.error("Gagal menyimpan")
    })
    setIsSaving(false)
    setIsEditing(false)

    toast.success("Profil tersimpan")
  }

  return (
    <div className="h-fit">
      <Container className="p-0 overflow-hidden">
        <form
          className={clx(
            "grid grid-cols-2 gap-4 border-b border-neutral-200 overflow-hidden transition-all duration-300 ease-in-out",
            {
              "max-h-[244px] opacity-100 p-4": isEditing,
              "max-h-0 opacity-0": !isEditing,
            }
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSave()
            }
          }}
        >
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Nama depan</Text>
            <Input
              label="Nama depan"
              name="first_name"
              value={customerData.first_name ?? ""}
              onChange={(e) =>
                setCustomerData({
                  ...customerData,
                  first_name: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Nama belakang</Text>
            <Input
              label="Nama belakang"
              name="last_name"
              value={customerData.last_name ?? ""}
              onChange={(e) =>
                setCustomerData({
                  ...customerData,
                  last_name: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Email</Text>
            <Text className=" text-neutral-500">{customer.email}</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Nomor HP</Text>
            <Input
              label="Nomor HP"
              name="phone"
              value={customerData.phone ?? ""}
              onChange={(e) =>
                setCustomerData({ ...customerData, phone: e.target.value })
              }
            />
          </div>
        </form>
        <div
          className={clx(
            "grid grid-cols-2 gap-4 border-b border-neutral-200 transition-all duration-300 ease-in-out",
            {
              "opacity-0 max-h-0": isEditing,
              "opacity-100 max-h-[214px] p-4": !isEditing,
            }
          )}
        >
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Nama depan</Text>
            <Text className=" text-neutral-500">{customer.first_name}</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Nama belakang</Text>
            <Text className=" text-neutral-500">{customer.last_name}</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Email</Text>
            <Text className=" text-neutral-500">{customer.email}</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Nomor HP</Text>
            <Text className=" text-neutral-500">{customer.phone}</Text>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
              >
                Simpan
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Ubah
            </Button>
          )}
        </div>
      </Container>
    </div>
  )
}

export default ProfileCard
