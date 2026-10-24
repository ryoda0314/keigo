"""A placeholder icon for ことのえだ until the maker chooses a picture (CONCEPT.md, デザイン): an open book, a branch
growing up from it, and three leaves at three heights (下枝・中つ枝・上つ枝), in the family's paper, ink and accent.

    python design/make-icon.py

writes public/icons/ (icon-192, icon-512 with transparent corners; maskable-512 on a full square), src/app/icon.png,
src/app/apple-icon.png and src/app/favicon.ico.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
S = 2048  # drawn large, then scaled down (smooth edges)

PAPER = (252, 251, 248, 255)
INK = (23, 32, 51, 255)
ACCENT = (10, 100, 240, 255)
TINT = (230, 240, 255, 255)
AGAIN = (106, 79, 224, 255)
LINE = (212, 217, 225, 255)


def leaf(draw: ImageDraw.ImageDraw, base, angle_deg: float, length: float, width: float, fill):
    """A lens-shaped leaf from `base`, pointing at `angle_deg` (0 = right, 90 = up)."""
    a = math.radians(angle_deg)
    d = (math.cos(a), -math.sin(a))
    p = (-d[1], d[0])
    left, right = [], []
    for i in range(41):
        t = i / 40
        w = width / 2 * math.sin(math.pi * t) ** 0.9
        cx, cy = base[0] + d[0] * length * t, base[1] + d[1] * length * t
        left.append((cx + p[0] * w, cy + p[1] * w))
        right.append((cx - p[0] * w, cy - p[1] * w))
    draw.polygon(left + right[::-1], fill=fill)
    # The vein.
    draw.line([base, (base[0] + d[0] * length * 0.85, base[1] + d[1] * length * 0.85)], fill=PAPER, width=int(S * 0.008))


def curve(p0, p1, p2, n=40):
    """A quadratic Bézier curve as points."""
    return [
        ((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1])
        for t in (i / n for i in range(n + 1))
    ]


def artwork(full_square: bool) -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if full_square:
        draw.rectangle([0, 0, S, S], fill=PAPER)
    else:
        draw.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=PAPER, outline=LINE, width=int(S * 0.006))

    # Everything sits in the middle 80% (the maskable safe zone).
    k = 0.8 if full_square else 0.9
    def at(x, y):
        return (S / 2 + (x - 0.5) * S * k, S / 2 + (y - 0.5) * S * k)

    stroke = int(S * 0.026)

    # The open book.
    spine_top, spine_bottom = at(0.5, 0.74), at(0.5, 0.84)
    for side in (-1, 1):
        outer_top, outer_bottom = at(0.5 + side * 0.33, 0.70), at(0.5 + side * 0.33, 0.80)
        page = curve(spine_top, at(0.5 + side * 0.16, 0.68), outer_top) + curve(outer_bottom, at(0.5 + side * 0.16, 0.78), spine_bottom)
        draw.polygon(page, fill=TINT)
        draw.line(curve(spine_top, at(0.5 + side * 0.16, 0.68), outer_top), fill=INK, width=stroke, joint="curve")
        draw.line(curve(spine_bottom, at(0.5 + side * 0.16, 0.78), outer_bottom), fill=INK, width=stroke, joint="curve")
        draw.line([outer_top, outer_bottom], fill=INK, width=stroke)
    draw.line([spine_top, spine_bottom], fill=INK, width=stroke)

    # The branch, growing up from the book and forking twice.
    trunk = curve(at(0.5, 0.74), at(0.48, 0.48), at(0.52, 0.22))
    draw.line(trunk, fill=INK, width=int(stroke * 1.15), joint="curve")
    low = curve(at(0.495, 0.60), at(0.40, 0.57), at(0.30, 0.50))
    mid = curve(at(0.49, 0.44), at(0.60, 0.42), at(0.68, 0.33))
    draw.line(low, fill=INK, width=stroke, joint="curve")
    draw.line(mid, fill=INK, width=stroke, joint="curve")

    # Three leaves at three heights: 下枝 (tint), 中つ枝 (accent), 上つ枝 (again violet).
    leaf(draw, low[-1], 150, S * k * 0.17, S * k * 0.085, (154, 190, 245, 255))
    leaf(draw, mid[-1], 40, S * k * 0.18, S * k * 0.09, ACCENT)
    leaf(draw, trunk[-1], 95, S * k * 0.19, S * k * 0.095, AGAIN)
    for dot in (low[-1], mid[-1], trunk[-1]):
        r = stroke * 0.6
        draw.ellipse([dot[0] - r, dot[1] - r, dot[0] + r, dot[1] + r], fill=INK)
    return img


def save(img: Image.Image, size: int, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path)


def main():
    card = artwork(full_square=False)
    square = artwork(full_square=True)
    save(card, 192, ROOT / "public/icons/icon-192.png")
    save(card, 512, ROOT / "public/icons/icon-512.png")
    save(square, 512, ROOT / "public/icons/maskable-512.png")
    save(card, 512, ROOT / "src/app/icon.png")
    save(square, 180, ROOT / "src/app/apple-icon.png")
    card.resize((64, 64), Image.LANCZOS).save(ROOT / "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("icons written")


if __name__ == "__main__":
    main()
