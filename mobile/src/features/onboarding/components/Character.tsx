import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';

const { width } = Dimensions.get('window');

interface CharacterProps {
  walkingOut?: boolean;
  onArrive?: () => void;
  onExit?: () => void;
}

export default function Character({ walkingOut = false, onArrive, onExit }: CharacterProps) {
  const positionX = useRef(new Animated.Value(-80)).current;
  const bodyBob = useRef(new Animated.Value(0)).current;
  const legSwing = useRef(new Animated.Value(0)).current;
  const tailWag = useRef(new Animated.Value(0)).current;
  const walkLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startWalkAnimation = () => {
    walkLoop.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bodyBob, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(legSwing, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(tailWag, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(bodyBob, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(legSwing, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(tailWag, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
      ])
    );
    walkLoop.current.start();
  };

  const stopWalkAnimation = () => {
    walkLoop.current?.stop();
    bodyBob.setValue(0);
    legSwing.setValue(0);
    tailWag.setValue(0);
  };

  useEffect(() => {
    startWalkAnimation();
    Animated.timing(positionX, {
      toValue: width / 2 - 40,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      stopWalkAnimation();
      onArrive?.();
    });
  }, []);

  useEffect(() => {
    if (!walkingOut) return;
    startWalkAnimation();
    Animated.timing(positionX, {
      toValue: width + 80,
      duration: 2500,
      useNativeDriver: true,
    }).start(() => {
      stopWalkAnimation();
      onExit?.();
    });
  }, [walkingOut]);

  const bodyTranslateY = bodyBob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const frontLegX = legSwing.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });
  const backLegX = legSwing.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });
  const tailRotate = tailWag.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateX: positionX }] }]}>
      {/* Patas traseras */}
      <Animated.View style={[styles.leg, styles.legBackFar, { transform: [{ translateX: backLegX }] }]} />
      <Animated.View style={[styles.leg, styles.legBackNear, { transform: [{ translateX: backLegX }] }]} />

      {/* Patas delanteras */}
      <Animated.View style={[styles.leg, styles.legFrontFar, { transform: [{ translateX: frontLegX }] }]} />
      <Animated.View style={[styles.leg, styles.legFrontNear, { transform: [{ translateX: frontLegX }] }]} />

      {/* Cuerpo + cabeza, con rebote */}
      <Animated.View style={{ transform: [{ translateY: bodyTranslateY }] }}>
        {/* Cola */}
        <Animated.View style={[styles.tail, { transform: [{ rotate: tailRotate }] }]} />

        {/* Cuerpo */}
        <View style={styles.body} />

        {/* Cabeza */}
        <View style={styles.head}>
          <View style={styles.earBack} />
          <View style={styles.earFront} />
          <View style={styles.snout} />
          <View style={styles.eye} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const FUR = '#C98A4B';
const FUR_DARK = '#A56B34';
const SNOUT_COLOR = '#F3D9B1';

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 40,
    width: 90,
    height: 60,
  },
  body: {
    position: 'absolute',
    left: 10,
    top: 20,
    width: 50,
    height: 24,
    backgroundColor: FUR,
    borderRadius: 6,
  },
  head: {
    position: 'absolute',
    left: 48,
    top: 4,
    width: 28,
    height: 26,
    backgroundColor: FUR,
    borderRadius: 5,
  },
  earBack: {
    position: 'absolute',
    top: -6,
    left: 2,
    width: 8,
    height: 12,
    backgroundColor: FUR_DARK,
    borderRadius: 2,
  },
  earFront: {
    position: 'absolute',
    top: -6,
    left: 16,
    width: 8,
    height: 12,
    backgroundColor: FUR_DARK,
    borderRadius: 2,
  },
  snout: {
    position: 'absolute',
    top: 12,
    left: 22,
    width: 14,
    height: 10,
    backgroundColor: SNOUT_COLOR,
    borderRadius: 3,
  },
  eye: {
    position: 'absolute',
    top: 8,
    left: 18,
    width: 4,
    height: 4,
    backgroundColor: '#2A1A0F',
    borderRadius: 2,
  },
  tail: {
    position: 'absolute',
    left: 2,
    top: 18,
    width: 16,
    height: 6,
    backgroundColor: FUR_DARK,
    borderRadius: 3,
  },
  leg: {
    position: 'absolute',
    width: 8,
    height: 18,
    backgroundColor: FUR_DARK,
    borderRadius: 3,
    bottom: 0,
  },
  legBackFar: { left: 16 },
  legBackNear: { left: 26 },
  legFrontFar: { left: 52 },
  legFrontNear: { left: 62 },
});