// Representa una pregunta de comprensión que devuelve el backend.
export type ComprehensionQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

// Representa una lectura completa devuelta por FastAPI.
export type Reading = {
  title: string;
  paragraphs: string[];
  questions: ComprehensionQuestion[];
  topic: string;
  level: string;
  model_used: string;
};