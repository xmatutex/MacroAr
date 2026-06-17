"""
Agente macroeconómico de Argentina.
Consulta datos en tiempo real de las mismas fuentes que MacroAr y responde
preguntas usando la API de Claude con tool_use.

Uso:
    python agente_macro.py
    python agente_macro.py "¿Cómo está la brecha cambiaria?"

Requiere:
    ANTHROPIC_API_KEY en .env o como variable de entorno
    pip install anthropic python-dotenv
"""
import os
import sys
import json
import datetime
import ssl
import urllib.request
import urllib.error
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import certifi
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CTX = ssl.create_default_context()

import anthropic

# ── Catálogo de series ────────────────────────────────────────────────────────
# Mirrors SERIES array in app.js. "variacion": True means raw data is an index
# and calcular_variacion will compute % change; False means already a rate/%.

SERIES_CATALOG = {
    # Mercado Cambiario
    "tc-oficial": {
        "titulo": "Dólar Oficial (BNA, venta)",
        "fuente": "bluelytics", "tipo_tc": "oficial",
        "unidad": "$/USD", "categoria": "Mercado Cambiario",
    },
    "tc-blue": {
        "titulo": "Dólar Blue (venta)",
        "fuente": "bluelytics", "tipo_tc": "blue",
        "unidad": "$/USD", "categoria": "Mercado Cambiario",
    },
    "tc-mayorista": {
        "titulo": "Dólar Mayorista (BCRA)",
        "fuente": "bcra", "serieId": 4,
        "unidad": "$/USD", "categoria": "Mercado Cambiario",
    },
    "dolar-mep": {
        "titulo": "Dólar MEP (Bolsa)",
        "fuente": "argentinadatos", "serieId": "cotizaciones/dolares/bolsa", "campo": "venta",
        "unidad": "$/USD", "categoria": "Mercado Cambiario",
    },
    "dolar-ccl": {
        "titulo": "Dólar CCL (Contado con Liqui)",
        "fuente": "argentinadatos", "serieId": "cotizaciones/dolares/contadoconliqui", "campo": "venta",
        "unidad": "$/USD", "categoria": "Mercado Cambiario",
    },
    # Sector Monetario
    "reservas": {
        "titulo": "Reservas Internacionales",
        "fuente": "bcra", "serieId": 1,
        "unidad": "millones USD", "categoria": "Sector Monetario",
    },
    "base-monetaria": {
        "titulo": "Base Monetaria",
        "fuente": "bcra", "serieId": 15,
        "unidad": "millones ARS", "categoria": "Sector Monetario",
    },
    # Sistema Financiero
    "tpm": {
        "titulo": "Tasa de Política Monetaria",
        "fuente": "bcra", "serieId": 28,
        "unidad": "% anual", "categoria": "Sistema Financiero",
    },
    "tasa-badlar": {
        "titulo": "Tasa BADLAR (bancos privados)",
        "fuente": "bcra", "serieId": 8,
        "unidad": "% anual", "categoria": "Sistema Financiero",
    },
    "tasa-plazo-fijo": {
        "titulo": "Tasa Plazo Fijo (hasta $1M, hasta 44 días)",
        "fuente": "bcra", "serieId": 7,
        "unidad": "% anual", "categoria": "Sistema Financiero",
    },
    "uva": {
        "titulo": "UVA (Unidad de Valor Adquisitivo)",
        "fuente": "bcra", "serieId": 31,
        "unidad": "ARS", "categoria": "Sistema Financiero",
    },
    # Precios
    "inflacion": {
        "titulo": "IPC (Índice de Precios al Consumidor, INDEC)",
        "fuente": "indec", "serieId": "148.3_INIVELNAL_DICI_M_26",
        "unidad": "índice (base dic 2016=100)", "categoria": "Precios",
        "variacion": True,
        "nota": "Usar calcular_variacion tipo='mensual' para obtener % inflación mensual",
    },
    "ipim": {
        "titulo": "Precios Mayoristas (IPIM, var. i.a.)",
        "fuente": "indec", "serieId": "448.1_NIVEL_GENERAL_0_0_13_46",
        "unidad": "índice (base 2015=100)", "categoria": "Precios",
        "variacion": True,
    },
    # Actividad y Sector Real
    "emae": {
        "titulo": "Actividad Económica (EMAE, desestacionalizada)",
        "fuente": "emae", "serieId": "143.3_NO_PR_2004_A_31",
        "unidad": "índice (base 2004=100)", "categoria": "Actividad",
    },
    "ipi-manufacturero": {
        "titulo": "Producción Industrial Manufacturera (IPI)",
        "fuente": "indec", "serieId": "453.1_SERIE_ORIGNAL_0_0_14_46",
        "unidad": "índice", "categoria": "Sector Real",
    },
    "isac": {
        "titulo": "Actividad Constructora (ISAC)",
        "fuente": "indec", "serieId": "33.2_ISAC_NIVELRAL_0_M_18_63",
        "unidad": "índice", "categoria": "Sector Real",
    },
    "salarios-total": {
        "titulo": "Índice de Salarios (Total)",
        "fuente": "indec", "serieId": "149.1_TL_INDIIOS_OCTU_0_21",
        "unidad": "índice", "categoria": "Sector Real",
    },
    "salarios-privado": {
        "titulo": "Salarios Privados (Registrado)",
        "fuente": "indec", "serieId": "149.1_SOR_PRIADO_OCTU_0_25",
        "unidad": "índice", "categoria": "Sector Real",
    },
    "salarios-publico": {
        "titulo": "Salarios Públicos",
        "fuente": "indec", "serieId": "149.1_SOR_PUBICO_OCTU_0_14",
        "unidad": "índice", "categoria": "Sector Real",
    },
    # Finanzas Públicas
    "recaudacion-total": {
        "titulo": "Recaudación Total (ARCA/DGI)",
        "fuente": "indec", "serieId": "172.3_TL_RECAION_M_0_0_17",
        "unidad": "millones ARS", "categoria": "Finanzas Públicas",
    },
    # Mercado de Capitales
    "riesgo-pais": {
        "titulo": "Riesgo País Argentina (EMBI+)",
        "fuente": "argentinadatos", "serieId": "finanzas/indices/riesgo-pais",
        "unidad": "puntos básicos", "categoria": "Mercado de Capitales",
    },
    "merval": {
        "titulo": "Índice Merval (Bolsa de Buenos Aires)",
        "fuente": "local", "serieId": "merval",
        "unidad": "ARS", "categoria": "Mercado de Capitales",
    },
    # Commodities
    "soja": {
        "titulo": "Soja Chicago (CBOT, USD/tn)",
        "fuente": "local", "serieId": "soja",
        "unidad": "USD/tonelada", "categoria": "Commodities",
    },
    "wti": {
        "titulo": "Petróleo WTI (NYMEX)",
        "fuente": "local", "serieId": "wti",
        "unidad": "USD/barril", "categoria": "Commodities",
    },
    "brent": {
        "titulo": "Petróleo Brent (ICE)",
        "fuente": "local", "serieId": "brent",
        "unidad": "USD/barril", "categoria": "Commodities",
    },
    "oro": {
        "titulo": "Oro (futuro COMEX)",
        "fuente": "local", "serieId": "oro",
        "unidad": "USD/oz", "categoria": "Commodities",
    },
    # Expectativas (REM BCRA)
    "rem-inflacion": {
        "titulo": "Inflación esperada (REM BCRA)",
        "fuente": "local", "serieId": "rem-ipc",
        "unidad": "% mensual", "categoria": "REM / Expectativas",
    },
    "rem-tipo-cambio": {
        "titulo": "Tipo de cambio esperado (REM BCRA)",
        "fuente": "local", "serieId": "rem-tcn",
        "unidad": "$/USD", "categoria": "REM / Expectativas",
    },
    "rem-pib": {
        "titulo": "Crecimiento del PIB esperado (REM BCRA)",
        "fuente": "local", "serieId": "rem-pib",
        "unidad": "% anual", "categoria": "REM / Expectativas",
    },
}

