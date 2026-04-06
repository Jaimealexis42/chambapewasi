import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState, useRef } from 'react';
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
    return 'La imagen muestra UN SOLO elemento estructural. ' +
      'IDENTIFICAR el elemento visible y generar UNICAMENTE sus subpartidas directas. ' +
      'Para una ZAPATA: excavacion, solado, concreto zapata, encofrado zapata, acero zapata. NADA MAS. ' +
      'Para una COLUMNA: concreto columna, encofrado columna, acero columna. NADA MAS. ' +
      'PROHIBIDO ABSOLUTAMENTE: sobrecimiento, cimientos corridos, muros, arquitectura, instalaciones, trabajos preliminares. ' +
      'Si no ves el elemento claramente, genera solo lo que SI ves.';
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

function getPrompt(ciudad: string, tipoObra: string, pisos: number, zona: string, tipoPlano: string, altura: number = 2.40): string {
  const precios =
    'MANO DE OBRA CAPECO 2025 (vigente jun-dic 2025):\n' +
    '- Operario: S/87.30/dia, HH=S/29.99\n' +
    '- Oficial: S/68.50/dia, HH=S/23.60\n' +
    '- Peon: S/61.65/dia, HH=S/21.36\n\n' +
    'APU ESTRUCTURAS (precios reales Peru 2026):\n' +
    '- Excavacion zapatas: S/38.71/m3 (MO 97%, Equip 3%)\n' +
    '- Solado e=2": S/23.82/m2 (MO 68%, Mat 24%, Equip 8%)\n' +
    '- Zapatas concreto f\'c=210: S/284.65/m3 (MO 26%, Mat 71%, Equip 3%)\n' +
    '- Zapatas acero fy=4200: S/3.91/kg (MO 31%, Mat 66%, Equip 3%)\n' +
    '- Cimientos corridos 1:10+30%PG: S/179.54/m3 (MO 37%, Mat 60%, Equip 3%)\n' +
    '- Columnas concreto f\'c=210: S/430.23/m3 (MO 48%, Mat 47%, Equip 5%)\n' +
    '- Columnas acero fy=4200: S/3.91/kg\n' +
    '- Columnas encofrado: S/57.79/m2\n' +
    '- Vigas concreto f\'c=210: S/316.78/m3 (MO 32%, Mat 64%, Equip 3%)\n' +
    '- Vigas encofrado: S/67.30/m2\n' +
    '- Losa aligerada concreto: S/311.28/m3\n' +
    '- Losa aligerada encofrado: S/41.70/m2\n' +
    '- Losa aligerada ladrillo 15x30x30: S/2.57/und\n' +
    '- Sobrecimiento concreto f\'c=175: S/264.21/m3\n' +
    '- Sobrecimiento encofrado: S/35.95/m2\n\n' +
    'APU ARQUITECTURA:\n' +
    '- Muros ladrillo KK soga: S/82.00/m2 (MO 39%, Mat 58%, Equip 3%)\n' +
    '- Tarrajeo interiores: S/32.50/m2 (MO 55%, Mat 42%, Equip 3%)\n' +
    '- Piso ceramico 45x45: S/62.00/m2 (MO 36%, Mat 61%, Equip 3%)\n' +
    '- Pintura latex interiores: S/21.00/m2 (MO 40%, Mat 57%, Equip 3%)\n' +
    '- Pintura latex exteriores: S/26.50/m2\n\n' +
    'APU TABIQUERIA DRYWALL (precios Lima 2025):\n' +
    '- Tabique simple DW 1/2" / 152mm: S/230/m2\n' +
    '- Tabique doble RF 2H / 152mm + aislante: S/267/m2\n' +
    '- Tabique sanitario RH 5/8" doble: S/267/m2\n' +
    '- Tabique una cara DW 1/2" / 60mm: S/160/m2\n' +
    '- Falso cielo raso DW 1/2" + perfileria 64mm: S/130/m2\n' +
    '- Plancha Durock 12.7mm sobre tabiques: S/240/m2\n' +
    '- Sello cortafuego RF: S/45/m2\n\n' +
    'APU INSTALACIONES ELECTRICAS:\n' +
    '- Salida centro de luz techo: S/75.39/pto (MO 66%, Mat 34%)\n' +
    '- Salida tomacorriente doble c/tierra: S/86.27/pto (MO 49%, Mat 49%)\n' +
    '- Tomacorriente a prueba de agua: S/95.86/pto\n' +
    '- Interruptor 1 golpe: S/13.21/und\n' +
    '- Interruptor 2 golpes: S/16.01/und\n' +
    '- Interruptor 3 golpes: S/18.62/und\n' +
    '- Tablero general 36 polos: S/1140.27/und\n' +
    '- Tablero 12 polos: S/523.42/und\n' +
    '- Tuberia PVC 20mm: S/10.62/ml\n' +
    '- Pozo puesta a tierra: S/683.60/und\n\n' +
    'APU INSTALACIONES SANITARIAS:\n' +
    '- Red agua fria PVC SAP 1/2": S/28.00/ml\n' +
    '- Red desague PVC SAL 4": S/35.00/ml\n' +
    '- Inodoro tanque bajo incluido instalacion: S/320.00/und\n' +
    '- Lavatorio incluido instalacion: S/280.00/und\n' +
    '- Ducha incluido instalacion: S/180.00/und\n\n' +
    'MATERIALES CLAVE 2026:\n' +
    '- Cemento Portland: S/28.00/bolsa\n' +
    '- Acero corrugado fy=4200: S/4.80/kg\n' +
    '- Arena gruesa: S/45.00/m3\n' +
    '- Piedra chancada 1/2": S/55.00/m3\n' +
    '- Ladrillo KK 18 huecos: S/0.85/und\n' +
    '- Madera tornillo: S/5.50/p2\n' +
    '- Alambre negro N°16: S/4.50/kg\n\n' +
    'REGLA CRITICA: La relacion manoObra vs materiales debe ser 35-45% MO y 50-60% materiales del costo total. ' +
    'NUNCA invertir esta proporcion. El total del presupuesto DEBE coincidir con la suma de subpartidas.\n';

  return 'Eres un ingeniero civil peruano experto en metrados y presupuestos CAPECO.\n\n' +
    'CIUDAD: ' + ciudad + ' | ZONA SISMICA: ' + zona + ' | TIPO OBRA: ' + tipoObra + ' | PISOS: ' + pisos + ' | ALTURA ENTREPISO: ' + altura + 'm\n\n' +
    precios +
    'INSTRUCCION CRITICA: ' + getInstruccionTipo(tipoPlano) + '\n\n' +
    'USA EXACTAMENTE los precios APU de arriba. No inventes precios. Todo en espanol.\n\n' +
    'Responde SOLO con JSON valido:\n' +
    '{"ciudad":"' + ciudad + '","zona":"' + zona + '","area":"XX m2","total":"S/ XX,XXX","partidas":[{"nombre":"NOMBRE","monto":"S/ XX,XXX","porcentaje":"XX%","subpartidas":[{"nombre":"Sub","unidad":"m3","metrado":1.0,"apu":{"manoObra":8.50,"materiales":2.50,"equipos":1.50},"detalle":[{"desc":"Desc","cant":"1.0 m3"}]}]}],"materiales":[{"categoria":"Cat","icono":"icon","items":[{"nombre":"Mat","cantidad":1,"unidad":"kg","precioUnit":4.80}]}]}';
}

