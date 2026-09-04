"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { addPaymentCard } from "@/app/actions/payment-methods";
import {
  NewCardForm,
  type NewCardFormRef,
} from "@/components/extra-credits/new-card-form";
import { tokenizePagarmeCard } from "@/lib/checkout/tokenize-card";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";

interface AddPaymentCardDialogProps {
  hasActiveCardSubscription: boolean;
  compact?: boolean;
}

export function AddPaymentCardDialog({
  hasActiveCardSubscription,
  compact = false,
}: AddPaymentCardDialogProps) {
  const router = useRouter();
  const newCardFormRef = useRef<NewCardFormRef>(null);
  const submissionLockRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  async function handleAddCard() {
    if (submissionLockRef.current) return;

    submissionLockRef.current = true;
    setIsAdding(true);

    try {
      const isValid = await newCardFormRef.current?.validate();

      if (!isValid) return;

      const values = newCardFormRef.current?.getValues();

      if (!values || values.paymentSource !== "new_card") return;

      const tokenizedCard = await tokenizePagarmeCard({
        cardNumber: values.cardNumber,
        holderName: values.holderName,
        holderDocument: values.holderDocument,
        expirationDate: values.expirationDate,
        cvv: values.cvv,
      });

      const result = await addPaymentCard({
        cardToken: tokenizedCard.id,
        billingAddress: values.address,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar o cartão."
      );
    } finally {
      submissionLockRef.current = false;
      setIsAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        className={
          compact
            ? "rounded-xl font-bold"
            : "h-11 rounded-xl px-5 font-bold"
        }
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 size-4" />
        {compact ? "Adicionar cartão" : "Adicionar novo cartão"}
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            Adicionar novo cartão
          </DialogTitle>

          <DialogDescription>
            {hasActiveCardSubscription
              ? "O novo cartão só será usado na renovação quando você o tornar padrão."
              : "O novo cartão será salvo como seu método de pagamento padrão."}
          </DialogDescription>
        </DialogHeader>

        {open ? <NewCardForm ref={newCardFormRef} /> : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isAdding} className="h-10 rounded-lg">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            onClick={handleAddCard}
            disabled={isAdding || isPending}
            className="h-10 rounded-lg"
            isLoading={isAdding || isPending}
          >
            Adicionar cartão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
