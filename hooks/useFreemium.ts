import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_GRATIS = 3;
const KEY_ANALISIS = 'presupia_analisis_usados';
const KEY_ES_PRO = 'presupia_es_pro';
const KEY_DEVICE_ID = 'presupia_device_id';

function generateDeviceId() {
  return 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function useFreemium() {
  const [analisisUsados, setAnalisisUsados] = useState(0);
  const [esPro, setEsPro] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstado();
  }, []);

  const cargarEstado = async () => {
    try {
      const [usados, pro, id] = await Promise.all([
        AsyncStorage.getItem(KEY_ANALISIS),
        AsyncStorage.getItem(KEY_ES_PRO),
        AsyncStorage.getItem(KEY_DEVICE_ID),
      ]);

      setAnalisisUsados(parseInt(usados || '0'));
      setEsPro(pro === 'true');

      if (id) {
        setDeviceId(id);
      } else {
        const nuevoId = generateDeviceId();
        await AsyncStorage.setItem(KEY_DEVICE_ID, nuevoId);
        setDeviceId(nuevoId);
      }
    } catch (e) {
      console.error('Error cargando freemium:', e);
    } finally {
      setCargando(false);
    }
  };

  const puedeAnalizar = esPro || analisisUsados < MAX_GRATIS;
  const analisisRestantes = Math.max(0, MAX_GRATIS - analisisUsados);

  const registrarAnalisis = async () => {
    if (!esPro) {
      const nuevos = analisisUsados + 1;
      setAnalisisUsados(nuevos);
      await AsyncStorage.setItem(KEY_ANALISIS, String(nuevos));
    }
  };

  const activarPro = async () => {
    setEsPro(true);
    await AsyncStorage.setItem(KEY_ES_PRO, 'true');
  };

  return {
    analisisUsados,
    analisisRestantes,
    esPro,
    deviceId,
    cargando,
    puedeAnalizar,
    registrarAnalisis,
    activarPro,
  };
}
