"use client";
import { useRef } from "react";
import { Upload } from "lucide-react";

interface Props {
  operationNumber: string;
  amount: string;
  onOperationNumberChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onFileChange: (file: File | null) => void;
  file: File | null;
}

export function PaymentForm({ operationNumber, amount, onOperationNumberChange, onAmountChange, onFileChange, file }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Datos de la transferencia</h3>
      <div>
        <label className="block text-xs text-gray-500 mb-1">N&ordm; de operaci&oacute;n</label>
        <input value={operationNumber} onChange={(e) => onOperationNumberChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500" placeholder="Ej: 123456789" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Monto transferido (S/)</label>
        <input type="number" step="0.01" value={amount} onChange={(e) => onAmountChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Comprobante de pago</label>
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 transition-colors">
          {file ? (
            <div>
              <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
              <p className="text-sm text-gray-600">{file.name}</p>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Haz clic para subir el comprobante</p>
              <p className="text-xs text-gray-400 mt-1">JPG o PNG, m&aacute;ximo 5MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
      </div>
    </div>
  );
}
