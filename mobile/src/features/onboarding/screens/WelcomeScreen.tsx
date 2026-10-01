import SceneBackground from '../components/SceneBackground';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Character from '../components/Character';
import DialogueBox from '../components/DialogueBox';
import NameInput from '../components/NameInput';

import {useUser} from '@/context/UserContext';


type Stage =
  | 'walking-in'
  | 'greeting'
  | 'asking-name'
  | 'personalized-greeting'
  | 'walking-out';

export default function WelcomeScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('walking-in');

  const {userName , setUserName} = useUser();  

  // greeting → asking-name (después de 2.5 s)
  useEffect(() => {
    if (stage !== 'greeting') return;
    const timer = setTimeout(() => setStage('asking-name'), 2500);
    return () => clearTimeout(timer);
  }, [stage]);

  // personalized-greeting → walking-out (después de 3 s)
  useEffect(() => {
    if (stage !== 'personalized-greeting') return;
    const timer = setTimeout(() => setStage('walking-out'), 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  const handleArrive = () => setStage('greeting');

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setStage('personalized-greeting');
  };

  const handleExit = () => {
    router.replace('/main');
  };

  return (
    <View style={styles.container}>
      
      <SceneBackground />

        <Character
        walkingOut={stage === 'walking-out'}
        onArrive={handleArrive}
        onExit={handleExit}
      />


      <Character
        walkingOut={stage === 'walking-out'}
        onArrive={handleArrive}
        onExit={handleExit}
      />

      {stage === 'greeting' && (
        <DialogueBox message="¡Hola! 👋 Bienvenido a tu aventura para aprender inglés." />
      )}

      {stage === 'asking-name' && (
        <>
          <DialogueBox message="¿Cómo te llamas?" />
          <NameInput onSubmit={handleNameSubmit} />
        </>
      )}

      {(stage === 'personalized-greeting' || stage === 'walking-out') && (
        <DialogueBox
          message={`¡Hola, ${userName}! 🎉 Acompáñame en esta aventura donde aprenderemos inglés juntos.`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});