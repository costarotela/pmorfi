import React from 'react';
import { Order } from '../../types';
import { X, Printer, Download } from 'lucide-react';
import { generateKitchenTicketPDF } from '../../services/pdfTicket';

interface PrintTicketModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateKitchenTicketPDF(order, 'cocina');
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Comanda Térmica (80mm)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Ticket Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-950 flex justify-center">
          <div className="bg-white text-black font-mono text-xs p-6 rounded-lg shadow-xl w-full max-w-[340px] border border-stone-300">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
              <h2 className="text-lg font-black tracking-wider">PUNTO MORFI</h2>
              <p className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">Casa de Comidas</p>
              <p className="text-[9px] text-gray-500">CUIT: 30-71649281-9 • IVA Responsable Inscripto</p>
              <p className="text-[10px] font-bold text-gray-800 mt-1">COMANDA DE COCINA Y REPARTO</p>
            </div>

            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="font-bold">ORDEN:</span>
                <span className="font-extrabold text-sm">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>TIPO:</span>
                <span className="font-bold">{order.deliveryMethod === 'delivery' ? 'DELIVERY' : 'RETIRO EN LOCAL'}</span>
              </div>
            </div>

            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="font-bold">CLIENTE:</div>
              <div>{order.customerName}</div>
              <div>TEL: {order.customerPhone}</div>
              {order.deliveryAddress && (
                <div className="mt-1 font-bold bg-gray-100 p-1 rounded">
                  DIR: {order.deliveryAddress}
                  {order.deliveryFloorApt && ` (${order.deliveryFloorApt})`}
                </div>
              )}
              {order.deliveryNotes && (
                <div className="text-[10px] italic text-gray-700">
                  OBS: {order.deliveryNotes}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-gray-400 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>CANT / DESCRIPCION</span>
                <span>SUBTOTAL</span>
              </div>
              {order.items.map((it) => (
                <div key={it.id} className="text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span>{it.quantity}x {it.menuItem.name}</span>
                    <span>${it.itemTotalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  {it.selectedOptions && it.selectedOptions.length > 0 && (
                    <div className="text-[10px] text-gray-600 pl-3">
                      - {it.selectedOptions.map((o) => o.selectedOption.name).join(', ')}
                    </div>
                  )}
                  {it.specialInstructions && (
                    <div className="text-[10px] font-bold text-red-600 pl-3">
                      * NOTA: {it.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* General Customer Notes & Observations */}
            {order.deliveryNotes && (
              <div className="py-2.5 px-2 bg-amber-100 border border-amber-600 rounded my-2 text-[10px] space-y-0.5">
                <div className="font-extrabold text-black">*** ACLARACIÓN / OBSERVACIÓN DEL CLIENTE ***</div>
                <div className="font-bold text-gray-900">&quot;{order.deliveryNotes}&quot;</div>
              </div>
            )}

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toLocaleString('es-AR')}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Costo Envío:</span>
                  <span>${order.deliveryFee.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-1">
                <span>TOTAL A PAGAR:</span>
                <span>${order.total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Payment & Alias Info */}
            <div className="pt-3 text-[10px] space-y-1">
              <div className="font-bold flex justify-between">
                <span>MEDIO DE PAGO:</span>
                <span>{order.paymentMethod === 'mercadopago_alias' ? 'MERCADO PAGO' : order.paymentMethod.toUpperCase()}</span>
              </div>
              {order.assignedAlias && (
                <div className="bg-gray-100 p-1.5 rounded space-y-0.5">
                  <div className="font-bold">ALIAS ASIGNADO: {order.assignedAlias.alias}</div>
                  <div>TITULAR: {order.assignedAlias.holder}</div>
                  {order.paymentReference && (
                    <div className="text-green-800 font-bold">REF / COMPROBANTE: {order.paymentReference}</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 text-center text-[10px] text-gray-700 font-bold border-t border-gray-300">
              ¡Gracias por elegir Punto Morfi!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
          >
            Cerrar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] border border-[#364e4c] font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow font-['Fredoka']"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#f88d63] hover:bg-[#fa9d79] text-[#1b2827] font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg font-['Fredoka']"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
