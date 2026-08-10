import { toast } from "sonner";

export function confirmAction(
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; cancelLabel?: string },
) {
  toast(message, {
    duration: 6000,
    action: {
      label: options?.confirmLabel || "Eliminar",
      onClick: () => onConfirm(),
    },
    cancel: {
      label: options?.cancelLabel || "Cancelar",
      onClick: () => {},
    },
  });
}
