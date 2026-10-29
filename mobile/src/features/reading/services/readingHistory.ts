import * as SQLite from 'expo-sqlite';

// Datos que guardamos cuando se completa un cuestionario.
export type ReadingAttempt = {
  title: string;
  topic: string;
  level: string;
  score: number;
  totalQuestions: number;
};

// Abre la base de datos local o la crea si aún no existe.
const databasePromise = SQLite.openDatabaseAsync('english-learning.db');

// Crea las tablas necesarias y devuelve la conexión a SQLite.
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

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_date TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0)
    );
  `);

  return database;
}

// Guarda el resultado de una lectura completada.
export async function saveReadingAttempt(attempt: ReadingAttempt) {
  const database = await getDatabase();

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

// Representa un intento guardado en SQLite.
export type ReadingHistoryEntry = ReadingAttempt & {
  id: number;
  completed_at: string;
};

// Lee los intentos guardados, empezando por el más reciente.
export async function getReadingHistory(): Promise<ReadingHistoryEntry[]> {
  const database = await getDatabase();

  return database.getAllAsync<ReadingHistoryEntry>(`
    SELECT
      id,
      title,
      topic,
      level,
      score,
      total_questions,
      completed_at
    FROM reading_history
    ORDER BY completed_at DESC, id DESC
  `);
}

// Devuelve la fecha local de hoy en formato YYYY-MM-DD.
function getTodayDateKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Guarda en SQLite los segundos de una sesión de estudio.
export async function saveStudySession(
  durationSeconds: number,
): Promise<void> {
  const seconds = Math.floor(durationSeconds);

  // Ignora valores inválidos o sesiones de cero segundos.
  if (!Number.isFinite(seconds) || seconds <= 0) return;

  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO study_sessions (study_date, duration_seconds)
     VALUES (?, ?)`,
    getTodayDateKey(),
    seconds,
  );
}

// Suma los segundos de estudio registrados para hoy.
export async function getTodayStudySeconds(): Promise<number> {
  const database = await getDatabase();

  const row = await database.getFirstAsync<{
    total_seconds: number | null;
  }>(
    `SELECT SUM(duration_seconds) AS total_seconds
     FROM study_sessions
     WHERE study_date = ?`,
    getTodayDateKey(),
  );

  // SUM devuelve null cuando aún no hay sesiones.
  return row?.total_seconds ?? 0;
}