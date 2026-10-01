import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DialogueBoxProps {
  message: string;
  speed?: number; // milisegundos entre cada letra
}

export default function DialogueBox({ message, speed = 30 }: DialogueBoxProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  // Cada vez que cambia el mensaje, reiniciamos la animación desde cero
  useEffect(() => {
    setVisibleCount(0);

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= message.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [message]);

  const visibleText = message.slice(0, visibleCount);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{visibleText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 16,
    color: '#222222',
    textAlign: 'center',
  },
});