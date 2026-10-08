import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  ShieldCheck,
  ChefHat,
  Receipt,
  Tablet,
  Share2,
  Sparkles,
} from 'lucide-react';

interface ShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Base URL from window or fallback to AI Studio deployed URL
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://ais-pre-2ykexi2hqpfwvnhtlgrvmq-171181647810.us-east1.run.app';

  const links = [
    {
      key: 'customer',
      badge: '🌐 WEB EXTERNA (CLIENTES)',
      badgeColor: 'bg-[#f88d63]/20 text-[#f88d63] border-[#f88d63]/40',
      title: 'Tienda Online para Clientes & Delivery',
      description:
        'El link público para mandar por WhatsApp, historias o poner en la bio de Instagram. Los clientes eligen su comida, pagan por Mercado Pago con alias rotativos y siguen su pedido en vivo.',
      url: `${baseUrl}`,
      icon: Globe,
      color: '#f88d63',
      recommended: true,
    },
    {
      key: 'admin',
      badge: '⚙️ WEB INTERNA (ADMINISTRACIÓN)',
      badgeColor: 'bg-[#e2e663]/20 text-[#e2e663] border-[#e2e663]/40',
      title: 'Panel General: Administración, Comandas & Reportes',
      description:
        'Para el dueño o encargado. Control en tiempo real de todos los pedidos, reportes visuales diarios y semanales de ventas, balance de alias de Mercado Pago y editor de precios e imágenes.',
      url: `${baseUrl}?view=admin`,
      icon: ShieldCheck,
      color: '#e2e663',
      recommended: true,
    },
    {
      key: 'kitchen',
      badge: '🍳 COMANDAS (COCINA KDS)',
      badgeColor: 'bg-[#759694]/20 text-[#759694] border-[#759694]/40',
      title: 'Pantalla de Cocina para Tablet o Celular',
      description:
        'Vista de comanda digital para el equipo de cocina. Muestra platos a cocinar con tiempo transcurrido, alertas de sonido y botón "Listo para Despachar".',
      url: `${baseUrl}?view=kitchen`,
      icon: ChefHat,
      color: '#759694',
    },
    {
      key: 'counter',
      badge: '💵 CAJA & ATENCIÓN AL CLIENTE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      title: 'Caja, Verificación de Pagos & Cadetes',
      description:
        'Para el mostrador. Cobro en efectivo/Mercado Pago, verificación de comprobantes y coordinación de entrega para retiro en local o despacho con cadetes.',
      url: `${baseUrl}?view=counter`,
      icon: Receipt,
      color: '#34d399',
    },
    {
      key: 'kiosk',
      badge: '📱 AUTOGESTIÓN EN EL LOCAL',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      title: 'Tótem de Autoservicio para Tablet en Mostrador',
      description:
        'Interfaz táctil simple pensada para que los clientes que están en el local pidan solos desde una tablet colocada en el mostrador.',
      url: `${baseUrl}?view=kiosk`,
      icon: Tablet,
      color: '#38bdf8',
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f88d63]/20 text-[#f88d63] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white font-['Fredoka']">
                  Enlaces para Compartir de Punto Morfi
                </h3>
                <span className="text-[10px] bg-[#e2e663] text-[#1b2827] px-2 py-0.5 rounded-full font-black">
                  LISTOS
                </span>
              </div>
              <p className="text-xs text-[#8daaa8] mt-0.5">
                Copiá y pasale los links a tu amigo para que pruebe la app externa e interna.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8daaa8] hover:text-white hover:bg-[#243635] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Links List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isCopied = copiedKey === link.key;

            return (
              <div
                key={link.key}
                className={`p-4 rounded-2xl border transition-all ${
                  link.recommended
                    ? 'bg-[#152221] border-[#374e4c] shadow-md'
                    : 'bg-[#182625] border-[#293d3b]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${link.badgeColor}`}
                      >
                        {link.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: link.color }} />
                      <h4 className="text-sm font-black text-white font-['Fredoka']">
                        {link.title}
                      </h4>
                    </div>

                    <p className="text-xs text-[#8daaa8] leading-relaxed">
                      {link.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-[#243635] hover:bg-[#2c4241] text-stone-300 hover:text-white border border-[#364e4c] transition-colors"
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleCopy(link.key, link.url)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all font-['Fredoka'] ${
                        isCopied
                          ? 'bg-emerald-500 text-stone-950 shadow-lg'
                          : 'bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] shadow'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* URL preview box */}
                <div className="mt-3 bg-[#111a19] p-2 rounded-xl border border-[#243534] flex items-center justify-between gap-2">
                  <code className="text-[11px] text-[#e2e663] font-mono truncate select-all">
                    {link.url}
                  </code>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2d4240] bg-[#152221] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8daaa8]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#e2e663]" />
            <span>
              Ambos links están 100% operativos y sincronizados en tiempo real.
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#243635] hover:bg-[#2c4241] text-white px-5 py-2 rounded-xl font-bold transition-colors font-['Fredoka']"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
