import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Props {
  onLoginExitoso: (userId: string, email: string) => void;
  onRegistro: () => void;
  onBack: () => void;
}

export default function Login({ onLoginExitoso, onRegistro, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (err) {
        if (err.message.includes('Invalid login')) {
          setError('Email o contraseña incorrectos');
        } else {
          setError('Error al iniciar sesión. Intenta de nuevo.');
        }
        return;
      }
      if (data.user) {
        onLoginExitoso(data.user.id, data.user.email || '');
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
        <Text style={s.titulo}>Iniciar sesión</Text>
        <Text style={s.subtitulo}>Para activar tu plan Pro</Text>

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
            placeholder="Tu contraseña"
            placeholderTextColor="#5A6472"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btnLogin} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0D1117" />
              : <Text style={s.btnLoginText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.btnRegistro} onPress={onRegistro}>
            <Text style={s.btnRegistroText}>¿No tienes cuenta? Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0D1117' },
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 60, minHeight: 600 },
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
  btnLogin: {
    backgroundColor: '#00C896',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnLoginText: { fontSize: 16, fontWeight: '800', color: '#0D1117' },
  btnRegistro: { alignItems: 'center', padding: 12 },
  btnRegistroText: { color: '#00C896', fontSize: 14 },
});
