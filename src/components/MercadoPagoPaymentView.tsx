import React, { useState } from 'react';
import { Order, MercadoPagoAlias } from '../types';
import { storageService } from '../services/storage';
import {
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  QrCode,
  ArrowRight,
} from 'lucide-react';

interface MercadoPagoPaymentViewProps {
  order: Order;
  onGoToTracking: () => void;
  onClose: () => void;
}

export const MercadoPagoPaymentView: React.FC<MercadoPagoPaymentViewProps> = ({
  order,
  onGoToTracking,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [referenceInput, setReferenceInput] = useState('');
  const [referenceSubmitted, setReferenceSubmitted] = useState(Boolean(order.paymentReference));

  const alias: MercadoPagoAlias = order.assignedAlias || {
    id: 'alias-default',
    alias: 'sabor.casero.central',
    holder: 'Juan Carlos Pérez',
    cuitOrDni: '20-33491204-7',
    cvu: '0000003100084729184021',
    bankOrMp: 'Mercado Pago',
    isActive: true,
    totalCollected: 0,
    ordersCount: 0,
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleSubmitReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) return;
    storageService.recordPaymentProof(order.id, referenceInput.trim());
    setReferenceSubmitted(true);
  };

  const isConfirmed = order.status !== 'pendiente_pago';

  // Construct WhatsApp text
  const whatsappMsg = encodeURIComponent(
    `Hola Punto Morfi! Ya realicé la transferencia para mi orden ${order.orderNumber} por $${order.total.toLocaleString('es-AR')} al Alias: ${alias.alias} (${alias.holder}). Adjunto mi comprobante!`
  );
  const whatsappUrl = `https://wa.me/5491144556677?text=${whatsappMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header Mercado Pago styling */}
        <div className="bg-[#009ee3] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-inner">
              MP
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight flex items-center gap-2">
                <span>Mercado Pago Transferencia</span>
                <span className="text-[10px] bg-white text-[#009ee3] font-black px-2 py-0.5 rounded-full uppercase">
                  Oficial
                </span>
              </h3>
              <p className="text-xs text-sky-100 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alias rotativo asignado a tu orden {order.orderNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-200">
          {/* Status banner */}
          {isConfirmed ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-stone-950 font-black flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-emerald-200 text-sm">¡Pago Verificado con Éxito!</h4>
                <p>Tu orden ya fue recibida por la cocina y comenzó su preparación.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-center gap-3">
              <Clock className="w-5 h-5 text-sky-400 shrink-0 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold">Total a transferir:</span>{' '}
                <strong className="text-lg text-white font-heading">${order.total.toLocaleString('es-AR')}</strong>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Transferí el monto exacto usando el Alias a continuación para acreditar en el acto.
                </p>
              </div>
            </div>
          )}

          {/* Randomly Assigned Alias Box (Highlight of user requirement) */}
          <div className="bg-stone-950 rounded-2xl border border-sky-500/40 p-5 space-y-4 shadow-lg shadow-sky-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Alias Asignado al Azar
                </span>
              </div>
              <span className="text-[11px] bg-stone-800 text-amber-400 font-semibold px-2 py-0.5 rounded-md">
                Rotación 1 de 4
              </span>
            </div>

            {/* Giant Alias Display with copy button */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Alias para Transferir:</span>
                <span className="text-base sm:text-lg font-black text-amber-400 tracking-wider truncate block font-mono select-all">
                  {alias.alias}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(alias.alias, 'alias')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  copiedField === 'alias'
                    ? 'bg-emerald-500 text-stone-950 font-black'
                    : 'bg-sky-500 hover:bg-sky-400 text-stone-950 font-black'
                }`}
              >
                {copiedField === 'alias' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Details list */}
            <div className="space-y-2 text-xs pt-1 border-t border-stone-800/80">
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400">Titular de la cuenta:</span>
                <span className="font-bold text-stone-100">{alias.holder}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400">CUIT / DNI:</span>
                <span className="font-mono text-stone-200">{alias.cuitOrDni}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400">Entidad:</span>
                <span className="font-bold text-[#009ee3]">{alias.bankOrMp}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400">CVU:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-stone-300 truncate max-w-[150px] sm:max-w-[200px]">
                    {alias.cvu}
                  </span>
                  <button
                    onClick={() => handleCopy(alias.cvu, 'cvu')}
                    className="text-stone-400 hover:text-amber-400"
                    title="Copiar CVU"
                  >
                    {copiedField === 'cvu' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Pay Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://www.mercadopago.com.ar"
              target="_blank"
              rel="noreferrer"
              className="bg-[#009ee3]/20 hover:bg-[#009ee3]/30 border border-[#009ee3]/50 text-sky-200 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-[#009ee3]" />
              <span>Abrir Mercado Pago</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Avisar por WhatsApp</span>
            </a>
          </div>

          {/* Proof reference form */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
            <h4 className="text-xs font-bold text-stone-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>¿Ya transferiste? Ingresá tu comprobante para acelerar</span>
            </h4>
            {referenceSubmitted ? (
              <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl text-xs text-stone-300 flex items-center justify-between">
                <div>
                  <span className="text-stone-400 block text-[10px]">Comprobante informado:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {order.paymentReference || referenceInput}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  Enviado a cocina
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReference} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nº de operación o comprobante MP..."
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700/80 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  disabled={!referenceInput.trim()}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-stone-950 font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0"
                >
                  Informar Pago
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#14201f] border-t border-[#2d4240] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-[#8daaa8] hover:text-white text-xs font-semibold py-2 px-3"
          >
            Volver al Menú
          </button>
          <button
            onClick={onGoToTracking}
            className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-3 px-5 rounded-xl shadow-lg shadow-[#f88d63]/25 flex items-center gap-2 text-xs uppercase tracking-wider transition-all font-['Fredoka']"
          >
            <span>Ver Seguimiento en Vivo</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
