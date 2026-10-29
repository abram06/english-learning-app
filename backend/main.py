# os permite leer la llave de Gemini desde las variables de entorno.
import os

# time permite esperar antes de reintentar una petición que falló.
import time

# secrets genera un código distinto para cada solicitud de lectura.
import secrets

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# genai es el cliente de Google Gemini.
# types permite configurar las respuestas estructuradas en JSON.
from google import genai
from google.genai import errors, types


# Carga las variables guardadas en backend/.env, incluida GEMINI_API_KEY.
load_dotenv()

# Crea la API.
app = FastAPI()

# Permite que la app se comunique con el backend durante el desarrollo.
# Antes de publicar, limitaremos los orígenes permitidos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crea el cliente de Gemini usando la llave privada del backend.
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Gemini probará estos modelos en orden.
MODEL_CANDIDATES = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemma-4-31b-it",
    "gemini-3.8-flash",
]

# Guarda temporalmente las últimas lecturas para pedirle a Gemini
# que evite repetir sus títulos y contenido.
# Se borra al reiniciar el backend; más adelante podemos guardarlo en una base de datos.
RECENT_READINGS = []


# Datos que necesita el endpoint para evaluar vocabulario.
class EvaluateRequest(BaseModel):
    spanish_phrase: str
    correct_word: str
    user_answer: str


# Datos que necesita el endpoint para traducir una palabra con su oración.
class TranslateRequest(BaseModel):
    word: str
    sentence: str


# Datos que la app enviará para generar una lectura.
class ReadingRequest(BaseModel):
    topic: str
    level: str


# Describe una pregunta de comprensión y sus tres opciones.
class ComprehensionQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int
    explanation: str


# Describe la lectura que Gemini debe devolver.
class GeneratedReading(BaseModel):
    title: str
    paragraphs: list[str]
    questions: list[ComprehensionQuestion]

# El nivel lo elige la persona en la app.
class WritingChallengeRequest(BaseModel):
    level: str


# Cada palabra sugerida incluye su significado.
class WritingVocabularyItem(BaseModel):
    word: str
    meaning: str


# Formato que Gemini debe devolver para un reto de escritura.
class GeneratedWritingChallenge(BaseModel):
    topic: str
    title: str
    instruction: str
    minimum_words: int
    connectors: list[str]
    vocabulary: list[WritingVocabularyItem]


def ask_gemini(prompt: str, config=None):
    """
    Envía un prompt a Gemini.

    Si un modelo falla, prueba el siguiente. También permite recibir
    una configuración especial, por ejemplo, para solicitar JSON.
    """
    last_error = None

    for model in MODEL_CANDIDATES:
        for attempt in range(2):
            try:
                # Estas opciones indican qué modelo y qué texto enviar.
                request_options = {
                    "model": model,
                    "contents": prompt,
                }

                # Solo agregamos config cuando el endpoint la necesita.
                if config is not None:
                    request_options["config"] = config

                response = client.models.generate_content(**request_options)

                # Devolvemos el texto generado y el modelo utilizado.
                return response.text or "", model

            except errors.APIError as error:
                last_error = error

                print(
                    f"[Gemini] {model}, intento {attempt + 1} falló: "
                    f"{error.code} {error.status}"
                )

                # Si el modelo no existe para esta cuenta, probamos el siguiente.
                if error.code == 404:
                    break

                # Esperamos un poco antes de volver a probar.
                time.sleep(1.5)

    # Si no configuramos modelos, mostramos un error claro en el servidor.
    if last_error is None:
        raise RuntimeError("No hay modelos configurados para Gemini.")

    # Si todos fallaron, el endpoint que llamó esta función manejará el error.
    raise last_error


@app.post("/evaluate")
def evaluate(data: EvaluateRequest):
    """Evalúa si la respuesta del estudiante es correcta."""
    prompt = f"""Eres un profesor de inglés amigable evaluando un ejercicio de vocabulario.

Frase en español: "{data.spanish_phrase}"
Palabra correcta en inglés: "{data.correct_word}"
Palabra que escribió el estudiante: "{data.user_answer}"

Evalúa si la respuesta del estudiante es correcta. Responde SOLO con este formato:

CORRECTO: si o no
EXPLICACION: una explicación breve y amigable, en español, de máximo dos frases."""

    try:
        text, model_used = ask_gemini(prompt)
    except errors.APIError:
        raise HTTPException(
            status_code=503,
            detail="El servicio de IA está saturado. Intenta de nuevo en unos minutos.",
        )

    # Comprobamos la primera línea para obtener el resultado sí/no.
    lowered = text.lower().strip()
    is_correct = lowered.startswith("correcto: si") or lowered.startswith(
        "correcto: sí"
    )

    # Extraemos la explicación, si Gemini incluyó el marcador solicitado.
    explanation = text
    for marker in ("EXPLICACIÓN:", "EXPLICACION:"):
        if marker in text:
            explanation = text.split(marker, 1)[1].strip()
            break

    return {
        "correct": is_correct,
        "explanation": explanation,
        "model_used": model_used,
    }


@app.post("/translate")
def translate(data: TranslateRequest):
    """Traduce una palabra según la oración donde aparece."""
    prompt = f"""Eres un profesor de inglés para estudiantes hispanohablantes.

Palabra en inglés: "{data.word}"
Oración donde aparece: "{data.sentence}"

Explica en español el significado de esa palabra dentro de esta oración.
Responde en español usando exactamente este formato:

Traducción: [significado breve de la palabra en este contexto]
Explicación: [una oración sencilla sobre cómo se usa aquí]

No saludes al estudiante.
No uses Markdown, asteriscos ni negritas.
No traduzcas toda la oración.
"""
    try:
        text, model_used = ask_gemini(prompt)
    except errors.APIError:
        raise HTTPException(
            status_code=503,
            detail="El servicio de traducción no está disponible ahora. Intenta de nuevo.",
        )

    return {
        "word": data.word,
        "translation": text.strip(),
        "model_used": model_used,
    }


