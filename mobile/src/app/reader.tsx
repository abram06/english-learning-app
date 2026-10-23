// Guarda localmente el resultado del cuestionario.
import { saveReadingAttempt } from '@/features/reading/services/readingHistory';

// Servicios de lectura, traducción y pronunciación.
import {
  fetchWordTranslation,
  generateReading,
} from '@/features/reading/services/readingApi';
import {
  speakEnglish,
  stopSpeaking,
  stopSpeech,
} from '@/features/reading/services/speech';

// Tipos y componentes de la función de lectura.
import type { Reading } from '@/features/reading/types';
import ComprehensionQuiz from '@/features/reading/components/ComprehensionQuiz';

// Herramientas de navegación y estado de React.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

// Guarda traducciones en el dispositivo.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Elementos visuales de React Native.
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Mantiene la pantalla dentro del área visible del teléfono,
// respetando la barra de estado, la cámara y los bordes seguros.
import { SafeAreaView } from 'react-native-safe-area-context';

// Clave usada para guardar la caché de traducciones en el dispositivo.
const TRANSLATION_CACHE_KEY = 'translation_cache_v1';

export default function ReaderScreen() {
  const router = useRouter();

  // Evita guardar dos veces el mismo resultado del cuestionario.
  const historySavedForCurrentReadingRef = useRef(false);

  // Obtiene el tema y nivel enviados desde la pantalla anterior.
  const { topic, level } = useLocalSearchParams<{
    topic?: string;
    level?: string;
  }>();

  // Usa valores predeterminados si la pantalla se abre sin parámetros.
  const selectedTopic = typeof topic === 'string' ? topic : 'Vida diaria';
  const selectedLevel = typeof level === 'string' ? level : 'Principiante';

  // Lectura que genera y devuelve el backend.
  const [reading, setReading] = useState<Reading | null>(null);

  // Estados para mostrar carga o errores.
  const [isLoading, setIsLoading] = useState(true);
  const [readingError, setReadingError] = useState('');

  // Cambiar este valor vuelve a solicitar una lectura.
  const [newReadingRequest, setNewReadingRequest] = useState(0);

  // Guarda la opción elegida para cada pregunta.
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // Estados de la palabra seleccionada y su traducción.
  const [selectedWord, setSelectedWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [translationError, setTranslationError] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Indica si el audio se está reproduciendo.
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Caché en memoria para acceder rápidamente a traducciones.
  const translationCacheRef = useRef<Record<string, string>>({});

  // Permite esperar a que AsyncStorage termine de cargar la caché.
  const cacheLoadPromiseRef = useRef<Promise<void>>(Promise.resolve());

  // Carga las traducciones guardadas al abrir el lector.
  useEffect(() => {
    cacheLoadPromiseRef.current = (async () => {
      try {
        const savedCache = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);

        if (!savedCache) return;

        const parsedCache: unknown = JSON.parse(savedCache);

        // Solo acepta un objeto válido como caché.
        if (
          parsedCache &&
          typeof parsedCache === 'object' &&
          !Array.isArray(parsedCache)
        ) {
          translationCacheRef.current =
            parsedCache as Record<string, string>;
        }
      } catch (error) {
        // Si falla la caché, se puede seguir consultando al backend.
        console.warn('No se pudo cargar la caché de traducciones:', error);
      }
    })();
  }, []);

  // Genera una lectura al abrir esta pantalla o pulsar «Otra».
  useEffect(() => {
    let isScreenActive = true;

    async function requestReading() {
      setIsLoading(true);
      setReadingError('');
      setReading(null);

      // Reinicia los datos que pertenecían a la lectura anterior.
      setQuizAnswers({});
      setSelectedWord('');
      setTranslation('');
      setTranslationError('');
      setIsSpeaking(false);
      historySavedForCurrentReadingRef.current = false;

      try {
        // Detiene el audio anterior antes de iniciar otra lectura.
        await stopSpeech();

        // Solicita la nueva lectura al backend.
        const data = await generateReading(selectedTopic, selectedLevel);

        // Evita actualizar la pantalla si el usuario ya salió de ella.
        if (isScreenActive) {
          setReading(data);
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

    void requestReading();

    // Invalida la solicitud si cambian los parámetros o se cierra la pantalla.
    return () => {
      isScreenActive = false;
    };
  }, [selectedTopic, selectedLevel, newReadingRequest]);

  // Detiene el audio cuando el usuario abandona el lector.
  useEffect(() => {
    return () => {
      void stopSpeech();
    };
  }, []);

  // Busca el significado de una palabra según la oración donde aparece.
  async function translateWord(
    wordWithPunctuation: string,
    sentence: string,
  ) {
    // Quita puntuación para enviar al backend solo la palabra.
    const word = wordWithPunctuation
      .toLowerCase()
      .replace(/[^a-z']/g, '');

    if (!word) return;

    // La oración forma parte de la clave porque da contexto al significado.
    const cacheKey = `${word}|${sentence}`;

    setSelectedWord(word);
    setTranslation('');
    setTranslationError('');
    setIsTranslating(true);

    try {
      // Espera a que termine la lectura inicial de la caché.
      await cacheLoadPromiseRef.current;

      // Muestra inmediatamente una traducción ya guardada.
      const cachedTranslation = translationCacheRef.current[cacheKey];

      if (cachedTranslation) {
        setTranslation(cachedTranslation);
        return;
      }

      // Si no existe en la caché, la solicita al backend.
      const result = await fetchWordTranslation(word, sentence);
      setTranslation(result);

      // Guarda la nueva traducción y conserva como máximo 300 entradas.
      const entries = Object.entries({
        ...translationCacheRef.current,
        [cacheKey]: result,
      });

      const updatedCache = Object.fromEntries(
        entries.slice(-300),
      ) as Record<string, string>;

      translationCacheRef.current = updatedCache;

      try {
        await AsyncStorage.setItem(
          TRANSLATION_CACHE_KEY,
          JSON.stringify(updatedCache),
        );
      } catch (storageError) {
        // La traducción ya se muestra aunque no se pueda guardar.
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

  // Cuando no hay preguntas, entrega una lista vacía al cuestionario.
  const questions = reading?.questions ?? [];

  // Recibe cada respuesta y guarda el intento al completar el cuestionario.
  async function handleQuizAnswer(
    questionIndex: number,
    optionIndex: number,
  ) {
    const updatedAnswers = {
      ...quizAnswers,
      [questionIndex]: optionIndex,
    };

    setQuizAnswers(updatedAnswers);

    if (!reading || reading.questions.length === 0) return;
    if (historySavedForCurrentReadingRef.current) return;

    // Comprueba que se hayan respondido todas las preguntas.
    const allQuestionsAnswered = reading.questions.every(
      (_, index) => updatedAnswers[index] !== undefined,
    );

    if (!allQuestionsAnswered) return;

    // Cuenta las respuestas que coinciden con el índice correcto.
    const score = reading.questions.filter(
      (question, index) =>
        updatedAnswers[index] === question.correct_index,
    ).length;

    // Marca el intento antes de guardar para evitar duplicados.
    historySavedForCurrentReadingRef.current = true;

    try {
      await saveReadingAttempt({
        title: reading.title,
        topic: reading.topic,
        level: reading.level,
        score,
        totalQuestions: reading.questions.length,
      });
    } catch (error) {
      // Permite volver a guardar si hubo un error de almacenamiento.
      historySavedForCurrentReadingRef.current = false;
      console.warn('No se pudo guardar el progreso:', error);
    }
  }

  return (
    // Un único SafeAreaView protege toda la pantalla, incluido el encabezado.
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Encabezado dentro del área segura del teléfono. */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a las lecturas"
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>‹ Volver</Text>
          </Pressable>
        </View>

        <Text style={styles.headerTitle}>Lector</Text>

        <View style={[styles.headerSide, styles.headerSideRight]}>
          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            onPress={() => setNewReadingRequest((current) => current + 1)}
            style={[
              styles.headerButton,
              isLoading && styles.disabledButton,
            ]}
          >
            <Text style={styles.headerButtonText}>↻ Otra</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        // Estado visible mientras Gemini genera la lectura.
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4435D1" />
          <Text style={styles.loadingText}>Creando una lectura nueva...</Text>
          <Text style={styles.loadingHint}>
            Tema: {selectedTopic} · Nivel: {selectedLevel}
          </Text>
        </View>
      ) : readingError ? (
        // Mensaje y botón para volver a intentar si la solicitud falla.
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>No pudimos crear la lectura</Text>
          <Text style={styles.errorMessage}>{readingError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => setNewReadingRequest((current) => current + 1)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Intentar de nuevo</Text>
          </Pressable>
        </View>
      ) : reading ? (
        // El ScrollView permite desplazarse por la lectura y el cuestionario.
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>
            {reading.topic.toUpperCase()} · {reading.level.toUpperCase()}
          </Text>

          <Text style={styles.title}>{reading.title}</Text>

          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Toca cualquier palabra para consultar su significado en esta
              oración.
            </Text>
          </View>

          {/* Lee en inglés el título y todos los párrafos de la lectura. */}
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              void speakEnglish(
                `${reading.title}. ${reading.paragraphs.join(' ')}`,
                setIsSpeaking,
              )
            }
            style={styles.audioButton}
          >
            <Text style={styles.audioButtonText}>🔊 Escuchar lectura</Text>
          </Pressable>

          {/* Este botón aparece únicamente mientras se reproduce el audio. */}
          {isSpeaking && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void stopSpeaking(setIsSpeaking)}
              style={styles.stopAudioButton}
            >
              <Text style={styles.stopAudioButtonText}>⏹ Detener audio</Text>
            </Pressable>
          )}

          {/* Cada palabra se puede tocar para pedir su significado contextual. */}
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

          {/* El cuestionario llama a handleQuizAnswer al tocar una opción. */}
          <ComprehensionQuiz
            questions={questions}
            answers={quizAnswers}
            onAnswer={handleQuizAnswer}
          />

          {/* Muestra la traducción de la última palabra seleccionada. */}
          {selectedWord !== '' && (
            <View style={styles.translationCard}>
              <Text style={styles.translationLabel}>SIGNIFICADO</Text>
              <Text style={styles.translationWord}>{selectedWord}</Text>

              <Text style={styles.translationMeaning}>
                {isTranslating
                  ? 'Consultando a Gemini...'
                  : translationError || translation}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  void speakEnglish(selectedWord, setIsSpeaking)
                }
                style={styles.audioButton}
              >
                <Text style={styles.audioButtonText}>🔊 Escuchar palabra</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.modelInfo}>
            Lectura generada con {reading.model_used}
          </Text>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

// Estilos de la pantalla, el encabezado, los textos y los botones.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F5FF',
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  headerSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerButton: {
    minHeight: 44,
    justifyContent: 'center',
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
    flex: 1,
    color: '#191A30',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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
  audioButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
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
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
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
  modelInfo: {
    marginTop: 20,
    color: '#89899A',
    fontSize: 11,
  },
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
    minHeight: 44,
    justifyContent: 'center',
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