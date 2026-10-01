import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import WelcomeScreen from '../features/onboarding/screens/WelcomeScreen';
import { useUser } from '@/context/UserContext';

export default function Index() {
  const router = useRouter();
  const { userName, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && userName) {
      router.replace('/main');
    }
  }, [isLoading, userName]);

  // Mientras leemos el storage, no mostramos nada todavía (evita parpadeos)
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Si ya había un nombre guardado, este componente ya va camino a /main
  // (por el useEffect de arriba), así que no mostramos el onboarding
  if (userName) {
    return null;
  }

  return <WelcomeScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});