// Expo Speech usa las voces disponibles en el dispositivo o navegador.
import * as Speech from 'expo-speech';

// Tipo de función que permite avisar si el audio está reproduciéndose.
type SpeakingStateCallback = (isSpeaking: boolean) => void;

// Pronuncia una palabra o un texto en inglés.
export async function speakEnglish(
  text: string,
  onSpeakingStateChange?: SpeakingStateCallback,
) {
  const textToSpeak = text.trim();

  // No intenta reproducir un texto vacío.
  if (!textToSpeak) return;

  // Detiene cualquier audio anterior para que no se superponga.
  await Speech.stop();

  // Indica a la pantalla que comenzó la reproducción.
  onSpeakingStateChange?.(true);

  Speech.speak(textToSpeak, {
    language: 'en-US',
    rate: 0.85,

    // Avisa a la pantalla cuando el audio termina, se detiene o falla.
    onDone: () => onSpeakingStateChange?.(false),
    onStopped: () => onSpeakingStateChange?.(false),
    onError: () => onSpeakingStateChange?.(false),
  });
}

// Detiene el audio y actualiza el botón de reproducción en la pantalla.
export async function stopSpeaking(
  onSpeakingStateChange?: SpeakingStateCallback,
) {
  await Speech.stop();
  onSpeakingStateChange?.(false);
}

// Detiene el audio sin actualizar estados.
// Se usa al salir de la pantalla para evitar actualizar un componente desmontado.
export async function stopSpeech() {
  await Speech.stop();
}