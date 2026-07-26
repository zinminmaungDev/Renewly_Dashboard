"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteCustomer } from "@/server/actions/customers";
import type { CustomerRecord } from "@/lib/types";

export function DeleteCustomerDialog({
  customer,
  onOpenChange,
}: {
  customer: CustomerRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = React.useTransition();

  function confirm(event: React.MouseEvent) {
    event.preventDefault();
    if (!customer) return;

    startTransition(async () => {
      const result = await deleteCustomer(customer.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Customer deleted");
      onOpenChange(false);
    });
  }

  return (
    <AlertDialog open={Boolean(customer)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {customer?.full_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the customer, their stored credentials and their full
            order history. It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep customer</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={pending}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
