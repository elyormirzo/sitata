# uslub.css dagi ranglarni tun rejimi uchun o'zgaruvchilarga aylantiradi va [data-mavzu=tun] blokini yozadi.
# Ishlatish: python3 asboblar/tun-rejimi.py uslub.css  (uslub.css ga yangi rang qo'shilganda qayta ishga tushiring)
import re, sys, colorsys
p = sys.argv[1]
s = open(p, encoding="utf8").read()
BOSH, OXIR = "/* ===== TUN REJIMI (avto: asboblar/tun-rejimi.py) ===== */", "/* ===== /TUN REJIMI ===== */"
if BOSH in s: s = s[:s.index(BOSH)] + s[s.index(OXIR) + len(OXIR):]
s = s.rstrip() + "\n"
s = re.sub(r"var\(--t[bcm]-[0-9a-f]+(?:-\d+)?, (#[0-9A-Fa-f]+|rgba?\([^)]*\))\)", r"\1", s)  # qayta ishga tushirishda — asl rangga qaytarib, qaytadan hisoblash
def rgb(h):
    h = h.lstrip("#")
    if len(h) == 3: h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def hls(c): return colorsys.rgb_to_hls(*(x / 255 for x in c))
def back(h, l, s_): return tuple(round(x * 255) for x in colorsys.hls_to_rgb(h, l, s_))
def fon(c):      # ochiq fon → qorong'i, tartib saqlanadi (karta fondan biroz ochroq)
    h, l, s_ = hls(c)
    if l < 0.62: return None
    return back(h, 0.10 + (l - 0.62) / 0.38 * 0.11, s_ * 0.35)
def chiziq(c):   # chegara: ochiq → o'rta qorong'i; juda to'q → ochiq
    h, l, s_ = hls(c)
    if l >= 0.62: return back(h, 0.20 + (l - 0.62) * 0.35, s_ * 0.35)
    if l < 0.25: return back(h, 0.80, s_ * 0.5)
    return None
def matn(c):     # to'q matn → ochiq
    h, l, s_ = hls(c)
    if l >= 0.42: return None
    return back(h, 0.92 - l * 0.45, min(s_ * 0.55, 0.35))
KAT = [(re.compile(r"^(background(-color|-image)?)$"), "b", fon),
       (re.compile(r"^(border(-(top|right|bottom|left))?(-color)?|outline(-color)?|text-decoration-color|column-rule(-color)?)$"), "c", chiziq),
       (re.compile(r"^(color|fill|stroke|caret-color|-webkit-text-fill-color|accent-color)$"), "m", matn)]
RANG = re.compile(r"#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)")
tun = {}
def almash(val, kat, fn):
    def r(m):
        t = m.group(0)
        if t.startswith("#"): c, a = rgb(t), None
        else:
            n = [x.strip() for x in t[t.index("(") + 1:-1].split(",")]
            c, a = tuple(int(x) for x in n[:3]), (n[3] if len(n) > 3 else None)
        y = fn(c)
        if y is None: return t
        nom = "--t" + kat + "-" + "%02x%02x%02x" % c + ("-" + a.replace(".", "") if a else "")
        tun[nom] = ("#%02x%02x%02x" % y) if a is None else "rgba(%d,%d,%d,%s)" % (*y, a)
        return "var(%s, %s)" % (nom, t)
    return RANG.sub(r, val)
DEKL = re.compile(r"(?<=[{;\s])([a-z-]+)(\s*:\s*)([^;{}]+?)(?=\s*[;}])")
def dekl(m):
    prop, sep, val = m.groups()
    if "var(--t" in val: return m.group(0)
    for rx, kat, fn in KAT:
        if rx.match(prop): return prop + sep + almash(val, kat, fn)
    if prop == "background" or prop.startswith("border"): pass
    return m.group(0)
# :root blokini o'zgartirmaymiz
i = s.index(":root {"); j = s.index("}", i) + 1
s = s[:j] + DEKL.sub(dekl, s[j:])
ROOT = {"--fon": "#1A1511", "--qogoz": "#272019", "--qora": "#EBE0CC", "--kulrang": "#B3A083", "--teri": "#C77650",
        "--teri-toq": "#E09A75", "--zaytun": "#66764A", "--zaytun-och": "#2B3123", "--qizil-och": "#3A261C", "--chegara": "#3F352A"}
blok = "html[data-mavzu=\"tun\"] {\n  color-scheme: dark;\n" + "".join("  %s: %s;\n" % kv for kv in list(ROOT.items()) + sorted(tun.items())) + "}\n"
blok += "html[data-mavzu=\"tun\"] img:not([src$=\".svg\"]) { filter: brightness(.92); }\n"
s += "\n" + BOSH + "\n" + blok + OXIR + "\n"
open(p, "w", encoding="utf8").write(s)
print("o'zgaruvchilar:", len(tun))
