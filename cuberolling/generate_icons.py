from PIL import Image, ImageDraw, ImageFilter

def generate_cube_icon(size):
    img = Image.new('RGBA', (size, size), (13, 17, 23, 255))
    draw = ImageDraw.Draw(img)

    # Draw rounded background card
    margin = int(size * 0.05)
    card_bounds = [margin, margin, size - margin, size - margin]
    draw.rounded_rectangle(card_bounds, radius=int(size * 0.18), fill=(22, 27, 34, 255), outline=(59, 130, 246, 180), width=int(size * 0.015))

    # Isometric Cube grid drawing
    cx, cy = size // 2, size // 2
    s = int(size * 0.22)

    # Colors
    c_top = (255, 255, 255, 240)    # White
    c_left = (255, 107, 0, 240)    # Orange
    c_right = (0, 176, 80, 240)    # Green

    # Top face
    top_poly = [
        (cx, cy - s),
        (cx + int(s * 0.866), cy - int(s * 0.5)),
        (cx, cy),
        (cx - int(s * 0.866), cy - int(s * 0.5))
    ]
    draw.polygon(top_poly, fill=c_top, outline=(20, 20, 25, 255))

    # Left face
    left_poly = [
        (cx - int(s * 0.866), cy - int(s * 0.5)),
        (cx, cy),
        (cx, cy + s),
        (cx - int(s * 0.866), cy + int(s * 0.5))
    ]
    draw.polygon(left_poly, fill=c_left, outline=(20, 20, 25, 255))

    # Right face
    right_poly = [
        (cx, cy),
        (cx + int(s * 0.866), cy - int(s * 0.5)),
        (cx + int(s * 0.866), cy + int(s * 0.5)),
        (cx, cy + s)
    ]
    draw.polygon(right_poly, fill=c_right, outline=(20, 20, 25, 255))

    # Inner grid lines for 3x3 feel
    for i in range(1, 3):
        t = i / 3.0
        # Top grid
        p1 = (int(cx * (1-t) + (cx - s * 0.866)*t), int((cy-s)*(1-t) + (cy - s * 0.5)*t))
        p2 = (int((cx + s * 0.866)*(1-t) + cx*t), int((cy-s*0.5)*(1-t) + cy*t))
        draw.line([p1, p2], fill=(20, 20, 25, 255), width=max(1, int(size * 0.01)))

        p3 = (int(cx * (1-t) + (cx + s * 0.866)*t), int((cy-s)*(1-t) + (cy - s * 0.5)*t))
        p4 = (int((cx - s * 0.866)*(1-t) + cx*t), int((cy-s*0.5)*(1-t) + cy*t))
        draw.line([p3, p4], fill=(20, 20, 25, 255), width=max(1, int(size * 0.01)))

    return img

icon192 = generate_cube_icon(192)
icon192.save('/storage/emulated/0/Documents/workspace/geminihaha.github.com/cuberolling/icons/icon-192.png')

icon512 = generate_cube_icon(512)
icon512.save('/storage/emulated/0/Documents/workspace/geminihaha.github.com/cuberolling/icons/icon-512.png')

print("Icons generated successfully!")
