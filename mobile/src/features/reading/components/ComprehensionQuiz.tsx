import { Pressable, StyleSheet, Text, View } from 'react-native';

// Describe la información de cada pregunta que envía el backend.
type ComprehensionQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

// Indica qué información necesita recibir este componente.
type ComprehensionQuizProps = {
  questions: ComprehensionQuestion[];
  answers: Record<number, number>;
  onAnswer: (questionIndex: number, optionIndex: number) => void;
};

export default function ComprehensionQuiz({
  questions,
  answers,
  onAnswer,
}: ComprehensionQuizProps) {
  // Cuenta las preguntas que ya tienen una opción elegida.
  const answeredCount = questions.filter(
    (_, index) => answers[index] !== undefined,
  ).length;

  // Cuenta las respuestas correctas.
  const correctCount = questions.filter(
    (question, index) => answers[index] === question.correct_index,
  ).length;

  // No muestra una tarjeta vacía si no hay preguntas.
  if (questions.length === 0) return null;

  return (
    <View style={styles.quizCard}>
      <Text style={styles.quizTitle}>Comprueba lo que entendiste</Text>

      {questions.map((question, questionIndex) => {
        const selectedOption = answers[questionIndex];
        const hasAnswered = selectedOption !== undefined;
        const isCorrect = selectedOption === question.correct_index;

        return (
          <View key={`question-${questionIndex}`} style={styles.questionBlock}>
            <Text style={styles.questionText}>
              {questionIndex + 1}. {question.question}
            </Text>

            {question.options.map((option, optionIndex) => {
              const isSelected = selectedOption === optionIndex;
              const isRightAnswer = question.correct_index === optionIndex;

              return (
                <Pressable
                  key={`option-${questionIndex}-${optionIndex}`}
                  accessibilityRole="button"
                  onPress={() => onAnswer(questionIndex, optionIndex)}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                    hasAnswered && isRightAnswer && styles.correctOption,
                    hasAnswered && isSelected && !isCorrect && styles.incorrectOption,
                  ]}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              );
            })}

            {/* Después de responder, muestra el resultado y la explicación. */}
            {hasAnswered && (
              <Text
                style={[
                  styles.answerFeedback,
                  isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
                ]}
              >
                {isCorrect ? '¡Correcto!' : 'No es esa opción.'}{' '}
                {question.explanation}
              </Text>
            )}
          </View>
        );
      })}

      {/* Muestra la puntuación cuando todas las preguntas tienen respuesta. */}
      {answeredCount === questions.length && (
        <Text style={styles.quizScore}>
          Resultado: {correctCount} de {questions.length} correctas
        </Text>
      )}
    </View>
  );
}

// Estilos que pertenecen solo al cuestionario.
const styles = StyleSheet.create({
  quizCard: {
    marginTop: 8,
    marginBottom: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#DCD8FF',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  quizTitle: {
    marginBottom: 14,
    color: '#191A30',
    fontSize: 19,
    fontWeight: '800',
  },
  questionBlock: {
    marginBottom: 18,
  },
  questionText: {
    marginBottom: 9,
    color: '#292A3F',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  optionButton: {
    marginTop: 7,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCD8FF',
    borderRadius: 12,
    backgroundColor: '#F8F7FF',
  },
  selectedOption: {
    borderColor: '#4435D1',
  },
  correctOption: {
    borderColor: '#168A55',
    backgroundColor: '#E8F8EF',
  },
  incorrectOption: {
    borderColor: '#D64545',
    backgroundColor: '#FFF0F0',
  },
  optionText: {
    color: '#292A3F',
    fontSize: 14,
    lineHeight: 20,
  },
  answerFeedback: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
  },
  correctFeedback: {
    color: '#168A55',
  },
  incorrectFeedback: {
    color: '#B42323',
  },
  quizScore: {
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E6F5',
    color: '#4435D1',
    fontSize: 15,
    fontWeight: '800',
  },
});