import pandas as pd
from supabase import create_client, Client
import warnings
import os
from dotenv import load_dotenv

# Cargar variables de entorno (claves secretas)
load_dotenv(override=True)

# Ignorar advertencias de formato de Excel viejos
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

# 1. Configuración de Supabase (Tus credenciales de app.js)
SUPABASE_URL = "https://aopnwktuhczjvquofwdr.supabase.co"
# Ahora lee la clave desde el archivo .env por seguridad
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_KEY:
    print("❌ Error: No se encontró la clave de Supabase. Asegurate de tenerla en el archivo .env")
    exit()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def procesar_y_subir(ruta_excel, nombre_indicador, col_valor=1, col_fecha=0, sheet_name=0, filas_saltar=4):
    print(f"Procesando '{ruta_excel}' (hoja: {sheet_name}) para el indicador '{nombre_indicador}'...")

    try:
        # 2. Leer el Excel.
        if ruta_excel.endswith('.xls'):
            df = pd.read_excel(ruta_excel, sheet_name=sheet_name, skiprows=filas_saltar, engine='xlrd')
        else:
            df = pd.read_excel(ruta_excel, sheet_name=sheet_name, skiprows=filas_saltar, engine='openpyxl')

        # El Excel del REM puede tener filas de totales/vacías al final.
        # Para quedarnos solo con el bloque de datos, buscamos la primera fila
        # donde la columna de fecha está vacía y cortamos el dataframe ahí.
        date_col_name = df.columns[col_fecha]
        empty_rows = df[df[date_col_name].isna()]
        if not empty_rows.empty:
            first_empty_index = empty_rows.index[0]
            df = df.loc[:first_empty_index-1]

        # Ahora que tenemos el bloque correcto, seleccionamos las columnas de fecha y valor.
        df = df.iloc[:, [col_fecha, col_valor]]
        df.columns = ['fecha', 'valor']

        # 3. Limpieza de datos
        df['indicador'] = nombre_indicador

        # Mostrar un adelanto de lo que leyó el script para ayudarnos a detectar errores
        print(f"➜ Muestra de los datos leídos:\n{df.head(3)}\n")

        # Formatear la fecha a YYYY-MM-DD
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce').dt.strftime('%Y-%m-%d')

        # Formatear el valor a número
        df['valor'] = pd.to_numeric(df['valor'], errors='coerce')

        # Limpiar filas donde la fecha o el valor no se pudieron convertir (quedan como NaT o NaN)
        df = df.dropna()

        # 4. Verificar que la tabla no esté vacía
        if df.empty:
            print(f"⚠️ Advertencia: No se encontraron datos para '{nombre_indicador}'. Revisá en el Excel si la columna '{col_valor}' y el inicio de filas ({filas_saltar}) son correctos.")
            return

        # 5. Borrar datos viejos para este indicador para evitar duplicados y luego insertar los nuevos
        print(f"➜ Borrando datos viejos para '{nombre_indicador}' para evitar duplicados...")
        supabase.table("Indicadores externos").delete().eq("indicador", nombre_indicador).execute()

        # 6. Convertir a lista de diccionarios para Supabase
        datos_para_subir = df.to_dict(orient='records')

        # 7. Subir a Supabase.
        supabase.table("Indicadores externos").insert(datos_para_subir).execute()
        print(f"✅ ¡Éxito! Se subieron {len(datos_para_subir)} registros a la base de datos.")

    except Exception as e:
        print(f"❌ Error al procesar: {e}")

if __name__ == "__main__":
    # INSTRUCCIONES: 
    # Cambiá "archivo_descargado.xls" por el nombre real de tu archivo
    procesar_y_subir("Datos UTDT/Serie ICC 04-26.xls", "icc")
    # Para EI, le indicamos que la columna del valor es la 2 (Promedio)
    procesar_y_subir("Datos UTDT/Serie EI.xls", "ei", col_valor=2)
    
    # Configuración de los 9 indicadores del REM desde la misma hoja.
    # Todos están en la primera hoja (índice 0).
    # Las fechas están en la columna B (índice 1).
    # Los valores empiezan en la columna D (índice 3) y siguen hacia la derecha.
    indicadores_rem = [
        {"id": "rem-ipc",          "col": 3}, # Col D
        {"id": "rem-ipc-nucleo",   "col": 4}, # Col E
        {"id": "rem-pib",          "col": 5}, # Col F
        {"id": "rem-tcn",          "col": 6}, # Col G
        {"id": "rem-badlar",       "col": 7}, # Col H
        {"id": "rem-expo",         "col": 8}, # Col I
        {"id": "rem-impo",         "col": 9}, # Col J
        {"id": "rem-desocupacion", "col": 10},# Col K
        {"id": "rem-resultado",    "col": 11},# Col L
    ]
    
    # Recorremos la lista y subimos uno por uno
    for ind in indicadores_rem:
        procesar_y_subir(
            "Datos BCRA/tablas-relevamiento-expectativas-mercado-mar-2026.xlsx", 
            ind["id"], 
            col_fecha=1,          # Columna B para las fechas
            col_valor=ind["col"], # Columna correspondiente al indicador
            sheet_name=0,         # Primera hoja del Excel
            filas_saltar=6        # Empezar a leer desde la fila 7
        )
    