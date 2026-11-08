"use client"

import Button from "@/modules/common/components/button"
import { B2BCustomer } from "@/types"
import { Container, Text, toast } from "@medusajs/ui"

const SecurityCard = ({ customer }: { customer: B2BCustomer }) => {
  return (
    <div className="h-fit">
      <Container className="p-0 overflow-hidden">
        <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 p-4">
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Kata sandi</Text>
            <Text className=" text-neutral-500">***************</Text>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
          <Button
            variant="secondary"
            onClick={() => toast.info("Ubah kata sandi lewat tautan Lupa kata sandi di halaman masuk.")}
          >
            Ubah
          </Button>
        </div>
      </Container>
    </div>
  )
}

export default SecurityCard
