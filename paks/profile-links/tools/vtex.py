#!/usr/bin/env python3
"""Compile a 64x64 RGBA PNG into a Source 2 vtex_c.

The texture header is the public vtex DATA layout (version 1, RGBA8888):
flags, reflectivity, width, height, depth, format, one mip, then the pixels
after the DATA block. This is this repo's compiler. It does not use a
borrowed RED2 block.
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


def resource(data_block, tail):
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
    size = body_at[-1] + len(blocks[-1][1]) + len(tail)
    out = bytearray(body_at[0])
    struct.pack_into('<IHHII', out, 0, size, 12, 1, 8, len(blocks))
    for i, (tag, body) in enumerate(blocks):
        at = 16 + i * 12
        out[at:at + 4] = tag
        struct.pack_into('<II', out, at + 4, body_at[i] - (at + 4), len(body))
    for i, (_, body) in enumerate(blocks):
        out[body_at[i]:body_at[i] + len(body)] = body
    out.extend(tail)
    if len(out) != size:
        raise SystemExit('size mismatch %s != %s' % (len(out), size))
    return bytes(out)


def compile_png(src, dest):
    width, height, pixels = read_png(src)
    # version, flags (clamp s/t), reflectivity, width, height, depth,
    # RGBA8888 = 4, one mip, picmip, extra offset, extra count.
    header = struct.pack('<HH4fHHHBBIII', 1, 3, 0, 0, 0, 0, width, height, 1, 4, 1, 0, 0, 0)
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    Path(dest).write_bytes(resource(header, pixels))
    return width, height


def main():
    if len(sys.argv) != 3:
        raise SystemExit('usage: vtex.py <in.png> <out.vtex_c>')
    w, h = compile_png(sys.argv[1], sys.argv[2])
    print('%s %sx%s' % (sys.argv[2], w, h))


if __name__ == '__main__':
    main()