@app.post("/reading")
def generate_reading(data: ReadingRequest):
    """Genera una lectura y preguntas de comprensión para el estudiante."""

    # Cambia en cada solicitud para animar a Gemini a crear contenido distinto.
    variation_code = secrets.token_hex(6)

    # Le recordamos a Gemini los últimos textos para reducir repeticiones.
    recent_texts = "\n".join(
        f"- {reading}" for reading in RECENT_READINGS[-5:]
    )

    if not recent_texts:
        recent_texts = "Todavía no se han generado lecturas."

    # IMPORTANTE: prompt se define antes de llamar a ask_gemini.
    prompt = f"""Escribe una lectura ORIGINAL en inglés para una app educativa.

Tema solicitado: "{data.topic}"
Nivel del estudiante: "{data.level}"
Código de variación: "{variation_code}"

Requisitos:
- Escribe un título corto y atractivo en inglés.
- Escribe exactamente 3 párrafos en inglés.
- Adapta el vocabulario y la gramática al nivel solicitado.
- Crea una historia concreta con personajes, lugar y acontecimientos.
- Evita repetir o parafrasear estas lecturas recientes:
{recent_texts}

Además, crea exactamente 3 preguntas de comprensión:
- Escribe las preguntas y sus 3 opciones en inglés.
- En correct_index indica la opción correcta: 0, 1 o 2.
- Escribe una explicación breve en español.
- Devuelve únicamente el JSON solicitado."""

    # Solicita una respuesta JSON con la estructura GeneratedReading.
    reading_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=GeneratedReading,
        max_output_tokens=2000,
    )

    try:
        # Aquí se usa el prompt definido arriba.
        text, model_used = ask_gemini(prompt, config=reading_config)
    except errors.APIError:
        raise HTTPException(
            status_code=503,
            detail="No pudimos generar la lectura ahora. Intenta de nuevo.",
        )

    # Comprueba que la respuesta de Gemini tenga el formato esperado.
    try:
        reading = GeneratedReading.model_validate_json(text)
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="La IA devolvió una lectura con un formato inesperado. Intenta otra vez.",
        )

    # Conserva un resumen para ayudar a evitar repeticiones futuras.
    reading_summary = (
        f"Título: {reading.title}. "
        f"Contenido: {' '.join(reading.paragraphs)[:500]}"
    )
    RECENT_READINGS.append(reading_summary)

    # Limita la lista temporal para que no crezca sin límite.
    del RECENT_READINGS[:-10]

    # Envía la lectura y las preguntas al lector.
    return {
        "title": reading.title,
        "paragraphs": reading.paragraphs,
        "questions": reading.questions,
        "topic": data.topic,
        "level": data.level,
        "model_used": model_used,
    }

@app.post("/writing/challenge")
def generate_writing_challenge(data: WritingChallengeRequest):
    """Genera un reto de escritura y vocabulario para el nivel elegido."""

    # Aceptamos solo los tres niveles que ofrecerá la app.
    allowed_levels = {"Básico", "Intermedio", "Avanzado"}
    if data.level not in allowed_levels:
        raise HTTPException(
            status_code=422,
            detail="El nivel debe ser Básico, Intermedio o Avanzado.",
        )

    # Este código ayuda a pedir un tema diferente en cada solicitud.
    variation_code = secrets.token_hex(6)

    prompt = f"""Crea un reto ORIGINAL de escritura en inglés para una app educativa.

Nivel elegido por el estudiante: "{data.level}"
Código para variar el tema: "{variation_code}"

Devuelve:
- Un tema concreto y diferente de retos típicos anteriores.
- Un título breve en inglés.
- Una instrucción clara en español que explique qué debe escribir.
- Un mínimo de palabras apropiado para el nivel elegido.
- De 3 a 5 conectores en inglés.
- De 5 a 8 palabras de vocabulario en inglés, cada una con su significado breve en español.

Adapta el tema, la gramática, los conectores y el vocabulario al nivel.
No incluyas una redacción de ejemplo ni las respuestas del estudiante.
Devuelve únicamente los datos con el formato JSON solicitado."""

    challenge_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=GeneratedWritingChallenge,
        max_output_tokens=1200,
    )

    try:
        text, model_used = ask_gemini(prompt, config=challenge_config)
    except errors.APIError:
        raise HTTPException(
            status_code=503,
            detail="No pudimos generar el reto ahora. Intenta de nuevo.",
        )

    try:
        challenge = GeneratedWritingChallenge.model_validate_json(text)
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="La IA devolvió un reto con un formato inesperado. Intenta otra vez.",
        )

    # Convertimos minimum_words a minimumWords para que coincida con TypeScript.
    return {
        "topic": challenge.topic,
        "title": challenge.title,
        "instruction": challenge.instruction,
        "level": data.level,
        "minimumWords": challenge.minimum_words,
        "connectors": challenge.connectors,
        "vocabulary": [
            {"word": item.word, "meaning": item.meaning}
            for item in challenge.vocabulary
        ],
        "model_used": model_used,
    }



@app.get("/models")
def list_models():
    """Lista los modelos que tu llave puede usar para generar texto."""
    available_models = []

    for model in client.models.list():
        actions = getattr(model, "supported_actions", None) or []

        if "generateContent" in actions:
            available_models.append(model.name)

    return {"models": available_models}


@app.get("/")
def health_check():
    """Confirma que el servidor está funcionando."""
    return {"status": "El servidor está funcionando ✅"}