DATA_DIR = Path(__file__).parent / "data"

# ── Funciones de fetch por fuente ─────────────────────────────────────────────

def _get(url: str, headers: dict = None) -> dict | list:
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "MacroAr-Agente/1.0"})
    with urllib.request.urlopen(req, timeout=15, context=_SSL_CTX) as r:
        return json.loads(r.read())


def _iso_hace(meses: int) -> str:
    hoy = datetime.date.today()
    anio = hoy.year - (meses // 12)
    mes = hoy.month - (meses % 12)
    if mes <= 0:
        mes += 12
        anio -= 1
    return datetime.date(anio, mes, 1).isoformat()


def fetch_bcra(serie_id: int, meses: int) -> list[dict]:
    desde = _iso_hace(meses + 2)
    hasta = datetime.date.today().isoformat()
    url = f"https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/{serie_id}?desde={desde}&hasta={hasta}"
    data = _get(url)
    # results es lista de {idVariable, detalle: [{fecha, valor}]}
    results = data.get("results", [])
    if results and isinstance(results[0], dict) and "detalle" in results[0]:
        filas = results[0]["detalle"]
    else:
        filas = results
    return [{"fecha": r["fecha"], "valor": r["valor"]} for r in filas]


def fetch_indec(serie_id: str, meses: int) -> list[dict]:
    desde = _iso_hace(meses + 2)
    url = (
        f"https://apis.datos.gob.ar/series/api/series/"
        f"?ids={serie_id}&start_date={desde}&limit=5000&format=json"
    )
    data = _get(url)
    filas = data.get("data", [])
    return [{"fecha": row[0], "valor": row[1]} for row in filas if row[1] is not None]


def fetch_bluelytics(tipo_tc: str, meses: int) -> list[dict]:
    dias = meses * 31
    url = f"https://api.bluelytics.com.ar/v2/evolution.json?range={dias}"
    data = _get(url)
    # source: "Oficial" / "Blue" (capitalized), campo: value_sell
    casa = "Oficial" if tipo_tc == "oficial" else "Blue"
    return [
        {"fecha": r["date"][:10], "valor": r["value_sell"]}
        for r in data
        if r.get("source") == casa and r.get("value_sell")
    ]


def fetch_argentinadatos(endpoint: str, meses: int, campo: str = "valor") -> list[dict]:
    desde = _iso_hace(meses + 1)
    url = f"https://api.argentinadatos.com/v1/{endpoint}"
    data = _get(url)
    return [
        {"fecha": r["fecha"], "valor": r.get(campo) or r.get("valor")}
        for r in data
        if r.get("fecha", "") >= desde and (r.get(campo) or r.get("valor")) is not None
    ]


def fetch_local(serie_id: str, meses: int) -> list[dict]:
    ruta = DATA_DIR / f"{serie_id}.json"
    if not ruta.exists():
        raise FileNotFoundError(f"No existe data/{serie_id}.json — corré fetch_mercados.py")
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    desde = _iso_hace(meses)
    return [r for r in datos if r["fecha"] >= desde]


def fetch_serie(serie_id: str, meses: int = 12) -> list[dict]:
    meses = min(max(meses, 1), 60)
    cfg = SERIES_CATALOG.get(serie_id)
    if not cfg:
        raise ValueError(f"Serie '{serie_id}' no encontrada. Usá listar_series() para ver las disponibles.")

    fuente = cfg["fuente"]
    if fuente == "bcra":
        datos = fetch_bcra(cfg["serieId"], meses)
    elif fuente == "indec":
        datos = fetch_indec(cfg["serieId"], meses)
    elif fuente == "emae":
        datos = fetch_indec(cfg["serieId"], meses)
    elif fuente == "bluelytics":
        datos = fetch_bluelytics(cfg["tipo_tc"], meses)
    elif fuente == "argentinadatos":
        datos = fetch_argentinadatos(cfg["serieId"], meses, cfg.get("campo", "valor"))
    elif fuente == "local":
        datos = fetch_local(cfg["serieId"], meses)
    else:
        raise ValueError(f"Fuente desconocida: {fuente}")

    datos.sort(key=lambda r: r["fecha"])
    return datos[-meses * 35:]  # cap generoso por si hay datos diarios


# ── Implementación de las herramientas ────────────────────────────────────────

def tool_listar_series() -> dict:
    por_categoria: dict[str, list] = {}
    for sid, cfg in SERIES_CATALOG.items():
        cat = cfg.get("categoria", "Otros")
        por_categoria.setdefault(cat, []).append({
            "id": sid,
            "titulo": cfg["titulo"],
            "unidad": cfg.get("unidad", ""),
        })
    return por_categoria


def tool_get_serie(serie_id: str, meses: int = 12) -> dict:
    cfg = SERIES_CATALOG.get(serie_id)
    if not cfg:
        return {"error": f"Serie '{serie_id}' no existe. Usá listar_series para ver IDs válidos."}
    try:
        datos = fetch_serie(serie_id, meses)
    except Exception as e:
        return {"error": str(e)}

    if not datos:
        return {"error": "La API no devolvió datos para el período solicitado."}

    ultimo = datos[-1]
    anterior = datos[-2] if len(datos) >= 2 else None
    var_m = None
    if anterior and anterior["valor"] and anterior["valor"] != 0:
        var_m = round((ultimo["valor"] / anterior["valor"] - 1) * 100, 2)

    return {
        "serie": serie_id,
        "titulo": cfg["titulo"],
        "unidad": cfg.get("unidad", ""),
        "ultimo_dato": ultimo,
        "variacion_vs_anterior": var_m,
        "n_registros": len(datos),
        "datos": datos,
    }


def tool_calcular_variacion(serie_id: str, tipo: str, meses_historial: int = 12) -> dict:
    cfg = SERIES_CATALOG.get(serie_id)
    if not cfg:
        return {"error": f"Serie '{serie_id}' no existe."}

    periodos_fetch = max(meses_historial + 14, 24)
    try:
        datos = fetch_serie(serie_id, periodos_fetch)
    except Exception as e:
        return {"error": str(e)}

    if len(datos) < 2:
        return {"error": "Datos insuficientes para calcular variación."}

    es_porcentaje = not cfg.get("variacion", False)

    resultado = []

    if tipo == "mensual":
        for i in range(1, len(datos)):
            a, b = datos[i - 1], datos[i]
            if a["valor"] and a["valor"] != 0:
                if es_porcentaje:
                    # Ya es % → devolver el valor directamente
                    resultado.append({"fecha": b["fecha"], "variacion_pct": round(b["valor"], 2)})
                else:
                    resultado.append({
                        "fecha": b["fecha"],
                        "variacion_pct": round((b["valor"] / a["valor"] - 1) * 100, 2),
                    })

    elif tipo == "interanual":
        por_fecha = {r["fecha"]: r["valor"] for r in datos}
        fechas = sorted(por_fecha)
        for f in fechas:
            anio_ant = str(int(f[:4]) - 1) + f[4:]
            if anio_ant in por_fecha and por_fecha[anio_ant]:
                if es_porcentaje:
                    # Suma de 12 variaciones mensuales (aprox. inflación acumulada i.a.)
                    fechas_rango = [d["fecha"] for d in datos if anio_ant <= d["fecha"] <= f]
                    if len(fechas_rango) >= 11:
                        compound = 1.0
                        for fr in fechas_rango:
                            compound *= (1 + por_fecha.get(fr, 0) / 100)
                        resultado.append({"fecha": f, "variacion_pct": round((compound - 1) * 100, 2)})
                else:
                    resultado.append({
                        "fecha": f,
                        "variacion_pct": round((por_fecha[f] / por_fecha[anio_ant] - 1) * 100, 2),
                    })

    elif tipo == "acumulado_anio":
        anio_actual = str(datetime.date.today().year)
        datos_anio = [r for r in datos if r["fecha"].startswith(anio_actual)]
        if not datos_anio:
            return {"error": f"Sin datos para {anio_actual}."}
        if es_porcentaje:
            compound = 1.0
            for r in datos_anio:
                compound *= (1 + r["valor"] / 100)
            acum = round((compound - 1) * 100, 2)
        else:
            primer = datos_anio[0]["valor"]
            ultimo_v = datos_anio[-1]["valor"]
            acum = round((ultimo_v / primer - 1) * 100, 2) if primer else None
        return {
            "tipo": "acumulado_anio",
            "anio": anio_actual,
            "desde": datos_anio[0]["fecha"],
            "hasta": datos_anio[-1]["fecha"],
            "variacion_pct": acum,
            "n_meses": len(datos_anio),
        }

    resultado = resultado[-meses_historial:]
    return {
        "serie": serie_id,
        "titulo": cfg["titulo"],
        "tipo": tipo,
        "unidad_variacion": "% mensual" if tipo == "mensual" else "% interanual",
        "datos": resultado,
        "ultimo": resultado[-1] if resultado else None,
    }


# ── Tool dispatcher ───────────────────────────────────────────────────────────

TOOLS_DEF = [
    {
        "name": "listar_series",
        "description": (
            "Lista todas las series disponibles agrupadas por categoría. "
            "Llamar siempre antes de get_serie si no se conoce el ID exacto."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_serie",
        "description": (
            "Obtiene los datos históricos de una serie macroeconómica. "
            "Devuelve el array completo de {fecha, valor} más el último dato y la variación vs. el período anterior."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "serie_id": {
                    "type": "string",
                    "description": "ID de la serie (usar listar_series para ver opciones válidas)",
                },
                "meses": {
                    "type": "integer",
                    "description": "Meses de historial a traer (default: 12, máximo: 60)",
                    "default": 12,
                },
            },
            "required": ["serie_id"],
        },
    },
    {
        "name": "calcular_variacion",
        "description": (
            "Calcula variaciones porcentuales de una serie. "
            "tipos: 'mensual' (cada período vs. anterior), "
            "'interanual' (cada período vs. mismo período del año anterior), "
            "'acumulado_anio' (acumulado del año en curso)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "serie_id": {"type": "string"},
                "tipo": {
                    "type": "string",
                    "enum": ["mensual", "interanual", "acumulado_anio"],
                },
                "meses_historial": {
                    "type": "integer",
                    "description": "Meses de historial de variaciones a devolver (default: 12)",
                    "default": 12,
                },
            },
            "required": ["serie_id", "tipo"],
        },
    },
]


