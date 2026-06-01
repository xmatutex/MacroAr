import pandas as pd
import json
import warnings
import os

warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

OUTPUT_DIR = 'data'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def procesar_y_guardar(ruta_excel, nombre_indicador, col_valor=1, col_fecha=0, sheet_name=0, filas_saltar=4):
    print(f"Procesando '{ruta_excel}' (hoja: {sheet_name}) para el indicador '{nombre_indicador}'...")

    try:
        if ruta_excel.endswith('.xls'):
            df = pd.read_excel(ruta_excel, sheet_name=sheet_name, skiprows=filas_saltar, engine='xlrd')
        else:
            df = pd.read_excel(ruta_excel, sheet_name=sheet_name, skiprows=filas_saltar, engine='openpyxl')

        date_col_name = df.columns[col_fecha]
        empty_rows = df[df[date_col_name].isna()]
        if not empty_rows.empty:
            first_empty_index = empty_rows.index[0]
            df = df.loc[:first_empty_index-1]

        df = df.iloc[:, [col_fecha, col_valor]]
        df.columns = ['fecha', 'valor']

        print(f"➜ Muestra de los datos leídos:\n{df.head(3)}\n")

        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce').dt.strftime('%Y-%m-%d')
        df['valor'] = pd.to_numeric(df['valor'], errors='coerce')
        df = df.dropna()

        if df.empty:
            print(f"⚠️  No se encontraron datos para '{nombre_indicador}'.")
            return

        registros = df.sort_values('fecha').to_dict(orient='records')

        ruta_json = os.path.join(OUTPUT_DIR, f'{nombre_indicador}.json')
        with open(ruta_json, 'w', encoding='utf-8') as f:
            json.dump(registros, f, ensure_ascii=False, indent=2)

        print(f"✅ {len(registros)} registros guardados en {ruta_json}")

    except Exception as e:
        print(f"❌ Error al procesar: {e}")

if __name__ == "__main__":
    procesar_y_guardar("Datos UTDT/Serie ICC 04-26.xls", "icc")
    procesar_y_guardar("Datos UTDT/Serie EI.xls", "ei", col_valor=2)

    indicadores_rem = [
        {"id": "rem-ipc",          "col": 3},
        {"id": "rem-ipc-nucleo",   "col": 4},
        {"id": "rem-pib",          "col": 5},
        {"id": "rem-tcn",          "col": 6},
        {"id": "rem-badlar",       "col": 7},
        {"id": "rem-expo",         "col": 8},
        {"id": "rem-impo",         "col": 9},
        {"id": "rem-desocupacion", "col": 10},
        {"id": "rem-resultado",    "col": 11},
    ]

    for ind in indicadores_rem:
        procesar_y_guardar(
            "Datos BCRA/tablas-relevamiento-expectativas-mercado-mar-2026.xlsx",
            ind["id"],
            col_fecha=1,
            col_valor=ind["col"],
            sheet_name=0,
            filas_saltar=6
        )
