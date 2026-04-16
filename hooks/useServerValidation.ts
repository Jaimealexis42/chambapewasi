import { useState } from 'react';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface ValidationResult {
  permitido: boolean;
  razon?: string;
  analisisRestantes?: number;
}

export function useServerValidation() {
  const [validando, setValidando] = useState(false);
  const [error, setError] = useState('');

  const validarYRegistrarAnalisis = async (userId: string, deviceId: string): Promise<ValidationResult> => {
    setValidando(true);
    setError('');

    try {
      // Call Supabase Edge Function to validate freemium status server-side
      // This function should:
      // 1. Check if user is pro
      // 2. Check if they've used their free analyses
      // 3. Atomically increment the counter if free user
      // 4. Return validation result

      const response = await fetch(`${SUPABASE_URL}/functions/v1/validar-analisis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          user_id: userId,
          device_id: deviceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Error al validar análisis');
        return { permitido: false, razon: 'Error al validar con el servidor' };
      }

      const data = await response.json();
      return data;
    } catch (e: any) {
      const mensaje = 'Error de conexión al validar';
      setError(mensaje);
      return { permitido: false, razon: mensaje };
    } finally {
      setValidando(false);
    }
  };

  return {
    validando,
    error,
    validarYRegistrarAnalisis,
  };
}
