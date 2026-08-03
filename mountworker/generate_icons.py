#!/usr/bin/env python3
"""MountWalker PWA 아이콘 생성 스크립트 (Pillow 사용)"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# 마운트워커 브랜드 색상
BG_GRAD_TOP = (27, 67, 50)     # #1b4332
BG_GRAD_BOT = (64, 145, 108)   # #40916c
ACCENT = (255, 209, 102)       # #ffd166
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_gradient(size, top, bottom):
    """수직 그라데이션 배경 생성"""
    img = Image.new("RGB", (size, size), top)
    px = img.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        c = lerp(top, bottom, t)
        for x in range(size):
            px[x, y] = c
    return img


def draw_mountain(size):
    """산모양 로고 그리기 (마운트워커)"""
    img = make_gradient(size, BG_GRAD_TOP, BG_GRAD_BOT)
    draw = ImageDraw.Draw(img, "RGBA")

    pad = int(size * 0.12)
    # 왼쪽 산 (어두운)
    p1 = [pad, size * 0.80, size * 0.42, size * 0.30, size * 0.55, size * 0.55, size * 0.58, size * 0.80]
    draw.polygon([(p1[0], p1[1]), (p1[2], p1[3]), (p1[4], p1[5]), (p1[6], p1[7])],
                 fill=(255, 255, 255, 230))
    # 오른쪽 산 (더 큰)
    p2 = [size * 0.38, size * 0.80, size * 0.62, size * 0.20, size * 0.88, size * 0.80]
    draw.polygon([(p2[0], p2[1]), (p2[2], p2[3]), (p2[4], p2[5])],
                 fill=(255, 255, 255, 245))
    # 눈덮인 정상 (오른쪽)
    peak = size * 0.62
    draw.polygon([
        (peak - size * 0.06, size * 0.27),
        (peak, size * 0.20),
        (peak + size * 0.06, size * 0.27),
        (peak + size * 0.03, size * 0.30),
        (peak - size * 0.03, size * 0.30),
    ], fill=ACCENT + (255,))
    # 눈덮인 정상 (왼쪽)
    lp = size * 0.42
    draw.polygon([
        (lp - size * 0.04, size * 0.36),
        (lp, size * 0.30),
        (lp + size * 0.04, size * 0.36),
    ], fill=ACCENT + (255,))
    # 햇살/원
    draw.ellipse([size * 0.74, size * 0.14, size * 0.88, size * 0.28],
                 fill=ACCENT + (255,))
    return img


def try_font(size):
    fonts = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/D2Coding.ttf",
        "/data/data/com.termux/files/usr/share/fonts/TRoboto-Regular.ttf",
        "/data/data/com.termux/files/usr/share/fonts/OTF/NotoSansCJK-Regular.ttc",
    ]
    for f in fonts:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                pass
    return ImageFont.load_default()


def add_label(img, text):
    """하단에 라벨 텍스트 추가"""
    size = img.width
    draw = ImageDraw.Draw(img, "RGBA")
    font = try_font(int(size * 0.10))
    # 하단 배경바
    draw.rectangle([0, size - int(size * 0.16), size, size],
                   fill=(0, 0, 0, 90))
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) / 2, size - int(size * 0.14)), text,
              font=font, fill=WHITE)


def main():
    os.makedirs(os.path.join(OUT_DIR, "icons"), exist_ok=True)
    configs = [
        ("icons/icon-192.png", 192, False),
        ("icons/icon-512.png", 512, False),
        ("icons/icon-192-maskable.png", 192, True),
        ("icons/icon-512-maskable.png", 512, True),
        ("icons/apple-touch-icon.png", 180, False),
        ("favicon.png", 32, False),
    ]
    for path, size, maskable in configs:
        img = draw_mountain(size)
        if maskable:
            # safe zone: padding 10% 안에 로고가 오도록 새 배경 위에 축소 배치
            bg = make_gradient(size, BG_GRAD_TOP, BG_GRAD_BOT)
            scaled = img.resize((int(size * 0.80), int(size * 0.80)))
            offset = ((size - scaled.width) // 2, (size - scaled.height) // 2)
            bg.paste(scaled, offset)
            img = bg
        full = os.path.join(OUT_DIR, path)
        img.save(full, "PNG", optimize=True)
        print(f"created {path} ({size}x{size})")
    print("아이콘 생성 완료!")


if __name__ == "__main__":
    main()