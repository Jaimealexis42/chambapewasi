import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://tnrqdyagfecceeebocvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Vvbk0cnfSFVPDkIPwozgCg_UJT4BSrq';

export default function Historial({ onBack, onVer }: { onBack: () => void; onVer: () => void }) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/pres_historial?order=created_at.desc&limit=20', {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
      });
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mis presupuestos</Text>
      <Text style={styles.subtitle}>{historial.length} presupuestos guardados</Text>

      {cargando && <ActivityIndicator color="#00C896" size="large" style={{ marginTop: 40 }} />}

      {!cargando && historial.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No tienes presupuestos aun{'\n'}Analiza tu primer plano para empezar</Text>
        </View>
      )}

      {historial.map((item) => (
        <TouchableOpacity key={item.id} style={styles.card} onPress={onVer}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardCiudad}>📍 {item.ciudad}</Text>
            <Text style={styles.cardFecha}>{new Date(item.created_at).toLocaleDateString('es-PE')}</Text>
          </View>
          <Text style={styles.cardTotal}>{item.total}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardTag}>📐 {item.area}</Text>
            <Text style={styles.cardTag}>📍 {item.zona}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { color: '#00C896', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#E6EDF3', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B949E', marginBottom: 24 },
  card: {
    backgroundColor: '#161B22', borderRadius: 16,
    padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#30363D',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardCiudad: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
  cardFecha: { fontSize: 12, color: '#8B949E' },
  cardTotal: { fontSize: 24, fontWeight: '800', color: '#00C896', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', gap: 12 },
  cardTag: { fontSize: 12, color: '#8B949E' },
  emptyBox: { backgroundColor: '#161B22', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#30363D', marginTop: 40 },
  emptyText: { color: '#8B949E', textAlign: 'center', lineHeight: 22 },
});