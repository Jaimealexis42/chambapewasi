import React, { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView
} from "react-native";

const REGIONES = [
  "Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca",
  "Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad",
  "Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco",
  "Piura","Puno","San Martín","Tacna","Tumbes","Ucayali"
];

const TIPOS_OBRA = [
  { id: "casa", label: "🏠 Casa" },
  { id: "departamento", label: "🏢 Departamento" },
  { id: "local", label: "🏪 Local comercial" },
  { id: "oficina", label: "💼 Oficina" },
  { id: "almacen", label: "🏭 Almacén" },
];

interface Props {
  onBack: () => void;
  onGuardar?: (config: any) => void;
}

export default function Configuracion({ onBack, onGuardar }: Props) {
  const [ciudad, setCiudad] = useState("Lima");
  const [pisos, setPisos] = useState(1);
  const [tipoObra, setTipoObra] = useState("casa");
  const [guardado, setGuardado] = useState(false);

  const guardar = async () => {
  await AsyncStorage.setItem('pres_config', JSON.stringify({ ciudad, pisos, tipoObra }));
  if (onGuardar) onGuardar({ ciudad, pisos, tipoObra });
  setGuardado(true);
  setTimeout(() => { setGuardado(false); onBack(); }, 1000);
};

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => onBack()} style={s.backBtn}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.titulo}>⚙️ Configuración</Text>
        </View>

        <Text style={s.seccion}>📍 Ciudad / Región</Text>
        <View style={s.grid}>
          {REGIONES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.chip, ciudad === r && s.chipActivo]}
              onPress={() => setCiudad(r)}
            >
              <Text style={[s.chipText, ciudad === r && s.chipTextActivo]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.seccion}>🏗️ Número de pisos</Text>
        <View style={s.pisosRow}>
          {[1,2,3,4,5,6,7].map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.pisoBtn, pisos === p && s.pisoBtnActivo]}
              onPress={() => setPisos(p)}
            >
              <Text style={[s.pisoBtnText, pisos === p && s.pisoBtnTextActivo]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.seccion}>🔨 Tipo de obra</Text>
        {TIPOS_OBRA.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[s.tipoBtn, tipoObra === t.id && s.tipoBtnActivo]}
            onPress={() => setTipoObra(t.id)}
          >
            <Text style={[s.tipoBtnText, tipoObra === t.id && s.tipoBtnTextActivo]}>{t.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.guardarBtn} onPress={guardar}>
          <Text style={s.guardarText}>{guardado ? "✅ Guardado" : "Guardar configuración"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1117" },
  content: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 32, gap: 16 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#161B22", borderRadius: 10 },
  backText: { color: "#8B949E", fontSize: 14 },
  titulo: { fontSize: 22, fontWeight: "800", color: "#E6EDF3" },
  seccion: { fontSize: 15, fontWeight: "700", color: "#00C896", marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#161B22", borderWidth: 1, borderColor: "#30363D" },
  chipActivo: { backgroundColor: "#00C896", borderColor: "#00C896" },
  chipText: { fontSize: 12, color: "#8B949E" },
  chipTextActivo: { color: "#0D1117", fontWeight: "700" },
  pisosRow: { flexDirection: "row", gap: 10 },
  pisoBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#161B22", borderWidth: 1, borderColor: "#30363D", alignItems: "center", justifyContent: "center" },
  pisoBtnActivo: { backgroundColor: "#00C896", borderColor: "#00C896" },
  pisoBtnText: { fontSize: 16, fontWeight: "700", color: "#8B949E" },
  pisoBtnTextActivo: { color: "#0D1117" },
  tipoBtn: { padding: 16, borderRadius: 12, backgroundColor: "#161B22", borderWidth: 1, borderColor: "#30363D", marginBottom: 10 },
  tipoBtnActivo: { borderColor: "#00C896" },
  tipoBtnText: { fontSize: 15, color: "#8B949E" },
  tipoBtnTextActivo: { color: "#00C896", fontWeight: "700" },
  guardarBtn: { marginTop: 32, backgroundColor: "#00C896", borderRadius: 16, padding: 18, alignItems: "center" },
  guardarText: { fontSize: 16, fontWeight: "800", color: "#0D1117" },
});
