import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import WelcomeScreen from '../features/onboarding/screens/WelcomeScreen';
import { useUser } from '@/context/UserContext';

export default function Index() {
  const router = useRouter();
  const { userName, isLoading } = useUser();
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);

  useEffect(() => {
    // Espera a que AsyncStorage termine de revisar si ya hay un nombre guardado.
    if (isLoading || isReturningUser !== null) return;

    const hasSavedUser = Boolean(userName);
    setIsReturningUser(hasSavedUser);

    // Solo quienes ya habían completado la bienvenida van directo a Inicio.
    if (hasSavedUser) {
      router.replace('/main');
    }
  }, [isLoading, isReturningUser, router, userName]);

  if (isLoading || isReturningUser === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isReturningUser) {
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