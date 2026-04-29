import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Configuración de la página
st.set_page_config(page_title="MacroAr Chat", page_icon="🇦🇷")
st.title("MacroAr - Asistente Económico")

# Cargar variables de entorno (para uso local)
load_dotenv(override=True)

# Obtener API Key (Streamlit Secrets en prod, o variable de entorno en local)
# En producción (Streamlit Cloud), la clave se lee de st.secrets.
# En local, se lee del archivo .env que carga load_dotenv().
try:
    # Intenta leer desde los secretos de Streamlit (ideal para producción)
    api_key = st.secrets["GEMINI_API_KEY"]
except:
    # Si falla (ej. en local sin secrets.toml), lee desde el archivo .env
    api_key = os.environ.get("GEMINI_API_KEY")

if not api_key: # Si después de todo no hay clave, detenemos la app
    st.error("No se encontró la API Key de Gemini. Por favor configurala.")
    st.stop()

genai.configure(api_key=api_key)
modelo = genai.GenerativeModel('gemini-1.5-pro-latest')

# Inicializar la memoria de la sesión (única por usuario)
if "mensajes" not in st.session_state:
    st.session_state.mensajes = []

# Mostrar el historial de mensajes en la pantalla
for msg in st.session_state.mensajes:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Input del usuario
if prompt := st.chat_input("Escribí tu consulta sobre economía..."):
    # 1. Mostrar mensaje del usuario
    st.session_state.mensajes.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 2. Preparar el historial para Gemini
    historial_gemini = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [m["content"]]} 
        for m in st.session_state.mensajes[:-1] # Excluimos el último mensaje (el actual)
    ]
    
    # 3. Iniciar chat e invocar al modelo con streaming
    chat = modelo.start_chat(history=historial_gemini)
    
    with st.chat_message("assistant"):
        respuesta_stream = chat.send_message(prompt, stream=True)
        # st.write_stream maneja el efecto "máquina de escribir" automáticamente
        respuesta_completa = st.write_stream((chunk.text for chunk in respuesta_stream if chunk.text))
    
    # 4. Guardar respuesta en la memoria de la sesión
    st.session_state.mensajes.append({"role": "assistant", "content": respuesta_completa})