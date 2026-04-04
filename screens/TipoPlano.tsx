import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

const TIPOS = [
  { id: 'elemento', icono: '📐', titulo: 'Elemento estructural', desc: 'Zapata, viga, losa, columna, muro' },
  { id: 'estructural', icono: '🏗️', titulo: 'Plano estructural', desc: 'Cimentacion, columnas, vigas, losas' },
  { id: 'arquitectura', icono: '🏠', titulo: 'Plano arquitectonico', desc: 'Ambientes, muros, acabados, pisos' },
  { id: 'instalaciones', icono: '⚡', titulo: 'Instalaciones', desc: 'Electricas, sanitarias, agua, desague' },
  { id: 'completo', icono: '📋', titulo: 'Plano completo de obra', desc: 'Todas las especialidades' },
];

export default function TipoPlano({ onBack, onSeleccionar }: { onBack: () => void; onSeleccionar: (tipo: string) => void }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Tipo de plano</Text>
        <Text style={styles.subtitulo}>Selecciona que muestra tu imagen para un analisis preciso</Text>
      </View>

      {TIPOS.map((tipo) => (
        <TouchableOpacity key={tipo.id} style={styles.card} onPress={() => onSeleccionar(tipo.id)}>
          <Text style={styles.icono}>{tipo.icono}</Text>
          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo}>{tipo.titulo}</Text>
            <Text style={styles.cardDesc}>{tipo.desc}</Text>
          </View>
          <Text style={styles.flecha}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  back: { color: '#00C896', fontSize: 16, marginBottom: 20 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#E6EDF3', marginBottom: 8 },
  subtitulo: { fontSize: 14, color: '#8B949E', lineHeight: 20 },
  card: { backgroundColor: '#161B22', borderRadius: 14, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#30363D' },
  icono: { fontSize: 32, marginRight: 16 },
  cardTexto: { flex: 1 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#8B949E' },
  flecha: { fontSize: 24, color: '#00C896', fontWeight: '700' },
});
