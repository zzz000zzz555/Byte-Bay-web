
# ============================================================
# CONFIGURACION (editar aqui)
# ============================================================
CONFIG = {
    "csv_path": "productos_full.csv",
    "output_dir": "afiches_generados",
    "zip_name": "afiches_productos.zip",
    "width": 1080,
    "height": 1080,
    "scale": 2,
    "brand_name": "BYTE BAY",
    "brand_url": "zzz000zzz555.github.io/Byte-Bay-web",
    "currency": "S/ ",
    "col_id": "id",
    "col_nombre": "nombre",
    "col_categoria": "categoria",
    "col_marca": "marca",
    "col_caracteristicas": "caracteristicas",
    "col_variantes": "variantes",
    "col_disponibilidad": "disponibilidad",
    "col_precio": "precio",
    "col_imagen": "imagen",
    "col_imagenes_extra": "imagenes_extra",
    "col_descripcion": "descripcion",
    "col_sku": "id",
    "concurrency": 6,
    "brand_color": (16, 57, 64),       # #103940 navy
    "accent_color": (217, 244, 91),    # #d9f45b lime
    "price_color": (242, 102, 79),     # #f2664f coral
    "stock_color": (22, 163, 74),
    "bg_color": (247, 246, 240),       # cream
}
# ============================================================

