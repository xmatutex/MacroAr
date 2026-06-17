"""
Trae datos de mercado que no se pueden consumir desde el browser por CORS
(Yahoo Finance) y los guarda como JSON local en data/.

Uso:
    python fetch_mercados.py

Pensado para correr en GitHub Actions junto con subir_datos.py.
"""
import sys
import json
import os
import datetime
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = 'data'
os.makedirs(OUTPUT_DIR, exist_ok=True)


def fetch_yahoo(symbol, nombre, rango='5y', factor=1.0):
    """
    Descarga precios de cierre diarios desde Yahoo Finance.
    factor: multiplicador para convertir unidades (ej. centavos→USD, bushels→toneladas).
    """
    print(f"Trayendo {nombre} ({symbol}) desde Yahoo Finance...")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?interval=1d&range={rango}"
    )
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=20).read())
        result = data['chart']['result'][0]
        timestamps = result['timestamp']
        closes = result['indicators']['quote'][0]['close']
        registros = [
            {
                'fecha': datetime.datetime.fromtimestamp(
                    t, datetime.timezone.utc
                ).strftime('%Y-%m-%d'),
                'valor': round(c * factor, 2),
            }
            for t, c in zip(timestamps, closes)
            if c is not None
        ]
        ruta = os.path.join(OUTPUT_DIR, f'{nombre}.json')
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(registros, f, ensure_ascii=False, indent=2)
        print(f"✅ {len(registros)} registros guardados en {ruta}")
    except Exception as e:
        print(f"❌ Error al traer {nombre}: {e}")


if __name__ == "__main__":
    # ^MERV = índice Merval (Bolsa de Buenos Aires)
    fetch_yahoo('%5EMERV', 'merval')
    # GC=F = futuro de oro COMEX (USD/oz)
    fetch_yahoo('GC%3DF', 'oro', rango='5y')
    # ZS=F = futuro de soja CBOT (cotiza en centavos/bushel)
    # factor = 36.7437 / 100 convierte centavos/bushel → USD/tonelada métrica
    fetch_yahoo('ZS%3DF', 'soja', rango='5y', factor=36.7437 / 100)
    # CL=F = futuro de petróleo WTI NYMEX (USD/barril)
    fetch_yahoo('CL%3DF', 'wti', rango='5y')
    # BZ=F = futuro de petróleo Brent ICE (USD/barril)
    fetch_yahoo('BZ%3DF', 'brent', rango='5y')
