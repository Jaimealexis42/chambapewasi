import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const ZONAS_SISMICAS: Record<string, string> = {
  'Tumbes': 'Zona 4', 'Piura': 'Zona 4', 'Lambayeque': 'Zona 4',
  'La Libertad': 'Zona 4', 'Ancash': 'Zona 4', 'Lima': 'Zona 4',
  'Callao': 'Zona 4', 'Ica': 'Zona 4', 'Arequipa': 'Zona 4',
  'Moquegua': 'Zona 4', 'Tacna': 'Zona 4', 'Cajamarca': 'Zona 3',
  'Amazonas': 'Zona 3', 'San Martin': 'Zona 3', 'Huanuco': 'Zona 3',
  'Pasco': 'Zona 3', 'Junin': 'Zona 3', 'Huancavelica': 'Zona 3',
  'Ayacucho': 'Zona 3', 'Apurimac': 'Zona 3', 'Cusco': 'Zona 3',
  'Puno': 'Zona 3', 'Ucayali': 'Zona 3', 'Loreto': 'Zona 2',
  'Madre de Dios': 'Zona 2',
};

const pasos = [
  'Leyendo plano...',
  'Identificando elementos...',
  'Calculando metrados...',
  'Aplicando normas RNE...',
  'Generando presupuesto...',
];

function getInstruccionTipo(tipoPlano: string): string {
  if (tipoPlano === 'elemento') {
    return 'La imagen muestra UN SOLO elemento estructural (zapata, viga, losa, columna o muro). ' +
      'Genera UNICAMENTE las subpartidas de ese elemento: excavacion si aplica, solado, concreto, encofrado, acero. ' +
      'PROHIBIDO agregar partidas de arquitectura, instalaciones, trabajos preliminares o cualquier otro elemento.';
  }
  if (tipoPlano === 'estructural') {
    return 'La imagen muestra un plano estructural. ' +
      'Genera partidas de: Cimentacion, Concreto Armado (columnas/vigas/losas), Acero. ' +
      'PROHIBIDO agregar arquitectura o instalaciones.';
  }
  if (tipoPlano === 'arquitectura') {
    return 'La imagen muestra un plano arquitectonico. ' +
      'Genera partidas de: Muros y Tabiques, Revoques, Pisos, Carpinteria, Pintura, Vidrios. ' +
      'PROHIBIDO agregar estructuras o instalaciones.';
  }
  if (tipoPlano === 'instalaciones') {
    return 'La imagen muestra un plano de instalaciones. ' +
      'Genera partidas de: Instalaciones Electricas y/o Instalaciones Sanitarias segun lo visible. ' +
      'PROHIBIDO agregar estructuras o arquitectura.';
  }
  return 'La imagen muestra un plano completo de obra. ' +
    'Genera todas las partidas necesarias segun lo visible: Estructuras, Arquitectura, Instalaciones.';
}

function getPrompt(ciudad: string, tipoObra: string, pisos: number, zona: string, tipoPlano: string): string {
  return 'Eres un ingeniero civil peruano experto en metrados y presupuestos CAPECO.\n\n' +
    'CIUDAD: ' + ciudad + ' | ZONA SISMICA: ' + zona + ' | TIPO OBRA: ' + tipoObra + ' | PISOS: ' + pisos + '\n\n' +
    'INSTRUCCION CRITICA: ' + getInstruccionTipo(tipoPlano) + '\n\n' +
    'Precios segun CAPECO ' + ciudad + ' 2026. Todo en espanol.\n\n' +
    'Responde SOLO con JSON valido:\n' +
    '{"ciudad":"' + ciudad + '","zona":"' + zona + '","area":"XX m2","total":"S/ XX,XXX","partidas":[{"nombre":"NOMBRE","monto":"S/ XX,XXX","porcentaje":"XX%","subpartidas":[{"nombre":"Sub","unidad":"m3","metrado":1.0,"apu":{"manoObra":8.50,"materiales":2.50,"equipos":1.50},"detalle":[{"desc":"Desc","cant":"1.0 m3"}]}]}],"materiales":[{"categoria":"Cat","icono":"icon","items":[{"nombre":"Mat","cantidad":1,"unidad":"kg","precioUnit":4.80}]}]}';
}

export default function Procesando({ archivo, onDone, config, tipoPlano }: { archivo: any; onDone: (result: any) => void; config?: any; tipoPlano?: string }) {
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const ciudad = config?.ciudad || 'Lima';
  const tipoObra = config?.tipoObra || 'casa';
  const pisos = config?.pisos || 1;
  const zona = ZONAS_SISMICAS[ciudad] || 'Zona 3';
  const tipo = tipoPlano || 'completo';

  useEffect(() => {
    const interval = setInterval(() => {
      setPaso(p => (p < pasos.length - 1 ? p + 1 : p));
    }, 600);

    const analizar = async () => {
      try {
        if (!API_KEY) throw new Error('API KEY no configurada');

        const prompt = getPrompt(ciudad, tipoObra, pisos, zona, tipo);
        let messages: any[];

        if (archivo?.tipo === 'imagen' && archivo?.uri) {
          setDebugInfo('Comprimiendo imagen...');
          const compressed = await ImageManipulator.manipulateAsync(
            archivo.uri,
            [{ resize: { width: 1024 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const base64 = compressed.base64 || '';
          setDebugInfo('Llamando API...');
          messages = [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: prompt }
            ]
          }];
        } else {
          messages = [{
            role: 'user',
            content: prompt + '\n\nSin imagen. Genera presupuesto ejemplo en ' + ciudad + '.',
          }];
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 8000,
            messages,
          }),
        });

        const rawText = await response.text();
        setDebugInfo('Status: ' + response.status);

        if (!response.ok) throw new Error('API error ' + response.status + ': ' + rawText);

        const data = JSON.parse(rawText);
        const texto = data.content?.[0]?.text || '';

        if (!texto) throw new Error('Respuesta vacia');

        const match = texto.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON: ' + texto.substring(0, 300));

        const resultado = JSON.parse(match[0]);
        resultado.ciudad = ciudad;
        clearInterval(interval);
        onDone(resultado);
      } catch (e: any) {
        clearInterval(interval);
        setError(e.message || 'Error desconocido');
      }
    };

    analizar();
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.errorContainer}>
        <Text style={styles.logo}>PresupIA</Text>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al procesar</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        {debugInfo ? <Text style={styles.debugMsg}>DEBUG: {debugInfo}</Text> : null}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PresupIA</Text>
      <ActivityIndicator size="large" color="#00C896" style={styles.spinner} />
      <Text style={styles.paso}>{pasos[paso]}</Text>
      <View style={styles.dotsRow}>
        {pasos.map((_, i) => (
          <View key={i} style={[styles.dot, i <= paso && styles.dotActive]} />
        ))}
      </View>
      <Text style={styles.sub}>{'La IA esta analizando tu plano\nEsto puede tomar 20-30 segundos'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#0D1117' },
  container: { flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 600 },
  logo: { fontSize: 28, fontWeight: '800', color: '#00C896', marginBottom: 48 },
  spinner: { marginBottom: 32 },
  paso: { fontSize: 18, fontWeight: '600', color: '#E6EDF3', marginBottom: 24 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#30363D' },
  dotActive: { backgroundColor: '#00C896' },
  sub: { fontSize: 13, color: '#8B949E', textAlign: 'center', lineHeight: 22 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#FF6B6B', marginBottom: 12 },
  errorMsg: { fontSize: 12, color: '#8B949E', textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  debugMsg: { fontSize: 10, color: '#F0A500', textAlign: 'center', lineHeight: 16, padding: 8 },
});