def ejecutar_tool(nombre: str, args: dict) -> str:
    try:
        if nombre == "listar_series":
            resultado = tool_listar_series()
        elif nombre == "get_serie":
            resultado = tool_get_serie(args["serie_id"], args.get("meses", 12))
        elif nombre == "calcular_variacion":
            resultado = tool_calcular_variacion(
                args["serie_id"], args["tipo"], args.get("meses_historial", 12)
            )
        else:
            resultado = {"error": f"Herramienta desconocida: {nombre}"}
    except Exception as e:
        resultado = {"error": str(e)}
    return json.dumps(resultado, ensure_ascii=False)


# ── Loop del agente ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Sos un analista macroeconómico especializado en Argentina. \
Tenés acceso a datos en tiempo real de las mismas fuentes que usa el sitio MacroAr: \
BCRA v4.0, INDEC/datos.gob.ar, Bluelytics, ArgentinaDatos, y archivos locales \
(Merval, soja, petróleo WTI/Brent, oro, REM).

Cuando respondas:
- Usá las herramientas para traer datos reales antes de hacer afirmaciones numéricas.
- Citá siempre las fechas de los datos que usás.
- Destacá tendencias, contexto y señales relevantes para un analista o periodista.
- Respondé en español argentino, con lenguaje claro pero técnicamente preciso.
- Si te piden un informe, estructuralo con secciones claras.
- No hagas suposiciones sobre valores actuales sin verificar con las herramientas.
"""


def chat(pregunta: str | None = None):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    messages: list[dict] = []
    hoy = datetime.date.today().strftime("%d/%m/%Y")

    print(f"\n{'─'*60}")
    print(f"  Agente Macro AR  —  {hoy}")
    print(f"{'─'*60}")
    print("  Ctrl+C para salir | vacío para salir\n")

    while True:
        if pregunta:
            user_input = pregunta
            pregunta = None
        else:
            try:
                user_input = input("Vos: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nHasta luego.")
                break

        if not user_input:
            break

        messages.append({"role": "user", "content": user_input})

        while True:
            resp = client.messages.create(
                model="claude-opus-4-8",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=TOOLS_DEF,
                messages=messages,
            )

            # Procesar bloques de contenido
            tool_uses = []
            texto_parcial = []
            for bloque in resp.content:
                if bloque.type == "text":
                    texto_parcial.append(bloque.text)
                elif bloque.type == "tool_use":
                    tool_uses.append(bloque)

            if texto_parcial:
                print(f"\nAgente: {''.join(texto_parcial)}\n")

            if resp.stop_reason == "end_turn" or not tool_uses:
                messages.append({"role": "assistant", "content": resp.content})
                break

            # Ejecutar herramientas
            messages.append({"role": "assistant", "content": resp.content})
            tool_results = []
            for tu in tool_uses:
                print(f"  [→ {tu.name}({json.dumps(tu.input, ensure_ascii=False)[:80]}...)]")
                resultado = ejecutar_tool(tu.name, tu.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tu.id,
                    "content": resultado,
                })
            messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    if "ANTHROPIC_API_KEY" not in os.environ:
        print("Error: falta ANTHROPIC_API_KEY. Creá un archivo .env con tu API key.")
        sys.exit(1)

    pregunta_inicial = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else None
    chat(pregunta_inicial)
