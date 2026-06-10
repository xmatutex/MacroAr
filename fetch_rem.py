"""
fetch_rem.py — Trae las series del REM (Relevamiento de Expectativas de Mercado)
del BCRA directo de la web.

El BCRA publica cada mes un Excel "tablas-relevamiento-expectativas-mercado-MMM-AAAA.xlsx"
cuyo nombre incluye el mes. Scrapeamos la página del REM para sacar el link ACTUAL y
bajamos ese Excel; así funciona aunque cambie el mes.

Reemplaza la carga manual del REM con subir_datos.py. Replica exactamente el mismo
parseo (hoja 0, skiprows=6, columna fecha=1, corte en la primera fila sin fecha).
Pensado para correr en una GitHub Action mensual.
"""

import io
import json
import os
import re
import ssl
import sys
import urllib.request
import warnings

import pandas as pd

# El cert del BCRA no siempre valida con el store local; usamos el bundle de
# certifi (cae al default si no está instalado).
try:
    import certifi
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL_CTX = ssl.create_default_context()

sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")

BASE = "https://www.bcra.gob.ar"
PAGE = f"{BASE}/PublicacionesEstadisticas/Relevamiento_Expectativas_de_Mercado.asp"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
OUTPUT_DIR = "data"

# Cada serie del REM = una columna del Excel (col_fecha=1, col_valor según subir_datos.py).
SERIES = [
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
COL_FECHA = 1
SKIPROWS = 6


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as r:
        return r.read()


def link_tablas():
    html = http_get(PAGE).decode("utf-8", "ignore")
    m = re.search(r'href="(/[^"]*tablas-relevamiento-expectativas-mercado-[^"]*\.xlsx)"', html, re.I)
    if not m:
        raise RuntimeError("No se encontró el link del Excel 'tablas' en la página del REM "
                           "(¿el BCRA cambió la página?)")
    return BASE + m.group(1)


def main():
    url = link_tablas()
    print(f"Bajando: {url}")
    xlsx = http_get(url)
    df = pd.read_excel(io.BytesIO(xlsx), sheet_name=0, skiprows=SKIPROWS, engine="openpyxl")

    # Corte en la primera fila sin fecha (toma solo el primer bloque, como subir_datos.py).
    date_col = df.columns[COL_FECHA]
    vacias = df[df[date_col].isna()]
    if not vacias.empty:
        df = df.loc[: vacias.index[0] - 1]

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ok = 0
    for serie in SERIES:
        try:
            sub = df.iloc[:, [COL_FECHA, serie["col"]]].copy()
            sub.columns = ["fecha", "valor"]
            sub["fecha"] = pd.to_datetime(sub["fecha"], errors="coerce")
            sub["valor"] = pd.to_numeric(sub["valor"], errors="coerce")
            sub = sub.dropna()
            if sub.empty:
                raise RuntimeError("sin datos válidos")
            sub["fecha"] = sub["fecha"].dt.strftime("%Y-%m-%d")
            registros = sub.sort_values("fecha").to_dict(orient="records")
            ruta = os.path.join(OUTPUT_DIR, f"{serie['id']}.json")
            with open(ruta, "w", encoding="utf-8") as f:
                json.dump(registros, f, ensure_ascii=False, indent=2)
            print(f"✅ {serie['id']}: {len(registros)} registros → {ruta}")
            ok += 1
        except Exception as e:
            print(f"❌ {serie['id']}: {e}", file=sys.stderr)

    if ok == 0:
        sys.exit(1)
    print(f"\n{ok}/{len(SERIES)} series del REM actualizadas.")


if __name__ == "__main__":
    main()
