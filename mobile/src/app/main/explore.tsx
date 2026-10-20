import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Estos tipos limitan las opciones disponibles para los filtros.
type Level = 'Todos' | 'Principiante' | 'Intermedio' | 'Avanzado';
type Category = 'Todas' | 'Tecnología' | 'Cultura' | 'Negocios';

// Cada artículo tiene los datos que necesitamos para mostrar la tarjeta
// y para encontrar su contenido en la pantalla del lector.
type Article = {
  id: number;
  title: string;
  category: Exclude<Category, 'Todas'>;
  level: Exclude<Level, 'Todos'>;
  minutes: number;
  vocabularyCount: number;
  description: string;
  paragraphs: string[];
};

// Por ahora los artículos están escritos aquí mismo.
// Más adelante podrías cargarlos desde una API o una base de datos.
const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'La revolución silenciosa del trabajo remoto',
    category: 'Tecnología',
    level: 'Intermedio',
    minutes: 5,
    vocabularyCount: 15,
    description:
      'Descubre cómo la comunicación digital ha cambiado la forma de trabajar.',
    paragraphs: [
      'Across urban centers and quiet coastal towns alike, a transformation has quietly taken hold. What began as an emergency response has blossomed into a permanent recalibration of daily life and work.',
      'Digital communication tools have become ubiquitous in modern offices, replacing quiet water-cooler conversations with synchronous chat threads, shared calendars, and video calls.',
      'For many people, remote work offers greater flexibility. It also asks workers to communicate clearly and create healthy boundaries between work and personal time.',
    ],
  },
  {
    id: 2,
    title: 'Cómo el café conecta culturas',
    category: 'Cultura',
    level: 'Principiante',
    minutes: 4,
    vocabularyCount: 10,
    description:
      'Una lectura breve sobre una bebida que forma parte de muchas culturas.',
    paragraphs: [
      'Coffee is one of the most popular drinks in the world. People enjoy it at home, at work, and in cafés with friends.',
      'Every country has its own coffee traditions. In some places, people drink a small cup quickly. In other places, they sit and talk for a long time.',
      'A simple cup of coffee can bring people together and start a conversation.',
    ],
  },
  {
    id: 3,
    title: 'Pequeñas empresas, grandes ideas',
    category: 'Negocios',
    level: 'Avanzado',
    minutes: 7,
    vocabularyCount: 18,
    description:
      'Conoce cómo las pequeñas empresas convierten ideas en proyectos.',
    paragraphs: [
      'Small businesses often begin with a simple idea and a clear understanding of what their community needs.',
      'Building a company requires patience. Owners have to manage money, listen to customers, and adapt when circumstances change.',
      'Although the journey can be challenging, a thoughtful plan can help a small business grow over time.',
    ],
  },
];

// Estos son los niveles y temas que aparecerán como botones de filtro.
const LEVELS: Level[] = [
  'Todos',
  'Principiante',
  'Intermedio',
  'Avanzado',
];

const CATEGORIES: Category[] = [
  'Todas',
  'Tecnología',
  'Cultura',
  'Negocios',
];

export default function ExploreScreen() {
  // useRouter permite cambiar de pantalla dentro de la app.
  const router = useRouter();

  // Estos estados recuerdan qué filtros seleccionó el usuario.
  const [selectedLevel, setSelectedLevel] = useState<Level>('Todos');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Todas');

  // Se muestran solo los artículos que coinciden con los filtros elegidos.
  const visibleArticles = ARTICLES.filter((article) => {
    const matchesLevel =
      selectedLevel === 'Todos' || article.level === selectedLevel;

    const matchesCategory =
      selectedCategory === 'Todas' ||
      article.category === selectedCategory;

    return matchesLevel && matchesCategory;
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado: explica qué encontrará el usuario en esta pantalla. */}
      <Text style={styles.eyebrow}>LECTURA INTERACTIVA</Text>
      <Text style={styles.title}>Elige una lectura</Text>
      <Text style={styles.subtitle}>
        Practica inglés con historias cortas según tu nivel e intereses.
      </Text>

      {/* Filtros de nivel. Al pulsar uno, actualizamos selectedLevel. */}
      <Text style={styles.sectionLabel}>TU NIVEL</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {LEVELS.map((level) => {
          const isSelected = selectedLevel === level;

          return (
            <Pressable
              key={level}
              onPress={() => setSelectedLevel(level)}
              style={[
                styles.filterButton,
                isSelected && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextSelected,
                ]}
              >
                {level}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filtros por tema: tecnología, cultura o negocios. */}
      <Text style={styles.sectionLabel}>TEMAS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;

          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.filterButton,
                isSelected && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextSelected,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Lista de artículos que sobrevivieron a los filtros. */}
      <Text style={styles.sectionLabel}>
        LECTURAS DISPONIBLES · {visibleArticles.length}
      </Text>

      {visibleArticles.length === 0 ? (
        // Mensaje para el caso en que los filtros no encuentren artículos.
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No hay lecturas con esos filtros</Text>
          <Text style={styles.emptyText}>
            Prueba seleccionando otro nivel o tema.
          </Text>
        </View>
      ) : (
        visibleArticles.map((article) => (
          // Pressable hace que toda la tarjeta responda al toque.
          <Pressable
            key={article.id}
            accessibilityRole="button"
            onPress={() =>
              // Abrimos /reader y pasamos el ID para que el lector
              // encuentre el artículo que se seleccionó.
              router.push({
                  pathname: '/reader',
                   params: {
                   topic: article.title,
                  level: article.level,
                 },
              })
            }
            style={({ pressed }) => [
              styles.articleCard,
              pressed && styles.articleCardPressed,
            ]}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.category}>
                {article.category.toUpperCase()}
              </Text>
              <Text style={styles.level}>{article.level}</Text>
            </View>

            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.description}>{article.description}</Text>

            <View style={styles.cardBottomRow}>
              <Text style={styles.articleInfo}>
                ⏱ {article.minutes} min
              </Text>
              <Text style={styles.articleInfo}>
                📚 {article.vocabularyCount} palabras
              </Text>
              <Text style={styles.readLink}>Leer →</Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// StyleSheet organiza los estilos de React Native en un solo lugar.
// No es CSS de una página web: sus propiedades se aplican a componentes nativos.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F5FF',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  eyebrow: {
    marginTop: 8,
    color: '#4435D1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 8,
    color: '#17182B',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: '#66677A',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 10,
    color: '#55566A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 6,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#E8E7FA',
  },
  filterButtonSelected: {
    backgroundColor: '#4435D1',
  },
  filterText: {
    color: '#33344A',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  articleCard: {
    marginTop: 12,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E5E3F5',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#24204D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  articleCardPressed: {
    opacity: 0.8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    color: '#4435D1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  level: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EFEDFF',
    color: '#4435D1',
    fontSize: 11,
    fontWeight: '700',
  },
  articleTitle: {
    marginTop: 15,
    color: '#191A30',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  description: {
    marginTop: 7,
    color: '#66677A',
    fontSize: 14,
    lineHeight: 21,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 17,
    flexWrap: 'wrap',
  },
  articleInfo: {
    color: '#66677A',
    fontSize: 12,
  },
  readLink: {
    marginLeft: 'auto',
    color: '#4435D1',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    color: '#191A30',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    color: '#66677A',
    fontSize: 14,
  },
});