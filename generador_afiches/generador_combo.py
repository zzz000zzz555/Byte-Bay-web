
import json, os, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from collections import defaultdict

BASE = r"D:\PROYECTO DE COMERSIO ELECTRONICO\Beru"
OUT = os.path.join(BASE, "img", "productos")
SUPABASE = "https://inwugycvtaaceugvtfpv.supabase.co"
KEY = "sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u"

USE_REMBG = False

def fetch(path):
    req = urllib.request.Request(SUPABASE + path, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def remove_white_bg(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def procesar_producto(path, max_dim):
    img = Image.open(path).convert("RGBA")
    if USE_REMBG:
        try:
            from rembg import remove
            img = remove(img)
        except Exception:
            img = remove_white_bg(img)
    else:
        img = remove_white_bg(img)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    return img

def crear_imagen_combo(img_paths, output_path, size=(800, 800)):
    canvas = Image.new("RGBA", size, (22, 30, 46, 255))
    # radial glow
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_glow = ImageDraw.Draw(glow)
    draw_glow.ellipse((150, 150, 650, 650), fill=(45, 62, 95, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    canvas = Image.alpha_composite(canvas, glow)

    imgs = []
    for p in img_paths[:2]:
        if not os.path.exists(p):
            continue
        imgs.append(procesar_producto(p, 340 if len(imgs) == 0 else 320))

    if not imgs:
        return False

    if len(imgs) == 1:
        prod1 = imgs[0]
        x1 = (size[0] - prod1.width) // 2
        y1 = (size[1] - prod1.height) // 2
        canvas.paste(prod1, (x1, y1), prod1)
    else:
        prod1, prod2 = imgs[0], imgs[1]
        x1 = 210 - (prod1.width // 2)
        y1 = (size[1] - prod1.height) // 2
        x2 = 590 - (prod2.width // 2)
        y2 = (size[1] - prod2.height) // 2
        canvas.paste(prod1, (x1, y1), prod1)
        canvas.paste(prod2, (x2, y2), prod2)

    # + icon in center
    draw = ImageDraw.Draw(canvas)
    cx, cy, r = size[0] // 2, size[1] // 2, 28
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(30, 41, 59, 240), outline=(56, 189, 248, 180), width=3)
    draw.line((cx - 10, cy, cx + 10, cy), fill=(255, 255, 255, 255), width=4)
    draw.line((cx, cy - 10, cx, cy + 10), fill=(255, 255, 255, 255), width=4)

    canvas.convert("RGB").save(output_path, "WEBP", quality=92, method=6)
    print(f"Generado: {output_path}")
    return True

# fetch data
packs = fetch("/rest/v1/packs?select=*&order=id.asc")
items = fetch("/rest/v1/pack_items?select=*")
prods = fetch("/rest/v1/productos?select=id,url_imagen")
prodmap = {p["id"]: p for p in prods}

from collections import defaultdict
items_by_pack = defaultdict(list)
for it in items:
    items_by_pack[it["id_pack"]].append(it)

for pk in packs:
    pid = pk["id"]
    its = items_by_pack.get(pid, [])
    img_paths = []
    for it in its[:2]:
        p = prodmap.get(it["id_producto"])
        if p and p.get("url_imagen"):
            img_paths.append(os.path.join(BASE, p["url_imagen"].replace("/", "\\")))
    out_path = os.path.join(OUT, f"pack-{pid}.webp")
    ok = crear_imagen_combo(img_paths, out_path)
    if not ok:
        print(f"SKIP pack {pid}")

print("done")
