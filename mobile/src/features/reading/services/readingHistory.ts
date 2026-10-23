import * as SQLite from 'expo-sqlite';

// Describe los datos de una lectura que se guardarán en el historial.
export type ReadingAttempt = {
  title: string;
  topic: string;
  level: string;
  score: number;
  totalQuestions: number;
};

// Abre o crea el archivo de la base de datos local.
const databasePromise = SQLite.openDatabaseAsync('english-learning.db');

// Crea la tabla si todavía no existe.
async function getDatabase() {
  const database = await databasePromise;

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS reading_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      level TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return database;
}

// Guarda el resultado de una lectura completada.
export async function saveReadingAttempt(attempt: ReadingAttempt) {
  const database = await getDatabase();

  // Los signos ? son parámetros; SQLite coloca ahí los valores de forma segura.
  await database.runAsync(
    `INSERT INTO reading_history
      (title, topic, level, score, total_questions)
     VALUES (?, ?, ?, ?, ?)`,
    attempt.title,
    attempt.topic,
    attempt.level,
    attempt.score,
    attempt.totalQuestions,
  );
}
// Representa un intento guardado en SQLite, incluida su fecha.
export type ReadingHistoryEntry = ReadingAttempt & {
  id: number;
  completed_at: string;
};

// Lee el historial y devuelve primero los intentos más recientes.
export async function getReadingHistory(): Promise<ReadingHistoryEntry[]> {
  const database = await getDatabase();

  return database.getAllAsync<ReadingHistoryEntry>(`
    SELECT id, title, topic, level, score,
           total_questions, completed_at
    FROM reading_history
    ORDER BY completed_at DESC, id DESC
  `);
}

