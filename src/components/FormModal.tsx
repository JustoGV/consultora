'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  onClose: () => void;
  isDirty: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormModal — wrapper opcional (UX-2) que combina `Dialog`/`DialogContent`
 * (design system, `src/components/ui/dialog.tsx`) con `useFormKeyboard` ya
 * integrado: Enter = siguiente campo, Ctrl+Enter = submit, Esc = cerrar (con
 * confirmación si `isDirty`), autofocus del primer campo.
 *
 * No reemplaza los modales legacy hechos a mano (overlay `<div>` propio) — es
 * para consumo de F-5 en adelante, cuando las pantallas nuevas migren a Radix
 * Dialog.
 *
 * El `<form>` interno lo provee el consumidor como `children` (este wrapper no
 * asume su estructura); pasale el mismo `formRef` que uses acá al elemento
 * `<form>` para que el autofocus y `focusFirstError` encuentren los inputs.
 *
 * @example
 * ```tsx
 * function MyCreateModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
 *   const formRef = useRef<HTMLFormElement>(null);
 *   const [formData, setFormData] = useState(initialFormData);
 *   const isDirty = useMemo(() => !isEqual(formData, initialFormData), [formData]);
 *
 *   const handleSubmit = async () => {
 *     await service.create(formData);
 *     onOpenChange(false);
 *   };
 *
 *   return (
 *     <FormModal
 *       open={open}
 *       onOpenChange={onOpenChange}
 *       title="Nueva persona"
 *       onSubmit={handleSubmit}
 *       onClose={() => onOpenChange(false)}
 *       isDirty={isDirty}
 *     >
 *       <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
 *         <input name="nombre" value={formData.nombre} onChange={...} />
 *         <button type="submit">Guardar</button>
 *       </form>
 *     </FormModal>
 *   );
 * }
 * ```
 */
export default function FormModal({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  onClose,
  isDirty,
  children,
  className,
}: FormModalProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const { onKeyDown, handleEscape } = useFormKeyboard({
    formRef,
    onSubmit,
    onClose,
    isDirty,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={className}
        onEscapeKeyDown={(e) => {
          // Radix intercepta Esc antes de que burbujee al onKeyDown de abajo —
          // reusamos el mismo criterio (confirmación si isDirty) acá.
          e.preventDefault();
          handleEscape();
        }}
      >
        <div ref={formRef} onKeyDown={onKeyDown}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
