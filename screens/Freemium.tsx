import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';

const CULQI_PUBLIC_KEY = process.env.EXPO_PUBLIC_CULQI_PUBLIC_KEY || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface Props {
  onBack: () => void;
  onPagoExitoso: () => void;
  deviceId: string;
}

export default function Freemium({ onBack, onPagoExitoso, deviceId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePago = async () => {
    setLoading(true);
    setError('');
    try {
      // Abrir Culqi checkout
      const { Culqi } = await import('culqi-react-native');
      Culqi.setPublicKey(CULQI_PUBLIC_KEY);
      const token = await Culqi.createToken({
        amount: 2990,
        currency: 'PEN',
        description: 'PresupIA Pro - 1 mes',
        email: '',
      });

      if (token?.id) {
        // Llamar a Edge Function para procesar el pago
        const res = await fetch(`${SUPABASE_URL}/functions/v1/culqi-charge-presupia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            token: token.id,
            device_id: deviceId,
            amount: 2990,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onPagoExitoso();
        } else {
          setError(data.error || 'Error al procesar el pago');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={s.titulo}>PresupIA Pro</Text>
      <Text style={s.subtitulo}>Has usado tus 3 análisis gratuitos</Text>

      <View style={s.card}>
        <Text style={s.precio}>S/ 29.90</Text>
        <Text style={s.periodo}>/mes</Text>
        <View style={s.beneficios}>
          <Text style={s.beneficio}>✅ Análisis ilimitados</Text>
          <Text style={s.beneficio}>✅ Claude Opus (máxima precisión)</Text>
          <Text style={s.beneficio}>✅ Historial de presupuestos</Text>
          <Text style={s.beneficio}>✅ Exportar PDF ilimitado</Text>
          <Text style={s.beneficio}>✅ Lista de materiales completa</Text>
          <Text style={s.beneficio}>✅ Soporte prioritario</Text>
        </View>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.btnPago} onPress={handlePago} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#0D1117" />
          : <Text style={s.btnPagoText}>💳 Suscribirse ahora</Text>
        }
      </TouchableOpacity>

      <Text style={s.nota}>Pago seguro con Culqi. Cancela cuando quieras.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { color: '#00C896', fontSize: 16 },
  titulo: { fontSize: 32, fontWeight: '800', color: '#E6EDF3', marginBottom: 8 },
  subtitulo: { fontSize: 15, color: '#8B949E', marginBottom: 32 },
  card: { backgroundColor: '#161B22', borderRadius: 20, padding: 24, borderWidth: 2, borderColor: '#00C896', marginBottom: 24 },
  precio: { fontSize: 48, fontWeight: '800', color: '#00C896' },
  periodo: { fontSize: 16, color: '#8B949E', marginBottom: 20 },
  beneficios: { gap: 10 },
  beneficio: { fontSize: 15, color: '#E6EDF3' },
  error: { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btnPago: { backgroundColor: '#00C896', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  btnPagoText: { fontSize: 18, fontWeight: '800', color: '#0D1117' },
  nota: { fontSize: 12, color: '#8B949E', textAlign: 'center' },
});
