import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function formatS(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcSubtotal(sub: any, modo: string) {
  if (modo === 'manoObra') return sub.apu.manoObra * sub.metrado;
  return (sub.apu.manoObra + sub.apu.materiales + sub.apu.equipos) * sub.metrado;
}

export async function exportarPresupuestoPDF(presupuesto: any, modo: string) {
  const total = presupuesto.partidas.reduce((acc: number, p: any) =>
    acc + p.subpartidas.reduce((a: number, s: any) => a + calcSubtotal(s, modo), 0), 0);

  const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const modoTexto = modo === 'manoObra' ? 'Solo mano de obra' : 'A todo costo';

  const partidasHTML = presupuesto.partidas.map((partida: any) => {
    const montoPartida = partida.subpartidas.reduce((a: number, s: any) => a + calcSubtotal(s, modo), 0);
    const subpartidasHTML = partida.subpartidas.map((sub: any) => {
      const subtotal = calcSubtotal(sub, modo);
      const pu = modo === 'manoObra' ? sub.apu.manoObra : (sub.apu.manoObra + sub.apu.materiales + sub.apu.equipos);
      return [
        '<tr>',
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;">' + sub.nombre + '</td>',
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:center;">' + sub.metrado + ' ' + sub.unidad + '</td>',
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:right;">S/ ' + pu.toFixed(2) + '</td>',
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:right;font-weight:600;color:#00856F;">' + formatS(subtotal) + '</td>',
        '</tr>',
      ].join('');
    }).join('');

    return [
      '<tr style="background:#f0faf7;">',
      '<td colspan="3" style="padding:10px 12px;font-weight:700;font-size:13px;color:#00856F;">' + partida.nombre + '</td>',
      '<td style="padding:10px 12px;font-weight:700;font-size:13px;text-align:right;color:#00856F;">' + formatS(montoPartida) + '</td>',
      '</tr>',
      subpartidasHTML,
    ].join('');
  }).join('');

  const html = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    '<style>',
    '* { margin:0; padding:0; box-sizing:border-box; }',
    'body { font-family:Arial,sans-serif; color:#1a1a1a; padding:40px; }',
    '.header { display:flex; justify-content:space-between; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #00C896; }',
    '.logo { font-size:28px; font-weight:900; color:#00C896; }',
    '.info-box { background:#f0faf7; border-radius:12px; padding:20px; margin-bottom:24px; display:flex; gap:40px; }',
    '.info-label { font-size:11px; color:#666; margin-bottom:4px; }',
    '.info-value { font-size:14px; font-weight:700; }',
    '.total-box { background:#00C896; border-radius:12px; padding:20px 24px; margin-bottom:24px; }',
    '.total-label { font-size:13px; color:#fff; opacity:0.85; }',
    '.total-monto { font-size:28px; font-weight:900; color:#fff; }',
    'h2 { font-size:16px; font-weight:700; margin-bottom:12px; }',
    'table { width:100%; border-collapse:collapse; margin-bottom:32px; }',
    'thead tr { background:#1a1a1a; }',
    'thead td { padding:10px 12px; color:#fff; font-size:12px; font-weight:600; }',
    '.footer { margin-top:40px; padding-top:16px; border-top:1px solid #eee; font-size:10px; color:#999; text-align:center; }',
    '</style></head><body>',
    '<div class="header">',
    '<div><div class="logo">PresupIA</div><div style="font-size:11px;color:#666;margin-top:4px;">Presupuestos de construccion con IA - CAPECO / RNE 2026</div></div>',
    '<div style="font-size:12px;color:#666;text-align:right;"><div>Fecha: ' + fecha + '</div><div>Norma: RNE 2026 / CAPECO</div></div>',
    '</div>',
    '<div class="info-box">',
    '<div><div class="info-label">Ciudad</div><div class="info-value">' + presupuesto.ciudad + '</div></div>',
    '<div><div class="info-label">Zona sismica</div><div class="info-value">' + presupuesto.zona + '</div></div>',
    '<div><div class="info-label">Area</div><div class="info-value">' + presupuesto.area + '</div></div>',
    '<div><div class="info-label">Tipo</div><div class="info-value">' + modoTexto + '</div></div>',
    '</div>',
    '<div class="total-box">',
    '<div class="total-label">Costo total estimado</div>',
    '<div class="total-monto">' + formatS(total) + '</div>',
    '<div style="font-size:11px;color:#fff;margin-top:6px;">' + modoTexto + '</div>',
    '</div>',
    '<h2>Desglose por partidas y subpartidas</h2>',
    '<table><thead><tr>',
    '<td style="width:45%">Descripcion</td>',
    '<td style="width:15%;text-align:center;">Metrado</td>',
    '<td style="width:15%;text-align:right;">P.U. (S/)</td>',
    '<td style="width:25%;text-align:right;">Subtotal</td>',
    '</tr></thead><tbody>',
    partidasHTML,
    '<tr style="background:#1a1a1a;">',
    '<td colspan="3" style="padding:12px;color:#fff;font-weight:700;font-size:14px;">TOTAL PRESUPUESTO</td>',
    '<td style="padding:12px;color:#00C896;font-weight:900;font-size:16px;text-align:right;">' + formatS(total) + '</td>',
    '</tr>',
    '</tbody></table>',
    '<div class="footer">Generado por PresupIA - Presupuesto referencial basado en analisis de IA - DevNova AI</div>',
    '</body></html>',
  ].join('');

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exportar presupuesto PDF' });
}
