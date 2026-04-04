import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import SubirPlano from './screens/SubirPlano';
import TipoPlano from './screens/TipoPlano';
import Procesando from './screens/Procesando';
import Resultado from './screens/Resultado';
import Historial from './screens/Historial';
import ListaCompras from './screens/ListaCompras';
import Configuracion from './screens/Configuracion';
import Freemium from './screens/Freemium';
import { useFreemium } from './hooks/useFreemium';

const SUPABASE_URL = 'https://tnrqdyagfecceeebocvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Vvbk0cnfSFVPDkIPwozgCg_UJT4BSrq';

async function guardarHistorial(deviceId: string, presupuesto: any) {
  try {
    await fetch(SUPABASE_URL + '/rest/v1/pres_historial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        device_id: deviceId,
        ciudad: presupuesto.ciudad,
        zona: presupuesto.zona,
        area: presupuesto.area,
        total: presupuesto.total,
        partidas: presupuesto.partidas,
        materiales: presupuesto.materiales || [],
      }),
    });
  } catch (e) {
    console.error('Error guardando historial:', e);
  }
}

export default function App() {
  const [pantalla, setPantalla] = useState('home');
  const [archivo, setArchivo] = useState<any>(null);
  const [tipoPlano, setTipoPlano] = useState('completo');
  const [presupuesto, setPresupuesto] = useState<any>(null);
  const [idioma, setIdioma] = useState<'es' | 'en'>('es');
  const [config, setConfig] = useState({ ciudad: 'Lima', pisos: 1, tipoObra: 'casa' });
  const { puedeAnalizar, analisisRestantes, esPro, deviceId, registrarAnalisis, activarPro } = useFreemium();

  const t = {
    es: {
      titulo: 'PresupIA',
      tagline: 'Presupuestos de construccion con IA',
      analizar: 'Analizar plano',
      subtext: 'Sube una foto o PDF de tu plano',
      regiones: 'Regiones',
      norma: 'Norma 2026',
      powered: 'IA Powered',
      ultimos: 'Ultimos presupuestos',
      historial: 'Ver historial ->',
      vacio: 'Aun no tienes presupuestos\nSube tu primer plano para empezar',
    },
    en: {
      titulo: 'PresupIA',
      tagline: 'AI-powered construction budgets',
      analizar: 'Analyze plan',
      subtext: 'Upload a photo or PDF of your plan',
      regiones: 'Regions',
      norma: 'Standard 2026',
      powered: 'AI Powered',
      ultimos: 'Recent budgets',
      historial: 'View history ->',
      vacio: 'No budgets yet\nUpload your first plan to start',
    },
  }[idioma];

  if (pantalla === 'subir') return (
    <SubirPlano
      onBack={() => setPantalla('home')}
      onSubir={(arch) => { setArchivo(arch); setPantalla('tipoplano'); }}
    />
  );

  if (pantalla === 'tipoplano') return (
    <TipoPlano
      onBack={() => setPantalla('subir')}
      onSeleccionar={(tipo) => { setTipoPlano(tipo); setPantalla('procesando'); }}
    />
  );

  if (pantalla === 'procesando') return (
    <Procesando
      archivo={archivo}
      config={config}
      tipoPlano={tipoPlano}
      onDone={(result) => { setPresupuesto(result); registrarAnalisis(); guardarHistorial(deviceId, result); setPantalla('resultado'); }}
    />
  );

  if (pantalla === 'freemium') return (
    <Freemium onBack={() => setPantalla('home')} onPagoExitoso={() => { activarPro(); setPantalla('home'); }} deviceId={deviceId} />
  );

  if (pantalla === 'configuracion') return (
    <Configuracion onBack={() => setPantalla('home')} onGuardar={(c: any) => setConfig(c)} />
  );

  if (pantalla === 'resultado') return (
    <Resultado presupuesto={presupuesto} onBack={() => setPantalla('home')} onListaCompras={() => setPantalla('listacompras')} />
  );

  if (pantalla === 'historial') return (
    <Historial onBack={() => setPantalla('home')} onVer={() => setPantalla('resultado')} />
  );

  if (pantalla === 'listacompras') return (
    <ListaCompras onBack={() => setPantalla('resultado')} datos={presupuesto} />
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <View style={styles.header}>
          <Text style={styles.logo}>{t.titulo}</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>
        <TouchableOpacity style={styles.idiomaBtn} onPress={() => setIdioma(idioma === 'es' ? 'en' : 'es')}>
          <Text style={styles.idiomaBtnText}>{idioma === 'es' ? 'EN' : 'ES'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.idiomaBtn} onPress={() => setPantalla('configuracion')}>
          <Text style={styles.idiomaBtnText}>Config</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => { if (puedeAnalizar) { setPantalla('subir'); } else { setPantalla('freemium'); } }}>
        <Text style={styles.btnPrimaryIcon}>+</Text>
        <Text style={styles.btnPrimaryText}>{t.analizar}</Text>
        <Text style={styles.btnPrimarySubtext}>{t.subtext}</Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>24</Text>
          <Text style={styles.statLabel}>{t.regiones}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>RNE</Text>
          <Text style={styles.statLabel}>{t.norma}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>AI</Text>
          <Text style={styles.statLabel}>{t.powered}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t.ultimos}</Text>
      {!esPro && (
        <View style={styles.freemiumBanner}>
          <Text style={styles.freemiumText}>
            {analisisRestantes > 0 ? (analisisRestantes + ' analisis gratis restantes') : 'Actualiza a Pro para continuar'}
          </Text>
          {analisisRestantes === 0 && (
            <TouchableOpacity onPress={() => setPantalla('freemium')}>
              <Text style={styles.freemiumBtn}>Ver planes</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.historialBtn} onPress={() => setPantalla('historial')}>
        <Text style={styles.historialBtnText}>{t.historial}</Text>
      </TouchableOpacity>
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{t.vacio}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 80 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 32, gap: 12 },
  header: { flex: 1 },
  logo: { fontSize: 32, fontWeight: '800', color: '#00C896', letterSpacing: -1 },
  tagline: { fontSize: 14, color: '#8B949E', marginTop: 4 },
  idiomaBtn: { backgroundColor: '#161B22', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#30363D' },
  idiomaBtnText: { fontSize: 13, color: '#E6EDF3', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#00C896', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  btnPrimaryIcon: { fontSize: 40, marginBottom: 8 },
  btnPrimaryText: { fontSize: 20, fontWeight: '700', color: '#0D1117' },
  btnPrimarySubtext: { fontSize: 13, color: '#0D1117', opacity: 0.7, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, backgroundColor: '#161B22', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#30363D' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#00C896' },
  statLabel: { fontSize: 11, color: '#8B949E', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },
  historialBtn: { marginBottom: 12 },
  historialBtnText: { color: '#00C896', fontSize: 14, fontWeight: '600' },
  emptyBox: { backgroundColor: '#161B22', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#30363D' },
  emptyText: { color: '#8B949E', textAlign: 'center', lineHeight: 22 },
  freemiumBanner: { backgroundColor: '#1A1200', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F0A500', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  freemiumText: { fontSize: 13, color: '#F0A500', flex: 1 },
  freemiumBtn: { fontSize: 13, color: '#00C896', fontWeight: '700', marginLeft: 8 },
});
