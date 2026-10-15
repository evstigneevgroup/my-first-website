#!/usr/bin/env python3
import sys, argparse
from PIL import Image

CH = " .:-=+*#%@"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("img")
    ap.add_argument("--width", type=int, default=100)
    ap.add_argument("--mode", choices=["lum", "alpha", "edge"], default="lum")
    ap.add_argument("--bg", default="white")
    ap.add_argument("--invert", action="store_true")
    a = ap.parse_args()

    im = Image.open(a.img).convert("RGBA")
    bgmap = {"white": (255,255,255,255), "black": (0,0,0,255), "gray": (128,128,128,255), "checker": (60,60,70,255)}
    bg = bgmap.get(a.bg, (255,255,255,255))
    flat = Image.new("RGBA", im.size, bg)
    flat.alpha_composite(im)

    W = a.width
    H = max(1, int(im.height / im.width * W * 0.5))
    small = flat.resize((W, H))

    if a.mode == "alpha":
        small = im.resize((W, H))
        print("alpha map of", a.img)
        for y in range(H):
            line = ""
            for x in range(W):
                al = small.getpixel((x, y))[3]
                line += CH[min(len(CH)-1, al * len(CH)//256)]
            print(line)
        return

    print(f"{a.mode} of {a.img}  ({im.width}x{im.height}) bg={a.bg}")
    for y in range(H):
        line = ""
        for x in range(W):
            rr, gg, bb, _ = small.getpixel((x, y))
            lum = (0.299*rr + 0.587*gg + 0.114*bb) / 255
            if a.invert:
                lum = 1 - lum
            line += CH[min(len(CH)-1, int(lum * (len(CH)-1)))]
        print(line)

if __name__ == "__main__":
    main()
