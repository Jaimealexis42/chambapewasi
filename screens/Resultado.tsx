import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import { exportarPresupuestoPDF } from './ExportarPDF';

const MOCK = {
  ciudad: 'Lima', zona: 'Zona 4', area: '120 m²',
  partidas: [
    {
      nombre: 'Estructuras', porcentaje: '34%',
      subpartidas: [
        { nombre: 'Trabajos preliminares', unidad: 'm²', metrado: 120.0, apu: { manoObra: 8.50, materiales: 2.50, equipos: 1.50 }, detalle: [{ desc: 'Limpieza de terreno manual', cant: '120.0 m²' }] },
        { nombre: 'Excavación de zapatas', unidad: 'm³', metrado: 28.0, apu: { manoObra: 38.00, materiales: 0.00, equipos: 7.00 }, detalle: [{ desc: 'Excavación manual h=1.50m', cant: '28.0 m³' }] },
        { nombre: 'Concreto armado zapatas f\'c=210', unidad: 'm³', metrado: 8.4, apu: { manoObra: 85.00, materiales: 380.00, equipos: 35.00 }, detalle: [{ desc: 'Zapatas Z-1 y Z-2', cant: '8.4 m³' }] },
        { nombre: 'Acero fy=4200 zapatas', unidad: 'kg', metrado: 380.0, apu: { manoObra: 3.20, materiales: 4.80, equipos: 0.20 }, detalle: [{ desc: 'Varilla 1/2" y 3/8"', cant: '380 kg' }] },
        { nombre: 'Concreto armado columnas f\'c=210', unidad: 'm³', metrado: 6.8, apu: { manoObra: 95.00, materiales: 385.00, equipos: 38.00 }, detalle: [{ desc: 'Columnas C-1, C-2, C-3', cant: '6.8 m³' }] },
        { nombre: 'Losa aligerada h=20cm', unidad: 'm²', metrado: 120.0, apu: { manoObra: 42.00, materiales: 95.00, equipos: 18.00 }, detalle: [{ desc: 'Losa f\'c=210 kg/cm²', cant: '120.0 m²' }] },
      ]
    },
    {
      nombre: 'Arquitectura', porcentaje: '25%',
      subpartidas: [
        { nombre: 'Muros ladrillo KK soga', unidad: 'm²', metrado: 118.0, apu: { manoObra: 32.00, materiales: 48.00, equipos: 2.00 }, detalle: [{ desc: 'Muros interiores y exteriores', cant: '118.0 m²' }] },
        { nombre: 'Tarrajeo interiores', unidad: 'm²', metrado: 186.0, apu: { manoObra: 18.00, materiales: 12.00, equipos: 2.50 }, detalle: [{ desc: 'Todos los ambientes', cant: '186.0 m²' }] },
        { nombre: 'Pisos cerámicos 45x45', unidad: 'm²', metrado: 85.0, apu: { manoObra: 22.00, materiales: 38.00, equipos: 2.00 }, detalle: [{ desc: 'Sala, cocina, baños', cant: '85.0 m²' }] },
        { nombre: 'Carpintería de madera', unidad: 'und', metrado: 8.0, apu: { manoObra: 85.00, materiales: 420.00, equipos: 15.00 }, detalle: [{ desc: 'Puertas interiores y exteriores', cant: '8 und' }] },
      ]
    },
    {
      nombre: 'Instalaciones eléctricas', porcentaje: '14%',
      subpartidas: [
        { nombre: 'Salida centros de luz', unidad: 'pto', metrado: 14.0, apu: { manoObra: 65.00, materiales: 85.00, equipos: 0.00 }, detalle: [{ desc: 'Todos los ambientes', cant: '14 pto' }] },
        { nombre: 'Salida tomacorrientes', unidad: 'pto', metrado: 18.0, apu: { manoObra: 58.00, materiales: 78.00, equipos: 0.00 }, detalle: [{ desc: 'Sala, dormitorios, cocina', cant: '18 pto' }] },
        { nombre: 'Tablero general 12 circuitos', unidad: 'und', metrado: 1.0, apu: { manoObra: 180.00, materiales: 680.00, equipos: 0.00 }, detalle: [{ desc: 'Tablero c/llaves', cant: '1 und' }] },
      ]
    },
    {
      nombre: 'Instalaciones sanitarias', porcentaje: '12%',
      subpartidas: [
        { nombre: 'Red agua fría PVC SAP', unidad: 'ml', metrado: 62.0, apu: { manoObra: 12.00, materiales: 18.00, equipos: 0.00 }, detalle: [{ desc: 'Alimentación y ramales', cant: '62.0 ml' }] },
        { nombre: 'Red desagüe PVC SAL', unidad: 'ml', metrado: 58.0, apu: { manoObra: 15.00, materiales: 24.00, equipos: 0.00 }, detalle: [{ desc: 'Colector y ramales', cant: '58.0 ml' }] },
        { nombre: 'Aparatos sanitarios', unidad: 'und', metrado: 7.0, apu: { manoObra: 85.00, materiales: 420.00, equipos: 0.00 }, detalle: [{ desc: 'Inodoros, lavatorios, duchas', cant: '7 und' }] },
      ]
    },
    {
      nombre: 'Acabados', porcentaje: '15%',
      subpartidas: [
        { nombre: 'Pintura látex interiores', unidad: 'm²', metrado: 186.0, apu: { manoObra: 8.50, materiales: 12.00, equipos: 0.50 }, detalle: [{ desc: 'Todos los ambientes', cant: '186.0 m²' }] },
        { nombre: 'Pintura látex exteriores', unidad: 'm²', metrado: 96.0, apu: { manoObra: 10.00, materiales: 16.00, equipos: 0.50 }, detalle: [{ desc: 'Fachadas', cant: '96.0 m²' }] },
        { nombre: 'Revestimiento cerámico baños', unidad: 'm²', metrado: 44.0, apu: { manoObra: 22.00, materiales: 42.00, equipos: 2.00 }, detalle: [{ desc: 'Baño 1 y Baño 2', cant: '44.0 m²' }] },
      ]
    },
  ],
};