export default function Procesando({ archivo, onDone, onBack, config, tipoPlano }: { archivo: any; onDone: (result: any) => void; onBack?: () => void; config?: any; tipoPlano?: string }) {
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const [errorTipo, setErrorTipo] = useState<'timeout' | 'imagen' | 'general'>('general');

  const ciudad = config?.ciudad || 'Lima';
  const tipoObra = config?.tipoObra || 'casa';
  const pisos = config?.pisos || 1;
  const altura = config?.altura || 2.40;
  const zona = ZONAS_SISMICAS[ciudad] || 'Zona 3';
  const tipo = tipoPlano || 'completo';

  useEffect(() => {
    const interval = setInterval(() => {
      setPaso(p => (p < pasos.length - 1 ? p + 1 : p));
    }, 600);

    const analizar = async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 45000)
      );

      const trabajoPromise = async () => {
        if (!API_KEY) throw new Error('API KEY no configurada - KEY: ' + API_KEY);
console.log('API KEY:', API_KEY?.substring(0, 10));

        const prompt = getPrompt(ciudad, tipoObra, pisos, zona, tipo, altura);
        let messages: any[];

        if (archivo?.tipo === 'imagen' && archivo?.uri) {
          const compressed = await ImageManipulator.manipulateAsync(
            archivo.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const base64 = compressed.base64 || '';
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

        const response = await fetch('https://presupia-api.alexisoficina42.workers.dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 8000,
            messages,
          }),
        });

        if (!response.ok) throw new Error('API_ERROR');

        const rawText = await response.text();
      
        const data = JSON.parse(rawText);
        const texto = data.content?.[0]?.text || '';

        if (!texto) throw new Error('RESPUESTA_VACIA');

        const match = texto.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('JSON_INVALIDO');

        const resultado = JSON.parse(match[0]);
        resultado.ciudad = ciudad;
        return resultado;
      };

      try {
        const resultado = await Promise.race([trabajoPromise(), timeoutPromise]);
        clearInterval(interval);
        onDone(resultado);
      } catch (e: any) {
        clearInterval(interval);
        const msg = e.message || '';
        if (msg === 'TIMEOUT') {
          setErrorTipo('timeout');
          setError('La IA tardo demasiado en responder. Intenta con una imagen mas clara o de menor tamano.');
        } else if (msg === 'JSON_INVALIDO' || msg === 'RESPUESTA_VACIA') {
          setErrorTipo('imagen');
          setError('No pudimos analizar la imagen. Intenta con una foto mas nitida y bien iluminada del plano.');
        } else {
          setErrorTipo('general');
          setError('Ocurrio un error inesperado. Verifica tu conexion e intenta de nuevo.');
        }
      }
    };

    analizar();
    return () => clearInterval(interval);
  }, []);

  if (error) {
    const icono = errorTipo === 'timeout' ? '⏱️' : errorTipo === 'imagen' ? '📷' : '⚠️';
    const titulo = errorTipo === 'timeout' ? 'Tiempo agotado' : errorTipo === 'imagen' ? 'Imagen no legible' : 'Error al procesar';
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.errorContainer}>
        <Text style={styles.logo}>PresupIA</Text>
        <Text style={styles.errorIcon}>{icono}</Text>
        <Text style={styles.errorTitle}>{titulo}</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        {onBack && (
          <TouchableOpacity style={styles.botonReintentar} onPress={onBack}>
            <Text style={styles.botonReintentarText}>{'<- Intentar de nuevo'}</Text>
          </TouchableOpacity>
        )}
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
      <Text style={styles.sub}>{'La IA esta analizando tu plano\nEsto puede tomar 20-40 segundos'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 600 },
  logo: { fontSize: 28, fontWeight: '800', color: '#00C896', marginBottom: 48 },
  spinner: { marginBottom: 32 },
  paso: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginBottom: 24 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D7DE' },
  dotActive: { backgroundColor: '#00C896' },
  sub: { fontSize: 13, color: '#5A6472', textAlign: 'center', lineHeight: 22 },
  errorIcon: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  errorMsg: { fontSize: 14, color: '#5A6472', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  botonReintentar: { backgroundColor: '#00C896', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  botonReintentarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});