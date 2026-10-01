import React from 'react';
import { ImageBackground, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SceneBackground() {
  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
});