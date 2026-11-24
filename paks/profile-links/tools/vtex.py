#!/usr/bin/env python3
"""Compile a 64x64 RGBA PNG into a Source 2 vtex_c.

The texture header is the public vtex DATA layout (version 1, BGRA8888):
flags (NO_LOD), reflectivity, width, height, depth, format, mips (smallest
first), then the pixels after the DATA block (fileSize = DATA end). This is
this repo's compiler. It does not use a borrowed RED2 block.
"""
import struct
import sys
import zlib
from pathlib import Path

# SPEC-OPEN O-P8: pixels are the sites' own logos, scaled with Lanczos. Publishing them is a question for the site owners.
PNG_SIG = b'\x89PNG\r\n\x1a\n'


def read_png(path):
    data = Path(path).read_bytes()
    if not data.startswith(PNG_SIG):
        raise SystemExit(path + ' is not a PNG')
    pos = 8
    width = height = None
    raw = b''
    while pos + 8 <= len(data):
        length = struct.unpack('>I', data[pos:pos + 4])[0]
        kind = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if kind == b'IHDR':
            width, height, bit, color, _comp, _filt, inter = struct.unpack('>IIBBBBB', chunk[:13])
            if bit != 8 or color != 6 or inter != 0:
                raise SystemExit(path + ' must be 8-bit non-interlaced RGBA')
        elif kind == b'IDAT':
            raw += chunk
        elif kind == b'IEND':
            break
    if not width:
        raise SystemExit(path + ' has no IHDR')
    plain = zlib.decompress(raw)
    stride = width * 4
    rows = []
    i = 0
    prev = bytearray(stride)
    for _ in range(height):
        filt = plain[i]
        i += 1
        row = bytearray(plain[i:i + stride])
        i += stride
        if filt == 0:
            pass
        elif filt == 1:
            for x in range(stride):
                left = row[x - 4] if x >= 4 else 0
                row[x] = (row[x] + left) & 255
        elif filt == 2:
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                left = row[x - 4] if x >= 4 else 0
                row[x] = (row[x] + ((left + prev[x]) // 2)) & 255
        elif filt == 4:
            for x in range(stride):
                left = row[x - 4] if x >= 4 else 0
                up = prev[x]
                ul = prev[x - 4] if x >= 4 else 0
                p = left + up - ul
                pa, pb, pc = abs(p - left), abs(p - up), abs(p - ul)
                pred = left if pa <= pb and pa <= pc else up if pb <= pc else ul
                row[x] = (row[x] + pred) & 255
        else:
            raise SystemExit(path + ' uses filter ' + str(filt))
        rows.append(bytes(row))
        prev = row
    return width, height, b''.join(rows)


def rgba_to_bgra(buf):
    """Convert tightly packed RGBA8888 bytes to BGRA8888."""
    out = bytearray(buf)
    out[0::4] = buf[2::4]
    out[2::4] = buf[0::4]
    return bytes(out)


def downsample_rgba(w, h, buf):
    """Downsample RGBA8888 by 2x using alpha-weighted box filtering."""
    nw, nh = max(1, w // 2), max(1, h // 2)
    out = bytearray(nw * nh * 4)
    for y in range(nh):
        y0 = min(2 * y, h - 1)
        y1 = min(2 * y + 1, h - 1)
        for x in range(nw):
            x0 = min(2 * x, w - 1)
            x1 = min(2 * x + 1, w - 1)
            coords = ((x0, y0), (x1, y0), (x0, y1), (x1, y1))
            r_sum = g_sum = b_sum = a_sum = 0
            for sx, sy in coords:
                off = (sy * w + sx) * 4
                r, g, b, a = buf[off:off + 4]
                r_sum += r * a
                g_sum += g * a
                b_sum += b * a
                a_sum += a
            dst = (y * nw + x) * 4
            a_out = (a_sum + 2) // 4
            if a_sum > 0:
                half = a_sum // 2
                out[dst] = (r_sum + half) // a_sum
                out[dst + 1] = (g_sum + half) // a_sum
                out[dst + 2] = (b_sum + half) // a_sum
            out[dst + 3] = a_out
    return nw, nh, bytes(out)


def build_mips(width, height, rgba):
    """Build a smallest-first BGRA8888 mip chain for power-of-two textures."""
    is_pow2 = width > 0 and height > 0 and (width & (width - 1)) == 0 and (height & (height - 1)) == 0
    if not is_pow2:
        return 1, rgba_to_bgra(rgba)
    levels = [rgba]
    w, h, cur = width, height, rgba
    while w > 1 or h > 1:
        w, h, cur = downsample_rgba(w, h, cur)
        levels.append(cur)
    levels.reverse()
    return len(levels), b''.join(rgba_to_bgra(lvl) for lvl in levels)


def resource(data_block, tail):
    """Pack a DATA-only Source 2 resource where fileSize marks the end of DATA."""
    blocks = [(b'DATA', data_block)]
    # 16 byte header + 12 bytes per block, then 16-byte aligned block bodies.
    table = 16 + 12 * len(blocks)
    def align(n):
        return (n + 15) // 16 * 16
    offset = align(table)
    body_at = []
    cursor = offset
    for _, body in blocks:
        body_at.append(cursor)
        cursor = align(cursor + len(body))
    res_size = body_at[-1] + len(blocks[-1][1])
    out = bytearray(body_at[0])
    struct.pack_into('<IHHII', out, 0, res_size, 12, 1, 8, len(blocks))
    for i, (tag, body) in enumerate(blocks):
        at = 16 + i * 12
        out[at:at + 4] = tag
        struct.pack_into('<II', out, at + 4, body_at[i] - (at + 4), len(body))
    for i, (_, body) in enumerate(blocks):
        out[body_at[i]:body_at[i] + len(body)] = body
    out.extend(tail)
    if len(out) != res_size + len(tail):
        raise SystemExit('size mismatch %s != %s' % (len(out), res_size + len(tail)))
    return bytes(out)


def compile_png(src, dest):
    """Compile an 8-bit RGBA PNG into a BGRA8888 NO_LOD .vtex_c with mips."""
    width, height, pixels = read_png(src)
    n = width * height
    refl = tuple(sum(pixels[c::4]) / (255.0 * n) for c in range(4))
    mip_count, mip_bytes = build_mips(width, height, pixels)
    # version, flags (NO_LOD = 0x0008), reflectivity, width, height, depth,
    # BGRA8888 = 28, mip_count, picmip, extra offset, extra count.
    header = struct.pack('<HH4fHHHBBIII', 1, 8, *refl, width, height, 1, 28, mip_count, 0, 0, 0)
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    Path(dest).write_bytes(resource(header, mip_bytes))
    return width, height


def main():
    if len(sys.argv) != 3:
        raise SystemExit('usage: vtex.py <in.png> <out.vtex_c>')
    w, h = compile_png(sys.argv[1], sys.argv[2])
    print('%s %sx%s' % (sys.argv[2], w, h))


if __name__ == '__main__':
    main()
