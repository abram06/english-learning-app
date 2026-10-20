import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '@/context/UserContext';

// Colores que usaremos en esta pantalla.
const COLORS = {
  background: '#F6F4FF',
  card: '#FFFFFF',
  primary: '#4338CA',
  primaryLight: '#E8E7FF',
  text: '#17172B',
  secondaryText: '#68687D',
  green: '#22C55E',
  border: '#E7E5F4',
};

export default function HomeScreen() {
  // Recupera el nombre que el usuario escribió durante la bienvenida.
  const { userName } = useUser();

  return (
    // ScrollView permite desplazar la pantalla en teléfonos pequeños.
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado: identidad de la app y racha actual. */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <Text style={styles.dog}>🐶</Text>
          <View>
            <Text style={styles.brandName}>Aprendiendo</Text>
            <Text style={styles.brandSubtitle}>y Jugando</Text>
          </View>
        </View>

        <View style={styles.streakBadge}>
          <Text>🔥</Text>
          <Text style={styles.streakText}>0 días</Text>
        </View>
      </View>

      {/* Saludo personalizado y nivel inicial. */}
      <Text style={styles.eyebrow}>TU AVENTURA DE HOY</Text>
      <Text style={styles.title}>¡Hola, {userName || 'estudiante'}!</Text>
      <Text style={styles.subtitle}>
        Cada palabra nueva te acerca más al inglés.
      </Text>

      {/* Tarjeta de meta diaria. El progreso empieza en cero por ahora. */}
      <View style={styles.goalCard}>
        <View style={styles.goalTopRow}>
          <Text style={styles.goalLabel}>🎯 Meta diaria</Text>
          <Text style={styles.goalPercent}>0%</Text>
        </View>

        <Text style={styles.goalTime}>0 / 20 min</Text>
        <Text style={styles.goalDescription}>
          Completa una actividad para empezar a registrar tu avance.
        </Text>

        {/* La barra está vacía hasta que conectemos el seguimiento. */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      {/* Resumen semanal de actividad. Todavía no guarda días completados. */}
      <View style={styles.streakCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Racha semanal</Text>
          <Text style={styles.smallBadge}>¡Tú puedes!</Text>
        </View>

        <View style={styles.weekRow}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
            <View key={`${day}-${index}`} style={styles.dayColumn}>
              <Text style={styles.dayLetter}>{day}</Text>
              <View style={styles.dayCircle}>
                <Text style={styles.dayIcon}>○</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Accesos visuales a las actividades que construiremos después. */}
      <Text style={styles.sectionTitle}>ELIGE TU PRÁCTICA</Text>

      <View style={styles.activityCard}>
        <View style={[styles.activityIcon, { backgroundColor: '#E7E5FF' }]}>
          <Text style={styles.activityEmoji}>📚</Text>
        </View>
        <View style={styles.activityText}>
          <Text style={styles.activityTitle}>Lecturas</Text>
          <Text style={styles.activityDescription}>
            Lee historias y descubre palabras nuevas.
          </Text>
        </View>
        <Text style={styles.comingSoon}>PRÓXIMAMENTE</Text>
      </View>

      <View style={styles.activityCard}>
        <View style={[styles.activityIcon, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.activityEmoji}>✍️</Text>
        </View>
        <View style={styles.activityText}>
          <Text style={styles.activityTitle}>Escritura</Text>
          <Text style={styles.activityDescription}>
            Practica escribir en inglés y mejora poco a poco.
          </Text>
        </View>
        <Text style={styles.comingSoon}>PRÓXIMAMENTE</Text>
      </View>
    </ScrollView>
  );
}

// StyleSheet organiza la apariencia sin mezclarla con la estructura del contenido.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 88, // Deja espacio para la barra web que actualmente está arriba.
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 10,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dog: {
    fontSize: 30,
  },
  brandName: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: COLORS.secondaryText,
    fontSize: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE8C2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  streakText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.secondaryText,
    fontSize: 14,
    marginBottom: 8,
  },
  goalCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 22,
    marginTop: 4,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  goalPercent: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  goalTime: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 12,
  },
  goalDescription: {
    color: '#E7E7FF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#7770E5',
    borderRadius: 8,
    marginTop: 16,
  },
  progressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 8,
  },
  streakCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  smallBadge: {
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 7,
  },
  dayLetter: {
    color: COLORS.secondaryText,
    fontSize: 12,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIcon: {
    color: COLORS.primary,
    fontSize: 18,
  },
  sectionTitle: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 2,
  },
  activityCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: {
    fontSize: 21,
  },
  activityText: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  activityDescription: {
    color: COLORS.secondaryText,
    fontSize: 12,
    lineHeight: 17,
  },
  comingSoon: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
  },
});