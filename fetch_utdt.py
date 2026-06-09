"""
fetch_utdt.py — Trae las series de UTDT (ICC y EI) directo de la web.

UTDT publica la serie histórica en una página por indicador; el link de descarga
es un /download.php?fname=...xls cuyo nombre cambia cuando suben datos nuevos. Por
eso scrapeamos la página para sacar el link ACTUAL y bajamos ese Excel.

Reemplaza la carga manual de ICC/EI: en vez de bajar el .xls a mano y correr
subir_datos.py, esto baja y parsea solo. Pensado para correr en una GitHub Action
mensual (UTDT publica alrededor del día 20 de cada mes).

UTDT tiene anti-bot: hay que mandar User-Agent de navegador (lo hacemos).
"""

import io
import json
import os
import re
import sys
import urllib.request
import warnings

import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")

BASE = "https://www.utdt.edu"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
OUTPUT_DIR = "data"

# id_item_menu = página "Serie Histórica" de cada indicador; col_valor = columna
# del Excel con el dato (0 = fecha). Mismas columnas que usaba subir_datos.py.
SERIES = [
    {"id": "icc", "page": 16458, "col_valor": 1, "nombre": "ICC (Confianza del Consumidor)"},
    {"id": "ei",  "page": 16455, "col_valor": 2, "nombre": "EI (Expectativas de Inflación)"},
]


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def link_de_descarga(page_id):
    html = http_get(f"{BASE}/listado_contenidos.php?id_item_menu={page_id}").decode("utf-8", "ignore")
    m = re.search(r'href="(/download\.php\?fname=[^"]+\.xls)"', html, re.I)
    if not m:
        raise RuntimeError(f"No se encontró link de descarga en la página {page_id} "
                           f"(¿UTDT cambió la página o bloqueó el acceso?)")
    return BASE + m.group(1)


def procesar(serie):
    url = link_de_descarga(serie["page"])
    xls_bytes = http_get(url)
    df = pd.read_excel(io.BytesIO(xls_bytes), sheet_name=0, skiprows=4, engine="xlrd")

    # Cortar en la primera fila sin fecha (debajo suele haber notas al pie).
    date_col = df.columns[0]
    vacias = df[df[date_col].isna()]
    if not vacias.empty:
        df = df.loc[: vacias.index[0] - 1]

    sub = df.iloc[:, [0, serie["col_valor"]]].copy()
    sub.columns = ["fecha", "valor"]
    sub["fecha"] = pd.to_datetime(sub["fecha"], errors="coerce")
    sub["valor"] = pd.to_numeric(sub["valor"], errors="coerce")
    sub = sub.dropna()
    if sub.empty:
        raise RuntimeError(f"{serie['id']}: no se encontraron datos válidos")

    sub["fecha"] = sub["fecha"].dt.strftime("%Y-%m-%d")
    registros = sub.sort_values("fecha").to_dict(orient="records")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ruta = os.path.join(OUTPUT_DIR, f"{serie['id']}.json")
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)

    ultimo = registros[-1]
    print(f"✅ {serie['nombre']}: {len(registros)} registros (último: {ultimo['fecha']} = {ultimo['valor']:.2f}) → {ruta}")
    return True


if __name__ == "__main__":
    ok = 0
    for serie in SERIES:
        try:
            if procesar(serie):
                ok += 1
        except Exception as e:
            print(f"❌ {serie['nombre']}: {e}", file=sys.stderr)

    # Falla (exit 1) solo si NO se actualizó ninguna serie, para que la Action
    # quede en rojo y nos enteremos; si al menos una anduvo, commiteamos eso.
    if ok == 0:
        sys.exit(1)
    print(f"\n{ok}/{len(SERIES)} series actualizadas.")
