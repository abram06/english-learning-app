import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/context/UserContext';

export default function HomeScreen() {
  const { userName } = useUser();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">🏠 Hola, {userName}</ThemedText>
      <ThemedText>Aquí irá el menú principal del curso.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});