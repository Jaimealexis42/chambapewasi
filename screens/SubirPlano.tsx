import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function SubirPlano({ onBack, onSubir }: { onBack: () => void, onSubir: (archivo: any) => void }) {

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara'); return; }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (!result.canceled) onSubir({ tipo: 'imagen', uri: result.assets[0].uri, base64: result.assets[0].base64 });
  };

  const subirImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
    if (!result.canceled) onSubir({ tipo: 'imagen', uri: result.assets[0].uri, base64: result.assets[0].base64 });
  };

  const subirPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled) onSubir({ tipo: 'pdf', uri: result.assets[0].uri, nombre: result.assets[0].name });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Subir plano</Text>
      <Text style={styles.subtitle}>Elige cómo quieres subir tu plano</Text>
      <TouchableOpacity style={styles.optionCard} onPress={tomarFoto}>
        <Text style={styles.optionIcon}>📷</Text>
        <View>
          <Text style={styles.optionTitle}>Tomar foto</Text>
          <Text style={styles.optionSub}>Fotografía tu plano impreso</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionCard} onPress={subirPDF}>
        <Text style={styles.optionIcon}>📁</Text>
        <View>
          <Text style={styles.optionTitle}>Subir PDF</Text>
          <Text style={styles.optionSub}>Selecciona un archivo PDF</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionCard} onPress={subirImagen}>
        <Text style={styles.optionIcon}>🖼️</Text>
        <View>
          <Text style={styles.optionTitle}>Subir imagen</Text>
          <Text style={styles.optionSub}>JPG o PNG desde tu galería</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 Para mejores resultados usa imágenes nítidas con buena iluminación</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16, paddingVertical: 8 },
  backText: { color: '#00C896', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#E6EDF3', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B949E', marginBottom: 32 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 12, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#30363D', gap: 16 },
  optionIcon: { fontSize: 32 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#E6EDF3' },
  optionSub: { fontSize: 13, color: '#8B949E', marginTop: 2 },
  infoBox: { backgroundColor: '#161B22', borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#30363D' },
  infoText: { color: '#8B949E', fontSize: 13, lineHeight: 20 },
});
