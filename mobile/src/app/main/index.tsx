import ReadingHistory from '@/features/reading/components/ReadingHistory';

import { useUser } from '@/context/UserContext';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  getReadingHistory,
  getTodayStudySeconds,
} from '@/features/reading/services/readingHistory';

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

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function HomeScreen() {
  // Recupera el nombre que el usuario escribió durante la bienvenida.
  const { userName } = useUser();
  const router = useRouter();

  const [activeWeekDays, setActiveWeekDays] = useState<boolean[]>(
  Array(7).fill(false),
);
const [streakCount, setStreakCount] = useState(0);

const [todayStudySeconds, setTodayStudySeconds] = useState(0);

const dailyGoalSeconds = 20 * 60;
const progressPercent = Math.min(
  100,
  Math.floor((todayStudySeconds / dailyGoalSeconds) * 100),
);

const studiedTimeLabel =
  `${Math.floor(todayStudySeconds / 60)}:` +
  `${String(todayStudySeconds % 60).padStart(2, '0')} / 20 min`;

const minutesRemaining = Math.ceil(
  Math.max(0, dailyGoalSeconds - todayStudySeconds) / 60,
);


// Se actualiza al volver al Inicio, por ejemplo después de terminar una lectura.
useFocusEffect(
  useCallback(() => {
    let isScreenActive = true;

    async function loadWeeklyProgress() {
      try {
        const history = await getReadingHistory();
        const studySeconds = await getTodayStudySeconds();
        const completedDateKeys = new Set<string>();

        // SQLite guarda CURRENT_TIMESTAMP en UTC.
        // Lo convertimos a la fecha local del teléfono para marcar el día correcto.
        for (const attempt of history) {
          const timestamp = attempt.completed_at.includes('T')
            ? attempt.completed_at
            : `${attempt.completed_at.replace(' ', 'T')}Z`;

          const completedAt = new Date(timestamp);

          if (!Number.isNaN(completedAt.getTime())) {
            completedDateKeys.add(getLocalDateKey(completedAt));
          }
        }

        const today = new Date();
        const monday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

        const weekDateKeys = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + index);
          return getLocalDateKey(date);
        });

        // Cada círculo se activa si hubo un cuestionario completado ese día.
        const weekActivity = weekDateKeys.map((dateKey) =>
          completedDateKeys.has(dateKey),
        );

        // Si hoy todavía no hay actividad, calcula la racha hasta ayer.
        const streakCursor = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );

        if (!completedDateKeys.has(getLocalDateKey(streakCursor))) {
          streakCursor.setDate(streakCursor.getDate() - 1);
        }

        let consecutiveDays = 0;

        while (completedDateKeys.has(getLocalDateKey(streakCursor))) {
          consecutiveDays += 1;
          streakCursor.setDate(streakCursor.getDate() - 1);
        }

        if (isScreenActive) {
          setTodayStudySeconds(studySeconds);
          setActiveWeekDays(weekActivity);
          setStreakCount(consecutiveDays);
        }
      } catch (error) {
        console.error('No se pudo cargar la actividad semanal:', error);
      }
    }

    void loadWeeklyProgress();

    return () => {
      isScreenActive = false;
    };
  }, []),
);

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
          <Text style={styles.streakText}>
  {streakCount} {streakCount === 1 ? 'día' : 'días'}
</Text>
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
          
          <Text style={styles.goalPercent}>{progressPercent}%</Text>
        </View>

        <Text style={styles.goalTime}>{studiedTimeLabel}</Text>

        

<Text style={styles.goalDescription}>
  {progressPercent === 100
    ? '¡Meta diaria completada!'
    : `Te faltan ${minutesRemaining} min para alcanzar tu meta.`}
</Text>
        <Text style={styles.goalDescription}>
          Completa una actividad para empezar a registrar tu avance.
        </Text>

        {/* La barra está vacía hasta que conectemos el seguimiento. */}
        <View style={styles.progressTrack}>

          <View
  style={[
    styles.progressFill,
    { width: `${progressPercent}%` },
  ]}
/>

        </View>
      </View>

     {/* Resumen semanal calculado a partir del historial guardado en SQLite. */}
      <View style={styles.streakCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Racha semanal</Text>
          <Text style={styles.smallBadge}>¡Tú puedes!</Text>
        </View>
        <View style={styles.weekRow}>
  {WEEK_DAYS.map((day, index) => {
    const isActive = activeWeekDays[index] ?? false;

    return (
      <View key={`${day}-${index}`} style={styles.dayColumn}>
        <Text style={styles.dayLetter}>{day}</Text>
        <View
          style={[
            styles.dayCircle,
            isActive && styles.dayCircleActive,
          ]}
        >
          <Text
            style={[
              styles.dayIcon,
              isActive && styles.dayIconActive,
            ]}
          >
            {isActive ? '✓' : '○'}
          </Text>
        </View>
      </View>
    );
  })}
</View>
      </View>
      



      {/* Accesos visuales a las actividades que construiremos después. */}
      <Text style={styles.sectionTitle}>ELIGE TU PRÁCTICA</Text>

      <Pressable
  style={styles.activityCard}
  onPress={() => router.push('/main/explore')}
  accessibilityRole="button"
>
  <View style={[styles.activityIcon, { backgroundColor: '#E7E5FF' }]}>
    <Text style={styles.activityEmoji}>📚</Text>
  </View>

  <View style={styles.activityText}>
    <Text style={styles.activityTitle}>Reading</Text>
    <Text style={styles.activityDescription}>
      Lee historias y descubre palabras nuevas.
    </Text>
  </View>

  <Text style={styles.comingSoon}>ABRIR →</Text>
</Pressable>

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

      {/* Muestra los intentos de lectura guardados en SQLite. */}
      <ReadingHistory />
   
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

  dayCircleActive: {
  backgroundColor: COLORS.green,
},
dayIconActive: {
  color: '#FFFFFF',
  fontWeight: '800',
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