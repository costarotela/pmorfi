import { jsPDF } from 'jspdf';
import { Order } from '../types';

export const generateKitchenTicketPDF = (order: Order, type: 'cocina' | 'cliente' = 'cocina') => {
  // 80mm width standard receipt = 80 x 200 mm
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 220],
  });

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PUNTO MORFI', 40, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CASA DE COMIDAS & ROTISERIA', 40, y, { align: 'center' });
  y += 4;

  doc.setFontSize(8);
  doc.text('CUIT: 30-71649281-9 • IVA Resp. Inscripto', 40, y, { align: 'center' });
  y += 5;

  // Title badge
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.5);
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const badgeTitle = type === 'cocina' ? '*** COMANDA DE COCINA ***' : '*** TICKET DE DESPACHO / CAJA ***';
  doc.text(badgeTitle, 40, y, { align: 'center' });
  y += 5;

  doc.line(5, y, 75, y);
  y += 6;

  // Order Number & Date
  doc.setFontSize(13);
  doc.text(`ORDEN: ${order.orderNumber}`, 5, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`FECHA: ${formattedDate}`, 5, y);
  y += 4;

  const tipoEntrega = order.deliveryMethod === 'delivery' ? 'DELIVERY A DOMICILIO' : 'RETIRO EN MOSTRADOR';
  doc.setFont('helvetica', 'bold');
  doc.text(`ENTREGA: ${tipoEntrega}`, 5, y);
  y += 6;

  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text(`CLIENTE: ${order.customerName.toUpperCase()}`, 5, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`TEL/WA: ${order.customerPhone}`, 5, y);
  y += 4;

  if (order.deliveryAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text(`DIR: ${order.deliveryAddress}`, 5, y);
    y += 4;
    if (order.deliveryFloorApt) {
      doc.setFont('helvetica', 'normal');
      doc.text(`PISO/DEPTO: ${order.deliveryFloorApt}`, 5, y);
      y += 4;
    }
  }

  if (order.deliveryNotes) {
    doc.setFont('helvetica', 'bold');
    doc.text(`*** OBS CLIENTE: ${order.deliveryNotes.toUpperCase()} ***`, 5, y);
    y += 5;
  }

  // Items separator
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CANT  DETALLE PLATO', 5, y);
  doc.text('TOTAL', 75, y, { align: 'right' });
  y += 4;
  doc.line(5, y, 75, y);
  y += 5;

  // Items list
  order.items.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${item.quantity}x`, 5, y);

    // Split long dish names
    const splitName = doc.splitTextToSize(item.menuItem.name, 48);
    doc.text(splitName, 13, y);
    doc.text(`$${item.itemTotalPrice.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
    y += splitName.length * 4.5;

    // Options
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      item.selectedOptions.forEach((opt) => {
        doc.text(`- ${opt.selectedOption.name}`, 13, y);
        y += 3.5;
      });
    }

    // Special Kitchen instructions
    if (item.specialInstructions) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`* OBS: ${item.specialInstructions}`, 13, y);
      y += 4;
    }

    y += 1.5;
  });

  // Totals separator
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal:', 5, y);
  doc.text(`$${order.subtotal.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
  y += 4;

  if (order.deliveryFee > 0) {
    doc.text('Costo Envío:', 5, y);
    doc.text(`$${order.deliveryFee.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
    y += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL A PAGAR:', 5, y);
  doc.text(`$${order.total.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
  y += 6;

  // Payment details & Mercado Pago Alias
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const medioTexto =
    order.paymentMethod === 'mercadopago_alias'
      ? 'MERCADO PAGO (TRANSFERENCIA)'
      : order.paymentMethod.toUpperCase();
  doc.text(`MEDIO PAGO: ${medioTexto}`, 5, y);
  y += 4;

  if (order.assignedAlias) {
    doc.setFont('helvetica', 'bold');
    doc.text(`ALIAS MP ASIGNADO: ${order.assignedAlias.alias}`, 5, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`TITULAR: ${order.assignedAlias.holder}`, 5, y);
    y += 4;
  }

  if (order.paymentReference) {
    doc.setFont('helvetica', 'bold');
    doc.text(`REF COMPROBANTE: ${order.paymentReference}`, 5, y);
    y += 4;
  }

  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('¡Gracias por elegir Punto Morfi!', 40, y, { align: 'center' });

  // Save PDF
  const filename = `Comanda_PuntoMorfi_${order.orderNumber.replace('#', '')}_${type}.pdf`;
  doc.save(filename);
};
