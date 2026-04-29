import pandas as pd
from supabase import create_client, Client
import warnings

# Ignorar advertencias de formato de Excel viejos
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

# 1. Configuración de Supabase (Tus credenciales de app.js)
SUPABASE_URL = "https://aopnwktuhczjvquofwdr.supabase.co"
SUPABASE_KEY = "sb_publishable_sV_d9xpKDcoblxt2NUeFDw_AoZvTOfy"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def procesar_y_subir(ruta_excel, nombre_indicador, col_valor=1):
    print(f"Procesando '{ruta_excel}' para el indicador '{nombre_indicador}'...")
    
    try:
        # 2. Leer el Excel. 
        # Saltamos las primeras filas si Di Tella pone títulos largos (ajustar si es necesario)
        # El parámetro skiprows=4 saltea las primeras 4 filas de títulos.
        # Agarramos la columna 0 (fecha) y la columna indicada en col_valor.
        if ruta_excel.endswith('.xls'):
            df = pd.read_excel(ruta_excel, skiprows=4, engine='xlrd')
        else:
            df = pd.read_excel(ruta_excel, skiprows=4, engine='openpyxl')
            
        df = df.iloc[:, [0, col_valor]]
        df.columns = ['fecha', 'valor']
        
        # 3. Limpieza de datos
        df = df.dropna() # Eliminar filas vacías
        df['indicador'] = nombre_indicador
        
        # Mostrar un adelanto de lo que leyó el script para ayudarnos a detectar errores
        print(f"➜ Muestra de los datos leídos:\n{df.head(3)}\n")
        
        # Formatear la fecha a YYYY-MM-DD
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce').dt.strftime('%Y-%m-%d')
        
        # Formatear el valor a número
        df['valor'] = pd.to_numeric(df['valor'], errors='coerce')
        
        # Volver a limpiar por si alguna fila era puro texto y falló al convertirse
        df = df.dropna() 

        # 4. Borrar datos viejos para este indicador para evitar duplicados
        print(f"➜ Borrando datos viejos para '{nombre_indicador}' para evitar duplicados...")
        supabase.table("Indicadores externos").delete().eq("indicador", nombre_indicador).execute()

        # 5. Convertir a lista de diccionarios para Supabase
        datos_para_subir = df.to_dict(orient='records')

        # 6. Subir a Supabase
        respuesta = supabase.table("Indicadores externos").insert(datos_para_subir).execute()
        print(f"✅ ¡Éxito! Se subieron {len(datos_para_subir)} registros a la base de datos.")
        
    except Exception as e:
        print(f"❌ Error al procesar: {e}")

if __name__ == "__main__":
    # INSTRUCCIONES: 
    # Cambiá "archivo_descargado.xls" por el nombre real de tu archivo
    procesar_y_subir("Datos UTDT/Serie ICC 04-26.xls", "icc")
    # Para EI, le indicamos que la columna del valor es la 2 (Promedio)
    procesar_y_subir("Datos UTDT/Serie EI.xls", "ei", col_valor=2)
    