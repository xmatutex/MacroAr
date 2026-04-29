import os
import json
from datetime import datetime
from pathlib import Path
import google.generativeai as genai 
from dotenv import load_dotenv

load_dotenv(override=True)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

modelo = genai.GenerativeModel('gemini-1.5-pro')


MEMORIA_PATH = Path("memoria.json")


# ─── Persistencia local ────────────────────────────────────────────────────────

def cargar_memoria():
    if MEMORIA_PATH.exists():
        try:
            with open(MEMORIA_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def guardar_turno(memoria, pregunta, respuesta):
    ts = datetime.now().isoformat(timespec="seconds")
    memoria.append({"rol": "usuario", "texto": pregunta,   "ts": ts})
    memoria.append({"rol": "agente",  "texto": respuesta,  "ts": ts})
    with open(MEMORIA_PATH, "w", encoding="utf-8") as f:
        json.dump(memoria, f, ensure_ascii=False, indent=2)


# ─── Inicio ────────────────────────────────────────────────────────────────────

memoria = cargar_memoria()

# Convertir la memoria local al formato que entiende Gemini
historial_gemini = []
for m in memoria:
    rol = "user" if m["rol"] == "usuario" else "model"
    historial_gemini.append({"role": rol, "parts": [m["texto"]]})

chat = modelo.start_chat(history=historial_gemini)
turnos  = len(memoria) // 2

print(f"MacroAr listo — {turnos} conversacion{'es' if turnos != 1 else ''} en memoria.")
print("Escribi tu consulta (o 'salir' para terminar, 'historial' para ver las últimas)\n")


# ─── Loop principal ────────────────────────────────────────────────────────────

while True:
    pregunta = input("Vos: ").strip()

    if pregunta.lower() == "salir":
        print("Hasta luego.")
        break

    if not pregunta:
        continue

    # Comando para ver historial reciente
    if pregunta.lower() == "historial":
        ultimos = memoria[-10:]  # últimos 5 intercambios
        if not ultimos:
            print("Sin historial todavía.\n")
        else:
            for m in ultimos:
                prefix = "Vos" if m["rol"] == "usuario" else "MacroAr"
                print(f"[{m['ts']}] {prefix}: {m['texto'][:120]}{'…' if len(m['texto']) > 120 else ''}")
            print()
        continue

    print("MacroAr: ", end="", flush=True)
    respuesta = ""

    try:
        # Llamada a la API de Gemini usando la sesión de chat con memoria
        respuesta_stream = chat.send_message(pregunta, stream=True)
        for chunk in respuesta_stream:
            if chunk.text:
                print(chunk.text, end="", flush=True)
                respuesta += chunk.text
        print("\n")

        if respuesta:
            guardar_turno(memoria, pregunta, respuesta)

    except Exception as e:
        print(f"\nError: {e}")
