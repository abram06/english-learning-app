import type { Reading } from '../types';

// Dirección del backend durante el desarrollo en tu computadora.
// Para usar la app en un teléfono físico o publicarla, habrá que cambiarla.
const API_BASE_URL = 'http://192.168.18.48:8000';

// Solicita al backend una lectura según el tema y el nivel.
export async function generateReading(
  topic: string,
  level: string,
): Promise<Reading> {
  const response = await fetch(`${API_BASE_URL}/reading`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, level }),
  });

  const data = await response.json();

  // Convierte los errores del backend en mensajes que la pantalla pueda mostrar.
  if (!response.ok) {
    throw new Error(data.detail ?? 'No se pudo generar la lectura.');
  }

  // Informa a TypeScript que la respuesta tiene el formato Reading.
  return data as Reading;
}

// Solicita la traducción contextual de una palabra.
export async function fetchWordTranslation(
  word: string,
  sentence: string,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ word, sentence }),
  });

  const data = await response.json();

  // Si FastAPI devuelve un error, usamos su mensaje.
  if (!response.ok) {
    throw new Error(data.detail ?? 'No se pudo traducir la palabra.');
  }

  // Devuelve la traducción o un mensaje alternativo si no llegó.
  return data.translation ?? 'No recibimos una traducción.';
}