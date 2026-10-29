import * as Speech from 'expo-speech';

type SpeakingStateCallback = (isSpeaking: boolean) => void;

// Identifica la reproducción actual para ignorar avisos atrasados de audios anteriores.
let activeSpeechId = 0;

export async function speakEnglish(
  text: string,
  onSpeakingStateChange?: SpeakingStateCallback,
) {
  const textToSpeak = text.trim();
  if (!textToSpeak) return;

  // Cada llamada recibe un ID. Si comienza otra reproducción, esta queda obsoleta.
  const speechId = ++activeSpeechId;

  // Detiene el audio anterior. Su aviso "onStopped" no debe apagar el audio nuevo.
  await Speech.stop();

  if (speechId !== activeSpeechId) return;

  // Busca una voz inglesa instalada en este teléfono.
  const voices = await Speech.getAvailableVoicesAsync();
  const englishVoices = voices.filter((voice) =>
    voice.language.toLowerCase().startsWith('en'),
  );

  // Prefiere una voz inglesa específica como en-US-SMTf00;
  // si no está, utiliza la primera voz en inglés disponible.
  const englishVoice =
    englishVoices.find(
      (voice) =>
        voice.language.toLowerCase() === 'en-us' &&
        voice.identifier !== 'en-US-default',
    ) ?? englishVoices[0];



  onSpeakingStateChange?.(true);

  Speech.speak(textToSpeak, {
    language: englishVoice?.language ?? 'en-US',
    voice: englishVoice?.identifier,
    rate: 0.85,

    onDone: () => {
      if (speechId === activeSpeechId) {
        onSpeakingStateChange?.(false);
      }
    },
    onStopped: () => {
      if (speechId === activeSpeechId) {
        onSpeakingStateChange?.(false);
      }
    },
    onError: (error) => {
      console.error('Error de voz:', error);
      if (speechId === activeSpeechId) {
        onSpeakingStateChange?.(false);
      }
    },
  });
}

export async function stopSpeaking(
  onSpeakingStateChange?: SpeakingStateCallback,
) {
  // Invalida los avisos pendientes de la reproducción que estamos deteniendo.
  activeSpeechId += 1;
  await Speech.stop();
  onSpeakingStateChange?.(false);
}

export async function stopSpeech() {
  // Invalida cualquier aviso pendiente al salir de la pantalla.
  activeSpeechId += 1;
  await Speech.stop();
}