function calcSubtotal(sub: any, modo: string) {
  if (modo === 'manoObra') return sub.apu.manoObra * sub.metrado;
  return (sub.apu.manoObra + sub.apu.materiales + sub.apu.equipos) * sub.metrado;
}

function calcTotal(partidas: any[], modo: string) {
  return partidas.reduce((acc, p) => acc + p.subpartidas.reduce((a: number, s: any) => a + calcSubtotal(s, modo), 0), 0);
}

function formatS(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Resultado({ presupuesto, onBack, onListaCompras }: { presupuesto: any, onBack: () => void, onListaCompras: () => void }) {
  const base = (presupuesto && presupuesto.partidas && presupuesto.partidas.length > 0) ? presupuesto : MOCK;
  const [partidas, setPartidas] = useState(base.partidas.map((p: any) => ({
    ...p,
    subpartidas: p.subpartidas.map((s: any) => ({
      ...s,
      apu: s.apu || { manoObra: 0, materiales: 0, equipos: 0 },
      detalle: s.detalle || [],
    }))
  })));
  const [expandida, setExpandida] = useState<number | null>(null);
  const [expandidaSub, setExpandidaSub] = useState<string | null>(null);
  const [modo, setModo] = useState<'completo' | 'manoObra'>('completo');

  const updateApu = useCallback((pi: number, si: number, campo: string, valor: string) => {
    setPartidas((prev: any[]) => prev.map((p: any, i: number) => i !== pi ? p : {
      ...p,
      subpartidas: p.subpartidas.map((s: any, j: number) => j !== si ? s : {
        ...s, apu: { ...s.apu, [campo]: parseFloat(valor) || 0 }
      })
    }));
  }, []);

  const total = calcTotal(partidas, modo);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} decelerationRate={0.5} showsVerticalScrollIndicator={true} scrollEventThrottle={16}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Nuevo análisis</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Presupuesto generado</Text>

      <View style={styles.modoSelector}>
        <TouchableOpacity
          style={[styles.modoBtn, modo === 'completo' && styles.modoBtnActive]}
          onPress={() => setModo('completo')}
        >
          <Text style={[styles.modoBtnText, modo === 'completo' && styles.modoBtnTextActive]}>💰 A todo costo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modoBtn, modo === 'manoObra' && styles.modoBtnActive]}
          onPress={() => setModo('manoObra')}
        >
          <Text style={[styles.modoBtnText, modo === 'manoObra' && styles.modoBtnTextActive]}>👷 Solo mano de obra</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{modo === 'completo' ? 'Costo total estimado' : 'Costo mano de obra'}</Text>
        <Text style={styles.totalMonto}>{formatS(total)}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoTag}>📍 {base.ciudad}</Text>
          <Text style={styles.infoTag}>⚠️ {base.zona}</Text>
          <Text style={styles.infoTag}>📐 {base.area}</Text>
        </View>
        {modo === 'manoObra' && (
          <Text style={styles.modoNote}>Solo incluye costo de trabajadores</Text>
        )}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>⚠️ Presupuesto referencial generado por IA. No reemplaza a un ingeniero civil certificado. Los precios son aproximados según CAPECO {presupuesto?.ciudad || base.ciudad} {new Date().getFullYear()}.</Text>
      </View>

      <Text style={styles.sectionTitle}>Desglose por partidas</Text>
      <Text style={styles.hint}>Toca una partida → toca subpartida para ver APU</Text>

      {partidas.map((item: any, i: number) => {
        const montoPartida = item.subpartidas.reduce((a: number, s: any) => a + calcSubtotal(s, modo), 0);
        const pct = total > 0 ? Math.round((montoPartida / total) * 100) : 0;
        return (
          <View key={i}>
            <TouchableOpacity
              style={[styles.partidaRow, expandida === i && styles.partidaRowActive]}
              onPress={() => setExpandida(expandida === i ? null : i)}
            >
              <View style={styles.partidaInfo}>
                <Text style={styles.partidaNombre}>{item.nombre}</Text>
                <Text style={styles.partidaMonto}>{formatS(montoPartida)}</Text>
              </View>
              <View style={styles.partidaDerecha}>
                <Text style={styles.partidaPct}>{pct}%</Text>
                <Text style={styles.chevron}>{expandida === i ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {expandida === i && item.subpartidas.map((sub: any, j: number) => {
              const key = `${i}-${j}`;
              const subtotal = calcSubtotal(sub, modo);
              const pu = modo === 'manoObra' ? sub.apu.manoObra : (sub.apu.manoObra + sub.apu.materiales + sub.apu.equipos);
              return (
                <View key={j}>
                  <TouchableOpacity
                    style={[styles.subRow, expandidaSub === key && styles.subRowActive]}
                    onPress={() => setExpandidaSub(expandidaSub === key ? null : key)}
                  >
                    <View style={styles.subInfo}>
                      <Text style={styles.subNombre}>{sub.nombre}</Text>
                      <Text style={styles.subMeta}>{sub.metrado} {sub.unidad}  ×  S/{pu.toFixed(2)}/u  =  <Text style={styles.subMonto}>{formatS(subtotal)}</Text></Text>
                    </View>
                    <Text style={styles.subChevron}>{expandidaSub === key ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {expandidaSub === key && (
                    <View style={styles.apuContainer}>
                      <Text style={styles.apuTitle}>📐 Metrado detallado</Text>
                      {sub.detalle.map((d: any, k: number) => (
                        <View key={k} style={styles.detalleRow}>
                          <Text style={styles.detalleDesc}>• {d.desc}</Text>
                          <Text style={styles.detalleCant}>{d.cant}</Text>
                        </View>
                      ))}

                      <Text style={styles.apuTitle}>💰 APU — Análisis de Precios Unitarios</Text>
                      <View style={styles.apuHeader}>
                        <Text style={[styles.apuHeaderText, { flex: 2 }]}>Componente</Text>
                        <Text style={[styles.apuHeaderText, { flex: 1.2, textAlign: 'center' }]}>S//u</Text>
                        <Text style={[styles.apuHeaderText, { flex: 1, textAlign: 'right' }]}>Subtotal</Text>
                      </View>

                      {[
                        { label: '👷 Mano de obra', campo: 'manoObra' },
                        ...(modo === 'completo' ? [
                          { label: '🧱 Materiales', campo: 'materiales' },
                          { label: '⚙️ Equipos', campo: 'equipos' },
                        ] : []),
                      ].map(({ label, campo }) => (
                        <View key={campo} style={styles.apuRow}>
                          <Text style={[styles.apuLabel, { flex: 2 }]}>{label}</Text>
                          <TextInput
                            style={styles.apuInput}
                            value={String(sub.apu[campo])}
                            keyboardType="decimal-pad"
                            onChangeText={(v) => updateApu(i, j, campo, v)}
                          />
                          <Text style={[styles.apuSubtotal, { flex: 1 }]}>{formatS(sub.apu[campo] * sub.metrado)}</Text>
                        </View>
                      ))}

                      <View style={styles.apuTotalRow}>
                        <Text style={styles.apuTotalLabel}>TOTAL  ({sub.metrado} {sub.unidad} × S/{pu.toFixed(2)})</Text>
                        <Text style={styles.apuTotalMonto}>{formatS(subtotal)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      {modo === 'completo' && (
        <TouchableOpacity style={styles.listaBtn} onPress={onListaCompras}>
          <Text style={styles.listaBtnText}>🛒 Ver lista de compras</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.exportBtn} onPress={() => exportarPresupuestoPDF({ ciudad: base.ciudad, zona: base.zona, area: base.area, partidas: partidas }, modo)}>
        <Text style={styles.exportBtnText}>📄 Exportar PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16, paddingVertical: 8 },
  backText: { color: '#00C896', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#E6EDF3', marginBottom: 16 },
  modoSelector: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  modoBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#30363D', alignItems: 'center', backgroundColor: '#161B22' },
  modoBtnActive: { borderColor: '#00C896', backgroundColor: '#0D1F17' },
  modoBtnText: { fontSize: 13, color: '#8B949E', fontWeight: '600' },
  modoBtnTextActive: { color: '#00C896' },
  totalCard: { backgroundColor: '#00C896', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  totalLabel: { fontSize: 14, color: '#0D1117', opacity: 0.8, marginBottom: 4 },
  totalMonto: { fontSize: 38, fontWeight: '800', color: '#0D1117', marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  infoTag: { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, fontSize: 12, color: '#0D1117', fontWeight: '600' },
  modoNote: { fontSize: 11, color: '#0D1117', opacity: 0.7, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  hint: { fontSize: 12, color: '#8B949E', marginBottom: 12 },
  partidaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 12, padding: 16, marginBottom: 2, borderWidth: 1, borderColor: '#30363D' },
  partidaRowActive: { borderColor: '#00C896', backgroundColor: '#0D1F17' },
  partidaInfo: { flex: 1 },
  partidaNombre: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
  partidaMonto: { fontSize: 13, color: '#8B949E', marginTop: 2 },
  partidaDerecha: { alignItems: 'flex-end', gap: 4 },
  partidaPct: { fontSize: 16, fontWeight: '700', color: '#00C896' },
  chevron: { fontSize: 10, color: '#8B949E' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#161B22', backgroundColor: '#0D1117', borderLeftWidth: 2, borderLeftColor: '#00C896', marginLeft: 8 },
  subRowActive: { backgroundColor: '#0A1A12' },
  subInfo: { flex: 1 },
  subNombre: { fontSize: 12, color: '#E6EDF3', fontWeight: '500' },
  subMeta: { fontSize: 11, color: '#8B949E', marginTop: 2 },
  subMonto: { color: '#00C896', fontWeight: '700' },
  subChevron: { fontSize: 9, color: '#8B949E', marginLeft: 8 },
  apuContainer: { backgroundColor: '#060D0A', marginLeft: 8, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: '#00C896', borderBottomWidth: 1, borderBottomColor: '#161B22' },
  apuTitle: { fontSize: 11, color: '#00C896', fontWeight: '700', marginTop: 8, marginBottom: 6 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  detalleDesc: { fontSize: 11, color: '#8B949E', flex: 2 },
  detalleCant: { fontSize: 11, color: '#E6EDF3', fontWeight: '600', flex: 1, textAlign: 'right' },
  apuHeader: { flexDirection: 'row', marginBottom: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  apuHeaderText: { fontSize: 10, color: '#8B949E', fontWeight: '600' },
  apuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  apuLabel: { fontSize: 12, color: '#E6EDF3' },
  apuInput: { flex: 1.2, backgroundColor: '#161B22', color: '#00C896', fontSize: 13, fontWeight: '700', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center', borderWidth: 1, borderColor: '#30363D', marginHorizontal: 6 },
  apuSubtotal: { fontSize: 12, color: '#8B949E', textAlign: 'right' },
  apuTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#30363D' },
  apuTotalLabel: { fontSize: 11, color: '#8B949E', flex: 2 },
  apuTotalMonto: { fontSize: 14, color: '#00C896', fontWeight: '800' },
  listaBtn: { backgroundColor: '#161B22', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 24, marginBottom: 8, borderWidth: 1, borderColor: '#00C896' },
  listaBtnText: { fontSize: 16, fontWeight: '700', color: '#00C896' },
  exportBtn: { backgroundColor: '#00C896', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24 },
  exportBtnText: { fontSize: 16, fontWeight: '700', color: '#0D1117' },
  disclaimer: { backgroundColor: '#1A1200', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F0A500' },
  disclaimerText: { fontSize: 11, color: '#F0A500', lineHeight: 16, textAlign: 'center' },
});







