import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import {
  getReadingHistory,
  ReadingHistoryEntry,
} from '@/features/reading/services/readingHistory';

export default function ReadingHistory() {
  const [attempts, setAttempts] = useState<ReadingHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Carga los intentos al mostrar este componente.
  useEffect(() => {
    getReadingHistory()
      .then(setAttempts)
      .catch((loadError) => {
        console.warn('No se pudo leer el historial:', loadError);
        setError('No se pudo cargar el historial.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <ActivityIndicator style={styles.message} />;
  }

  if (error) {
    return <Text style={styles.message}>{error}</Text>;
  }

  if (attempts.length === 0) {
    return <Text style={styles.message}>Aún no tienes lecturas completadas.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Tu progreso</Text>

      <FlatList
        data={attempts}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.detail}>
              {item.topic} · {item.level}
            </Text>
            <Text style={styles.score}>
              Resultado: {item.score} de {item.totalQuestions}
            </Text>
            <Text style={styles.date}>{item.completed_at}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  heading: {
    color: '#25233D',
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCD7FF',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  title: {
    color: '#25233D',
    fontSize: 17,
    fontWeight: '700',
  },
  detail: {
    color: '#66647A',
  },
  score: {
    color: '#4936D9',
    fontWeight: '700',
  },
  date: {
    color: '#77758A',
    fontSize: 12,
  },
  message: {
    color: '#66647A',
    padding: 16,
  },
});