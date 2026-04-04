import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function ListaCompras({ datos, onBack }: { datos: any, onBack: () => void }) {
  const [expandida, setExpandida] = useState<string | null>(null);
  const categorias = datos?.materiales || [];

  const totalGeneral = categorias.reduce((acc: number, cat: any) =>
    acc + (cat.items || []).reduce((a: number, item: any) => a + (item.cantidad * item.precioUnit), 0), 0);

  if (categorias.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { alignSelf: 'flex-start', marginLeft: 24, marginTop: 60 }]}>
          <Text style={styles.backText}>← Volver al presupuesto</Text>
        </TouchableOpacity>
        <Text style={{ color: '#8B949E', fontSize: 14, textAlign: 'center' }}>No hay materiales disponibles{'\n'}Analiza un plano primero</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver al presupuesto</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Lista de materiales</Text>
      <Text style={styles.subtitle}>Calculada automáticamente desde tu presupuesto</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total materiales estimado</Text>
        <Text style={styles.totalMonto}>S/ {totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>

      {categorias.map((cat: any, i: number) => (
        <View key={i}>
          <TouchableOpacity
            style={[styles.catRow, expandida === cat.categoria && styles.catRowActive]}
            onPress={() => setExpandida(expandida === cat.categoria ? null : cat.categoria)}
          >
            <Text style={styles.catIconNombre}>{cat.icono} {cat.categoria}</Text>
            <Text style={styles.chevron}>{expandida === cat.categoria ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {expandida === cat.categoria && (
            <View style={styles.itemsContainer}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemHeaderText, { flex: 3 }]}>Material</Text>
                <Text style={[styles.itemHeaderText, { flex: 1.5, textAlign: 'center' }]}>Cantidad</Text>
                <Text style={[styles.itemHeaderText, { flex: 1.5, textAlign: 'right' }]}>Subtotal</Text>
              </View>
              {(cat.items || []).map((item: any, j: number) => (
                <View key={j} style={styles.itemRow}>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.itemNombre}>{item.nombre}</Text>
                    <Text style={styles.itemPrecio}>S/ {item.precioUnit?.toFixed(2)}/{item.unidad}</Text>
                  </View>
                  <Text style={styles.itemCantidad}>{item.cantidad} {item.unidad}</Text>
                  <Text style={styles.itemSubtotal}>S/ {(item.cantidad * item.precioUnit).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.exportBtn}>
        <Text style={styles.exportBtnText}>📋 Exportar lista completa</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16, paddingVertical: 8 },
  backText: { color: '#00C896', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#E6EDF3', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#8B949E', marginBottom: 16 },
  totalCard: { backgroundColor: '#161B22', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#00C896' },
  totalLabel: { fontSize: 13, color: '#8B949E', marginBottom: 4 },
  totalMonto: { fontSize: 28, fontWeight: '800', color: '#00C896' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 12, padding: 16, marginBottom: 2, borderWidth: 1, borderColor: '#30363D' },
  catRowActive: { borderColor: '#00C896', backgroundColor: '#0D1F17' },
  catIconNombre: { fontSize: 15, fontWeight: '700', color: '#E6EDF3' },
  chevron: { fontSize: 10, color: '#8B949E' },
  itemsContainer: { backgroundColor: '#0D1117', borderLeftWidth: 2, borderLeftColor: '#00C896', marginBottom: 8, marginLeft: 8, paddingLeft: 12, paddingVertical: 8 },
  itemHeader: { flexDirection: 'row', marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  itemHeaderText: { fontSize: 11, color: '#8B949E', fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#161B22' },
  itemNombre: { fontSize: 12, color: '#E6EDF3', flexWrap: 'wrap' },
  itemPrecio: { fontSize: 11, color: '#8B949E', marginTop: 2 },
  itemCantidad: { flex: 1.5, fontSize: 12, color: '#E6EDF3', fontWeight: '600', textAlign: 'center' },
  itemSubtotal: { flex: 1.5, fontSize: 12, color: '#00C896', fontWeight: '700', textAlign: 'right' },
  exportBtn: { backgroundColor: '#00C896', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 32, marginBottom: 24 },
  exportBtnText: { fontSize: 16, fontWeight: '800', color: '#0D1117' },
});
