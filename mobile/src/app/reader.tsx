// Usa las voces disponibles en el dispositivo o navegador para leer en voz alta.
import * as Speech from 'expo-speech';

import ComprehensionQuiz from '@/features/reading/components/ComprehensionQuiz';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Dirección del backend local durante el desarrollo.
// En un teléfono físico o al publicar la app, esta dirección deberá cambiar.
const API_BASE_URL = 'http://127.0.0.1:8000';

// Nombre con el que guardamos las traducciones en el dispositivo.
const TRANSLATION_CACHE_KEY = 'translation_cache_v1';

// Describe una pregunta de comprensión recibida desde FastAPI.
type ComprehensionQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

// Describe la lectura generada por Gemini y enviada por el backend.
type Reading = {
  title: string;
  paragraphs: string[];
  questions: ComprehensionQuestion[];
  topic: string;
  level: string;
  model_used: string;
};

// Describe los datos que puede devolver el endpoint /translate.
type TranslationResponse = {
  translation?: string;
  detail?: string;
};

export default function ReaderScreen() {
  // Permite navegar hacia atrás usando Expo Router.
  const router = useRouter();

  // Recibe el tema y el nivel que envió la pantalla de lecturas.
  const { topic, level } = useLocalSearchParams<{
    topic?: string;
    level?: string;
  }>();

  // Usa valores predeterminados si la pantalla se abre sin parámetros.
  const selectedTopic = typeof topic === 'string' ? topic : 'Vida diaria';
  const selectedLevel = typeof level === 'string' ? level : 'Principiante';

  // Guarda el artículo que devuelve el backend.
  const [reading, setReading] = useState<Reading | null>(null);

  // Controla la carga y los errores al pedir una lectura.
  const [isLoading, setIsLoading] = useState(true);
  const [readingError, setReadingError] = useState('');

  // Al cambiar este número, el efecto solicita una lectura nueva.
  const [newReadingRequest, setNewReadingRequest] = useState(0);

  // Guarda las respuestas elegidas: número de pregunta → número de opción.
  // Por ejemplo, { 0: 1 } significa que eligió la segunda opción de la primera pregunta.
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // Guarda la palabra seleccionada y el resultado de su traducción.
  const [selectedWord, setSelectedWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [translationError, setTranslationError] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Indica si se está reproduciendo audio.
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Guarda las traducciones en memoria mientras la pantalla está abierta.
  const translationCacheRef = useRef<Record<string, string>>({});

  // Permite esperar a que termine la carga inicial de traducciones guardadas.
  const cacheLoadPromiseRef = useRef<Promise<void>>(Promise.resolve());

  // Al abrir el lector, carga las traducciones guardadas en el dispositivo.
  useEffect(() => {
    cacheLoadPromiseRef.current = (async () => {
      try {
        const savedCache = await AsyncStorage.getItem(
          TRANSLATION_CACHE_KEY,
        );

        if (!savedCache) return;

        const parsedCache: unknown = JSON.parse(savedCache);

        // Solo usamos la caché si los datos guardados son un objeto válido.
        if (
          parsedCache &&
          typeof parsedCache === 'object' &&
          !Array.isArray(parsedCache)
        ) {
          translationCacheRef.current =
            parsedCache as Record<string, string>;
        }
      } catch (error) {
        // Si falla la caché, la app sigue funcionando y puede consultar el backend.
        console.warn('No se pudo cargar la caché de traducciones:', error);
      }
    })();
  }, []);

  // Solicita una lectura al abrir la pantalla o al pulsar el botón "Otra".
  useEffect(() => {
    let isScreenActive = true;

    async function requestReading() {
      setIsLoading(true);
      setReadingError('');
      setReading(null);

      // Limpia los datos asociados a la lectura anterior.
      setSelectedWord('');
      setTranslation('');
      setTranslationError('');
      setQuizAnswers({});
      setIsSpeaking(false);

      // Detiene el audio anterior antes de empezar una lectura nueva.
      await Speech.stop();

      try {
        // Envía el tema y el nivel al endpoint POST /reading.
        const response = await fetch(`${API_BASE_URL}/reading`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: selectedTopic,
            level: selectedLevel,
          }),
        });

        const data = await response.json();

        // Convierte un error del backend en un mensaje para mostrar en pantalla.
        if (!response.ok) {
          throw new Error(data.detail ?? 'No se pudo generar la lectura.');
        }

        // Actualiza la pantalla solo si el lector sigue abierto.
        if (isScreenActive) {
          setReading(data as Reading);
        }
      } catch (error) {
        if (isScreenActive) {
          setReadingError(
            error instanceof Error
              ? error.message
              : 'Ocurrió un error al generar la lectura.',
          );
        }
      } finally {
        if (isScreenActive) {
          setIsLoading(false);
        }
      }
    }

    // Inicia la solicitud de forma asíncrona.
    void requestReading();

    // Evita actualizar el estado si se sale del lector durante la petición.
    return () => {
      isScreenActive = false;
    };
  }, [selectedTopic, selectedLevel, newReadingRequest]);

  // Detiene el audio si el usuario sale de la pantalla.
  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  // Reproduce en inglés la palabra o el texto recibido.
  async function speakEnglish(text: string) {
    const textToSpeak = text.trim();

    // No intenta reproducir texto vacío.
    if (!textToSpeak) return;

    // Detiene cualquier audio anterior para que no se superponga.
    await Speech.stop();

    setIsSpeaking(true);

    Speech.speak(textToSpeak, {
      language: 'en-US',
      rate: 0.85,

      // Actualiza el estado cuando el audio termina, se detiene o falla.
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  // Detiene manualmente el audio que esté reproduciéndose.
  async function stopSpeaking() {
    await Speech.stop();
    setIsSpeaking(false);
  }

  // Consulta el significado de una palabra en el contexto de su oración.
  async function translateWord(
    wordWithPunctuation: string,
    sentence: string,
  ) {
    // Elimina signos de puntuación antes de enviar la palabra al backend.
    const word = wordWithPunctuation
      .toLowerCase()
      .replace(/[^a-z']/g, '');

    if (!word) return;

    // Incluye la oración en la clave porque una palabra puede tener
    // distintos significados según el contexto.
    const cacheKey = `${word}|${sentence}`;

    setSelectedWord(word);
    setTranslation('');
    setTranslationError('');
    setIsTranslating(true);

    try {
      // Espera a que se carguen las traducciones guardadas en el dispositivo.
      await cacheLoadPromiseRef.current;

      // Si ya existe la traducción en caché, la muestra sin consultar al backend.
      const cachedTranslation = translationCacheRef.current[cacheKey];

      if (cachedTranslation) {
        setTranslation(cachedTranslation);
        return;
      }

      // Envía la palabra y su oración al endpoint POST /translate.
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word,
          sentence,
        }),
      });

      const data: TranslationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? 'No se pudo traducir la palabra.');
      }

      const result = data.translation ?? 'No recibimos una traducción.';
      setTranslation(result);

      // Agrega la traducción nueva a la caché y conserva las últimas 300.
      const entries = Object.entries({
        ...translationCacheRef.current,
        [cacheKey]: result,
      });

      const updatedCache = Object.fromEntries(
        entries.slice(-300),
      ) as Record<string, string>;

      translationCacheRef.current = updatedCache;

      // Guarda la caché para futuras visitas.
      try {
        await AsyncStorage.setItem(
          TRANSLATION_CACHE_KEY,
          JSON.stringify(updatedCache),
        );
      } catch (storageError) {
        // Aunque no se pueda guardar, la traducción ya se muestra en pantalla.
        console.warn('No se pudo guardar la traducción:', storageError);
      }
    } catch (error) {
      setTranslationError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al traducir.',
      );
    } finally {
      setIsTranslating(false);
    }
  }

  // Si el backend antiguo no envía preguntas, usamos una lista vacía.
  const questions = reading?.questions ?? [];


  return (
    <View style={styles.screen}>
      {/* Barra superior con botones para volver y generar otra lectura. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a las lecturas"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>‹ Volver</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Lector</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={() => setNewReadingRequest((current) => current + 1)}
          style={[styles.headerButton, isLoading && styles.disabledButton]}
        >
          <Text style={styles.headerButtonText}>↻ Otra</Text>
        </Pressable>
      </View>

      {isLoading ? (
        // Vista que aparece mientras Gemini genera la lectura.
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4435D1" />
          <Text style={styles.loadingText}>Creando una lectura nueva...</Text>
          <Text style={styles.loadingHint}>
            Tema: {selectedTopic} · Nivel: {selectedLevel}
          </Text>
        </View>
      ) : readingError ? (
        // Vista que aparece si el backend devuelve un error.
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>No pudimos crear la lectura</Text>
          <Text style={styles.errorMessage}>{readingError}</Text>

          <Pressable
            onPress={() => setNewReadingRequest((current) => current + 1)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Intentar de nuevo</Text>
          </Pressable>
        </View>
      ) : reading ? (
        // Contenido principal: lectura, cuestionario y traducción.
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>
            {reading.topic.toUpperCase()} · {reading.level.toUpperCase()}
          </Text>

          <Text style={styles.title}>{reading.title}</Text>

          {/* Indica que las palabras del artículo se pueden tocar. */}
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Toca cualquier palabra para consultar su significado en esta oración.
            </Text>
          </View>

          {/* Reproduce el título y todos los párrafos en inglés. */}
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              void speakEnglish(
                `${reading.title}. ${reading.paragraphs.join(' ')}`,
              )
            }
            style={styles.audioButton}
          >
            <Text style={styles.audioButtonText}>🔊 Escuchar lectura</Text>
          </Pressable>

          {/* Muestra el botón para detener el audio mientras se reproduce. */}
          {isSpeaking && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void stopSpeaking()}
              style={styles.stopAudioButton}
            >
              <Text style={styles.stopAudioButtonText}>⏹ Detener audio</Text>
            </Pressable>
          )}

          {/* Divide los párrafos en palabras individuales que se pueden tocar. */}
          {reading.paragraphs.map((paragraph, paragraphIndex) => (
            <Text
              key={`paragraph-${paragraphIndex}`}
              style={styles.paragraph}
            >
              {paragraph.split(' ').map((word, wordIndex) => {
                const cleanWord = word
                  .toLowerCase()
                  .replace(/[^a-z']/g, '');

                return (
                  <Text
                    key={`${paragraphIndex}-${wordIndex}`}
                    onPress={() => void translateWord(word, paragraph)}
                    style={[
                      styles.word,
                      selectedWord === cleanWord && styles.selectedWord,
                    ]}
                  >
                    {word}{' '}
                  </Text>
                );
              })}
            </Text>
          ))}

          
          {/* Este componente muestra las preguntas y recibe las respuestas guardadas aquí. */}
          <ComprehensionQuiz
            questions={questions}
            answers={quizAnswers}
            onAnswer={(questionIndex, optionIndex) =>
            setQuizAnswers((currentAnswers) => ({
                ...currentAnswers,
               [questionIndex]: optionIndex,
            }))
         }
/>

          {/* Muestra la traducción de la última palabra tocada. */}
          {selectedWord !== '' && (
            <View style={styles.translationCard}>
              <Text style={styles.translationLabel}>SIGNIFICADO</Text>
              <Text style={styles.translationWord}>{selectedWord}</Text>

              <Text style={styles.translationMeaning}>
                {isTranslating
                  ? 'Consultando a Gemini...'
                  : translationError || translation}
              </Text>

              {/* Reproduce la palabra seleccionada en inglés. */}
              <Pressable
                accessibilityRole="button"
                onPress={() => void speakEnglish(selectedWord)}
                style={styles.audioButton}
              >
                <Text style={styles.audioButtonText}>🔊 Escuchar palabra</Text>
              </Pressable>
            </View>
          )}

          {/* Identifica el modelo que generó la lectura. */}
          <Text style={styles.modelInfo}>
            Lectura generada con {reading.model_used}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

// Estilos visuales de las tarjetas, botones, preguntas y textos.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F5FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#EFEDFF',
  },
  headerButtonText: {
    color: '#4435D1',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    color: '#191A30',
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 850,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  eyebrow: {
    marginTop: 10,
    color: '#4435D1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: 14,
    color: '#191A30',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 36,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#EAE8FF',
  },
  tipIcon: {
    fontSize: 18,
  },
  tipText: {
    flex: 1,
    color: '#39366E',
    fontSize: 13,
    lineHeight: 19,
  },
  paragraph: {
    marginBottom: 18,
    color: '#292A3F',
    fontSize: 18,
    lineHeight: 30,
  },
  word: {
    textDecorationLine: 'underline',
    textDecorationColor: '#8177F5',
  },
  selectedWord: {
    backgroundColor: '#DCD8FF',
    color: '#3425C2',
  },


  // Apariencia de la tarjeta de traducción.
  translationCard: {
    marginTop: 4,
    padding: 17,
    borderWidth: 1,
    borderColor: '#DCD8FF',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  translationLabel: {
    color: '#4435D1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  translationWord: {
    marginTop: 6,
    color: '#191A30',
    fontSize: 20,
    fontWeight: '800',
  },
  translationMeaning: {
    marginTop: 5,
    color: '#66677A',
    fontSize: 15,
    lineHeight: 22,
  },

  // Apariencia de los botones de audio.
  audioButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#4435D1',
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stopAudioButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#E8E7FA',
  },
  stopAudioButtonText: {
    color: '#4435D1',
    fontSize: 13,
    fontWeight: '700',
  },

  // Texto pequeño que indica el modelo usado.
  modelInfo: {
    marginTop: 20,
    color: '#89899A',
    fontSize: 11,
  },

  // Estilos para las pantallas de carga y error.
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: '#191A30',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingHint: {
    marginTop: 7,
    color: '#66677A',
    fontSize: 13,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#191A30',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 9,
    marginBottom: 18,
    color: '#66677A',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#4435D1',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});