import csv, os, sys, zipfile, logging, asyncio, base64
from tqdm.asyncio import tqdm
from playwright.async_api import async_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "errores.log")
logging.basicConfig(filename=LOG_FILE, level=logging.ERROR,
                    format="%(asctime)s - %(levelname)s - %(message)s")

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: {W}px; height: {H}px; overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    background: linear-gradient(135deg, #103940 0%, #1a5a63 50%, #0f292b 100%);
    position: relative;
  }
  .pattern { position: absolute; inset: 0; opacity: 0.08; background-image: radial-gradient(circle at 1px 1px, #d9f45b 1px, transparent 0); background-size: 40px 40px; }
  .glow1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(217,244,91,0.18), transparent 70%); top: -150px; right: -150px; filter: blur(60px); }
  .glow2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(242,102,79,0.15), transparent 70%); bottom: -120px; left: -120px; filter: blur(60px); }
  .card {
    position: absolute; top: 30px; left: 40px; right: 40px; bottom: 30px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.15);
    display: grid;
    grid-template-columns: 52% 48%;
    gap: 28px;
    padding: 28px 32px;
    z-index: 2;
  }
  .header {
    grid-column: 1 / -1;
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 3px solid #d9f45b;
  }
  .brand { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 30px; color: #103940; letter-spacing: -1.5px; }
  .brand span { color: #718b00; }
  .badge-pill { background: #103940; color: #d9f45b; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
  .img-col { display: flex; flex-direction: column; gap: 12px; }
  .img-main { background: #f7f6f0; border: 1px solid #dfe5e3; border-radius: 18px; padding: 16px; display: flex; align-items: center; justify-content: center; height: 100%; min-height: 420px; position: relative; }
  .img-main img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .sku-badge { position: absolute; top: 12px; left: 12px; background: rgba(16,57,64,0.85); color: #d9f45b; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: 'DM Sans', monospace; letter-spacing: 0.5px; }
  .img-thumbs { display: flex; gap: 8px; }
  .img-thumb { width: 64px; height: 64px; border: 1.5px solid #dfe5e3; border-radius: 10px; padding: 4px; background: #fff; display: flex; align-items: center; justify-content: center; }
  .img-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .info-col { display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
  .eyebrow { font-size: 12px; font-weight: 700; color: #718b00; letter-spacing: 2px; text-transform: uppercase; }
  .title { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 36px; line-height: 1.12; color: #103940; margin-right: 8px; }
  .price-block { background: linear-gradient(135deg, #f7f6f0, #eef3dc); border: 1px solid #dfe5e3; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .price { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 46px; color: #f2664f; letter-spacing: -1px; }
  .price-meta { font-size: 11px; color: #607278; font-weight: 500; text-align: right; }
  .stock-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(22,163,74,0.12); color: #16a34a; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid rgba(22,163,74,0.25); }
  .stock-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; }
  .desc { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #475569; line-height: 1.6; }
  .section-label { font-size: 11px; font-weight: 700; color: #103940; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
  .spec-item { display: flex; flex-direction: column; gap: 2px; }
  .spec-label { font-size: 10px; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
  .spec-value { font-size: 13px; color: #103940; font-weight: 700; }
  .variants { display: flex; flex-wrap: wrap; gap: 8px; }
  .variant { border: 1.5px solid #dfe5e3; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 600; color: #334155; background: #fff; }
  .cta { margin-top: auto; }
  .cta-btn { width: 100%; background: linear-gradient(135deg, #103940, #1c525b); color: #d9f45b; border: none; border-radius: 14px; padding: 16px 24px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 24px rgba(16,57,64,0.35); }
  .cta-btn svg { width: 20px; height: 20px; }
  .trust { display: flex; gap: 16px; font-size: 11px; color: #607278; font-weight: 500; justify-content: center; }
  .trust span { display: flex; align-items: center; gap: 4px; }
  .footer { position: absolute; bottom: 14px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; z-index: 2; }
  .svg-icon { width: 16px; height: 16px; stroke: #64748b; fill: none; stroke-width: 1.5; }
</style>
</head>
<body>
  <div class="pattern"></div>
  <div class="glow1"></div>
  <div class="glow2"></div>
  <div class="card">
    <div class="header">
      <div class="brand">BYTE<span>BAY</span></div>
      <div class="badge-pill">CATÁLOGO OFICIAL • BYTE BAY</div>
    </div>
    <div class="img-col">
      <div class="img-main">
        {SKU_BADGE}
        <img src="{IMG}" alt="{NOMBRE}">
      </div>
      {THUMBS}
    </div>
    <div class="info-col">
      <div class="eyebrow">{MARCA} • {CATEGORIA}</div>
      <div class="title">{NOMBRE}</div>
      <div class="price-block">
        <div class="price">{PRECIO}</div>
        <div>
          <div class="stock-pill"><span class="stock-dot"></span>{DISPONIBILIDAD}</div>
          <div class="price-meta">Precio online • IGV incluido</div>
        </div>
      </div>
      <div class="desc">{DESCRIPCION}</div>
      <div>
        <div class="section-label">Características</div>
        <div class="specs-grid">{SPECS}</div>
      </div>
      <div>
        <div class="section-label">Variantes disponibles</div>
        <div class="variants">{VARIANTES}</div>
      </div>
      <div class="cta">
        <button class="cta-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          Agregar al carrito
        </button>
      </div>
      <div class="trust">
        <span><svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Pago seguro</span>
        <span><svg class="svg-icon" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>Envío a todo el Perú</span>
        <span><svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Garantía oficial</span>
      </div>
    </div>
  </div>
  <div class="footer">
    <span>{BRAND} © 2026</span>
    <span>{URL}</span>
  </div>
</body>
</html>
"""

def build_html(row, cfg):
    def esc(s): return (s or "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    nombre = row.get(cfg["col_nombre"], "Producto")
    marca = row.get(cfg["col_marca"], "")
    cat = row.get(cfg["col_categoria"], "")
    precio = row.get(cfg["col_precio"], "0")
    try: precio_fmt = f"{cfg['currency']}{float(precio):,.2f}"
    except: precio_fmt = f"{cfg['currency']}{precio}"
    disp = row.get(cfg["col_disponibilidad"], "En Stock")
    desc = row.get(cfg["col_descripcion"], "")
    car = row.get(cfg["col_caracteristicas"], "")
    var_ = row.get(cfg["col_variantes"], "")
    img = row.get(cfg["col_imagen"], "")
    sku = row.get(cfg["col_sku"], "")
    if not os.path.isabs(img):
        img = os.path.join(BASE_DIR, img)
    import base64
    if os.path.exists(img):
        with open(img, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        ext = os.path.splitext(img)[1].lower().replace(".", "")
        mime = "image/webp" if ext == "webp" else "image/jpeg"
        img_src = f"data:{mime};base64,{b64}"
    else:
        img_src = ""

    # specs grid (2 columns): parse "key: value" pairs if present, else split by comma
    specs_items = []
    for c in car.split(","):
        c = c.strip()
        if not c: continue
        if ":" in c:
            k, v = c.split(":", 1)
            specs_items.append((k.strip(), v.strip()))
        else:
            specs_items.append(("Característica", c))
    # ensure at least some specs
    if not specs_items:
        specs_items = [("Marca", marca), ("Categoría", cat), ("Presentación", "Única")]
    specs_html = "".join(f'<div class="spec-item"><span class="spec-label">{esc(k)}</span><span class="spec-value">{esc(v)}</span></div>' for k, v in specs_items)

    extra_raw = row.get(cfg.get("col_imagenes_extra", "imagenes_extra"), "") or ""
    extra_imgs = [x.strip() for x in extra_raw.split(",") if x.strip()]
    if extra_imgs:
        thumbs_html = '<div class="img-thumbs">' + "".join(f'<div class="img-thumb"><img src="{esc(x)}" alt=""></div>' for x in extra_imgs[:3]) + '</div>'
    else:
        thumbs_html = ''
    seal_html = ''  # removed green seal

    variants = "".join(f'<div class="variant">{esc(v.strip())}</div>' for v in var_.split("|") if v.strip()) if var_ else '<div class="variant">Única presentación</div>'

    # sku badge
    if extra_imgs:
        sku_badge = ''
    else:
        sku_badge = f'<div class="sku-badge">SKU: {esc(str(sku))}</div>'

    html = HTML_TEMPLATE
    html = html.replace("{W}", str(cfg["width"]))
    html = html.replace("{H}", str(cfg["height"]))
    html = html.replace("{IMG}", img_src)
    html = html.replace("{NOMBRE}", esc(nombre))
    html = html.replace("{MARCA}", esc(marca))
    html = html.replace("{CATEGORIA}", esc(cat))
    html = html.replace("{PRECIO}", precio_fmt)
    html = html.replace("{DISPONIBILIDAD}", esc(disp))
    html = html.replace("{DESCRIPCION}", esc(desc))
    html = html.replace("{SPECS}", specs_html)
    html = html.replace("{VARIANTES}", variants)
    html = html.replace("{BRAND}", esc(cfg["brand_name"]))
    html = html.replace("{URL}", esc(cfg["brand_url"]))
    html = html.replace("{SKU_BADGE}", sku_badge)
    html = html.replace("{THUMBS}", thumbs_html)
    return html

async def render_one(browser, row, cfg, sem):
    async with sem:
        page = await browser.new_page(viewport={"width": cfg["width"], "height": cfg["height"]}, device_scale_factor=cfg["scale"])
        html = build_html(row, cfg)
        await page.set_content(html, wait_until="networkidle")
        await page.wait_for_timeout(600)
        out_dir = os.path.join(BASE_DIR, cfg["output_dir"])
        os.makedirs(out_dir, exist_ok=True)
        pid = row.get(cfg["col_id"], "sin_id")
        safe = "".join(c if c.isalnum() else "_" for c in str(pid))
        out_path = os.path.join(out_dir, f"afiche_{safe}.png")
        await page.screenshot(path=out_path, type="png")
        await page.close()
        return out_path

async def main():
    cfg = CONFIG
    csv_path = os.path.join(BASE_DIR, cfg["csv_path"])
    if not os.path.exists(csv_path):
        print(f"No se encontro {csv_path}")
        sys.exit(1)

    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)

    print(f"Productos a procesar: {len(rows)}")
    out_paths = []
    batch_size = 250
    batches = [rows[i:i+batch_size] for i in range(0, len(rows), batch_size)]
    for bi, batch in enumerate(batches, 1):
        print(f"--- Lote {bi}/{len(batches)} ({len(batch)} productos) ---")
        sem = asyncio.Semaphore(cfg["concurrency"])
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            tasks = [render_one(browser, r, cfg, sem) for r in batch]
            for fut in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc=f"Lote {bi}"):
                try:
                    res = await fut
                    if res:
                        out_paths.append(res)
                except Exception as e:
                    logging.error(f"Error: {e}")
            await browser.close()
        # recycle: small pause
        await asyncio.sleep(1)

    zip_path = os.path.join(BASE_DIR, cfg["zip_name"])
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for pth in out_paths:
            zf.write(pth, os.path.basename(pth))
    error_count = 0
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, encoding="utf-8") as lf:
            error_count = sum(1 for _ in lf)
    zip_size = os.path.getsize(zip_path) / (1024*1024)
    print(f"\n=== RESUMEN FINAL ===")
    print(f"Afiches generados: {len(out_paths)}")
    print(f"Errores registrados: {error_count}")
    print(f"Peso del ZIP: {zip_size:.2f} MB")
    print(f"Archivo: {zip_path}")

if __name__ == "__main__":
    asyncio.run(main())
