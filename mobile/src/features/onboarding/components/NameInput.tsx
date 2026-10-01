import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';

interface NameInputProps {
  onSubmit: (name: string) => void;
}

export default function NameInput({ onSubmit }: NameInputProps) {
  const [name, setName] = useState('');

  const canContinue = name.trim().length > 0;

  const handlePress = () => {
    if (canContinue) {
      onSubmit(name.trim());
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Escribe tu nombre..."
        value={name}
        onChangeText={setName}
        onSubmitEditing={handlePress}
        maxLength={20}
      />
      <Pressable
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={!canContinue}
      >
        <Text style={styles.buttonText}>CONTINUAR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    gap: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});