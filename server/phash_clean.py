"""Image perceptual hash (pHash) endpoint."""
import io
import math
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image

router = APIRouter()

def _dct_1d(signal):
    N = len(signal)
    result = []
    for k in range(N):
        s = 0.0
        for n in range(N):
            s += signal[n] * math.cos(math.pi * (2 * n + 1) * k / (2 * N))
        result.append(s)
    return result

def _dct_2d(matrix):
    rows = [_dct_1d(row) for row in matrix]
    cols = []
    for j in range(len(rows[0])):
        col = [rows[i][j] for i in range(len(rows))]
        cols.append(_dct_1d(col))
    return [[cols[j][i] for j in range(len(cols))] for i in range(len(cols[0]))]

def compute_phash(image, hash_size=16):
    img = image.convert("L").resize((hash_size * 2, hash_size * 2), Image.LANCZOS)
    pixels = list(img.getdata())
    matrix = [pixels[i * hash_size * 2:(i + 1) * hash_size * 2] for i in range(hash_size * 2)]
    dct = _dct_2d(matrix)
    low_freq = []
    for i in range(hash_size):
        for j in range(hash_size):
            low_freq.append(dct[i][j])
    low_freq = low_freq[1:]
    median = sorted(low_freq)[len(low_freq) // 2]
    bits = []
    for i in range(hash_size):
        for j in range(hash_size):
            if i == 0 and j == 0:
                continue
            bits.append(1 if dct[i][j] > median else 0)
    hash_int = int("".join(str(b) for b in bits), 2)
    return format(hash_int, f"{hash_size * hash_size // 4}x")

@router.post("/api/v1/image/phash")
async def get_phash(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")
        img = Image.open(io.BytesIO(content))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        width, height = img.size
        phash = compute_phash(img)
        return {"phash": phash, "width": width, "height": height, "file_size": len(content)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to compute pHash: {str(e)}")
