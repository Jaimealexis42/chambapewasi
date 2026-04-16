import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Props {
  onRegistroExitoso: (userId: string, email: string) => void;
  onLogin: () => void;
  onBack: () => void;
}

export default function Registro({ onRegistroExitoso, onLogin, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificacionEnviada, setVerificacionEnviada] = useState(false);
  const [emailVerificando, setEmailVerificando] = useState('');

  const handleRegistro = async () => {
    if (!email.trim() || !password.trim() || !confirmar.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: 'com.presupia.app://verify-email',
        },
      });
      if (err) {
        if (err.message.includes('already registered')) {
          setError('Este correo ya tiene cuenta. Inicia sesión.');
        } else {
          setError('Error al crear cuenta. Intenta de nuevo.');
        }
        return;
      }
      if (data.user) {
        setVerificacionEnviada(true);
        setEmailVerificando(data.user.email || '');
      }
    } catch (e: any) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={s.logo}>PresupIA</Text>
        {verificacionEnviada ? (
          <>
            <Text style={s.titulo}>Verifica tu correo</Text>
            <Text style={s.subtitulo}>Hemos enviado un enlace de verificación</Text>
          </>
        ) : (
          <>
            <Text style={s.titulo}>Crear cuenta</Text>
            <Text style={s.subtitulo}>Gratis — activa tu plan Pro después</Text>
          </>
        )}

        {verificacionEnviada ? (
          <View style={s.form}>
            <View style={s.verificacionBox}>
              <Text style={s.verificacionIcon}>📧</Text>
              <Text style={s.verificacionTexto}>Hemos enviado un enlace de verificación a:</Text>
              <Text style={s.emailDestino}>{emailVerificando}</Text>
              <Text style={s.verificacionTexto}>Revisa tu bandeja de entrada (y spam) y haz clic en el enlace para verificar tu correo.</Text>
              <Text style={s.verificacionTexto}>Una vez verificado, podrás acceder a PresupIA sin restricciones.</Text>
            </View>
            <TouchableOpacity style={s.btnLogin} onPress={onLogin}>
              <Text style={s.btnLoginText}>← Volver a iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.form}>
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={s.input}
              placeholder="tucorreo@email.com"
              placeholderTextColor="#5A6472"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.label}>Contraseña</Text>
            <TextInput
              style={s.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#5A6472"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={s.label}>Confirmar contraseña</Text>
            <TextInput
              style={s.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#5A6472"
              value={confirmar}
              onChangeText={setConfirmar}
              secureTextEntry
            />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity style={s.btnRegistro} onPress={handleRegistro} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#0D1117" />
                : <Text style={s.btnRegistroText}>Crear cuenta</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.btnLogin} onPress={onLogin}>
              <Text style={s.btnLoginText}>¿Ya tienes cuenta? Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0D1117' },
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60, minHeight: 650 },
  backBtn: { marginBottom: 32 },
  backText: { color: '#00C896', fontSize: 16 },
  logo: { fontSize: 28, fontWeight: '800', color: '#00C896', marginBottom: 8 },
  titulo: { fontSize: 26, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#8B949E', marginBottom: 40 },
  form: { gap: 12 },
  label: { fontSize: 13, color: '#8B949E', fontWeight: '600', marginBottom: -4 },
  input: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#E6EDF3',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  error: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  btnRegistro: {
    backgroundColor: '#00C896',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnRegistroText: { fontSize: 16, fontWeight: '800', color: '#0D1117' },
  btnLogin: { alignItems: 'center', padding: 12 },
  btnLoginText: { color: '#00C896', fontSize: 14 },
  verificacionBox: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#00C896',
    alignItems: 'center',
  },
  verificacionIcon: { fontSize: 48, marginBottom: 16 },
  verificacionTexto: { fontSize: 14, color: '#8B949E', lineHeight: 22, marginBottom: 12, textAlign: 'center' },
  emailDestino: { fontSize: 15, fontWeight: '600', color: '#00C896', marginBottom: 16 },
});
