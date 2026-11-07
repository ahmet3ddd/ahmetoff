#!/usr/bin/env python3
"""Seçki Dublaj — YouTube videoları için Türkçe altyazı ve Türkçe seslendirme üretir.

Akış:
  1. yt-dlp ile videonun Türkçe altyazısı aranır (elle yazılmış ya da YouTube'un otomatik çevirisi).
  2. Hiç altyazı yoksa ses indirilir, Whisper ile yazıya dökülür, Google Çeviri ile Türkçeye çevrilir.
  3. Türkçe metin edge-tts (Microsoft Türkçe sinirsel ses) ile okunur, zamanlamaya oturtulur, tek mp3 yapılır.

Seçki bu servise Cloudflare tüneli üzerinden (https://dublaj.ahmetoff.com) ulaşır.
Servis yalnızca 127.0.0.1 üzerinde dinler; her istek token ister.
"""
import asyncio
import hmac
import json
import os
import queue
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

VERSION = "1.3.0"
UPDATE_URL = "https://ahmetoff.com/ahmetoff/projects/secki/dublaj/server.py"
HOME = Path(os.environ.get("SECKI_HOME", Path.home() / ".secki-dublaj"))
JOBS = HOME / "jobs"
PORT = int(os.environ.get("SECKI_PORT", "8765"))
TOKEN = (HOME / "token").read_text().strip() if (HOME / "token").exists() else os.environ.get("SECKI_TOKEN", "")
VOICE = os.environ.get("SECKI_VOICE", "tr-TR-AhmetNeural")
WHISPER_MODEL = os.environ.get("SECKI_WHISPER", "small")
SR = 24000
VID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
BIN = Path(sys.executable).parent
YTDLP = str(BIN / "yt-dlp") if (BIN / "yt-dlp").exists() else "yt-dlp"

JOBS.mkdir(parents=True, exist_ok=True)
q: "queue.Queue[str]" = queue.Queue()
lock = threading.Lock()


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


# ---------------------------------------------------------------- iş durumu
def jdir(vid):
    return JOBS / vid


def read_status(vid):
    p = jdir(vid) / "status.json"
    try:
        return json.loads(p.read_text())
    except Exception:
        return None


def write_status(vid, **kw):
    with lock:
        d = jdir(vid)
        d.mkdir(parents=True, exist_ok=True)
        st = read_status(vid) or {"id": vid}
        st.update(kw)
        st["updated"] = time.time()
        tmp = d / "status.tmp"
        tmp.write_text(json.dumps(st, ensure_ascii=False))
        tmp.replace(d / "status.json")
        return st


# ---------------------------------------------------------------- altyazı
def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        msg = (r.stderr or r.stdout or "").strip().splitlines()
        raise RuntimeError(msg[-1] if msg else f"{cmd[0]} hata verdi")
    return r.stdout


def video_info(vid):
    out = run([YTDLP, "--no-warnings", "--skip-download", "--dump-single-json",
               f"https://www.youtube.com/watch?v={vid}"], timeout=180)
    return json.loads(out)


def parse_json3(path):
    return parse_json3_data(json.loads(Path(path).read_text(encoding="utf-8")))


def parse_json3_data(data):
    cues = []
    for ev in data.get("events", []):
        segs = ev.get("segs")
        if not segs or "tStartMs" not in ev:
            continue
        text = "".join(s.get("utf8", "") for s in segs)
        text = re.sub(r"\s+", " ", text.replace("\n", " ")).strip()
        if not text or text in ("[Müzik]", "[Music]"):
            continue
        s = ev["tStartMs"] / 1000
        e = s + ev.get("dDurationMs", 2000) / 1000
        cues.append({"s": s, "e": e, "t": text})
    cues.sort(key=lambda c: c["s"])
    out = []
    for c in cues:
        if out and c["t"] == out[-1]["t"]:
            out[-1]["e"] = max(out[-1]["e"], c["e"])
            continue
        if out and out[-1]["e"] > c["s"]:
            out[-1]["e"] = c["s"]
        out.append(c)
    return [c for c in out if c["e"] - c["s"] > 0.05]


def ytdlp_sub(vid, key, auto, work):
    for f in work.glob("sub*"):
        f.unlink()
    run([YTDLP, "--no-warnings", "--skip-download", "--write-auto-subs" if auto else "--write-subs",
         "--sub-langs", key, "--sub-format", "json3", "-o", str(work / "sub.%(ext)s"),
         f"https://www.youtube.com/watch?v={vid}"], timeout=180)
    f = next(iter(work.glob("sub*.json3")), None)
    if not f:
        return None
    cues = parse_json3(f)
    f.unlink()
    return cues or None


def youtube_turkish_subs(vid, info, work):
    """1) Türkçe altyazı varsa onu al. 2) Yoksa videonun kendi altyazısını al, Türkçeye çevir."""
    subs = {k: v for k, v in (info.get("subtitles") or {}).items() if k != "live_chat"}
    auto = info.get("automatic_captions") or {}
    log(vid, "altyazılar:", list(subs)[:8], "otomatik:", list(auto)[:8])
    write_status(vid, capinfo={"manual": list(subs)[:8], "auto": list(auto)[:8]})
    lang = (info.get("language") or "").lower()[:2]
    tr_m = [k for k in subs if k.lower().startswith("tr")]
    tr_a = [k for k in auto if k.lower() == "tr" or k.lower().startswith("tr-")]
    for key, is_auto, src in [(k, False, "youtube-tr") for k in tr_m] + [(k, True, "youtube-tr-auto") for k in tr_a[:1]]:
        try:
            cues = ytdlp_sub(vid, key, is_auto, work)
            if cues:
                return cues, src
        except Exception as e:
            log(vid, "altyazı indirilemedi:", e)
    cands = [(k, False) for k in subs if lang and k.lower().startswith(lang)]
    cands += [(k, False) for k in subs if (k, False) not in cands]
    cands += [(k, True) for k in auto if k.endswith("-orig")]
    cands += [(k, True) for k in auto if (k, True) not in cands and not k.lower().startswith("tr")][:1]
    for key, is_auto in cands[:3]:
        try:
            cues = ytdlp_sub(vid, key, is_auto, work)
        except Exception as e:
            log(vid, "altyazı indirilemedi:", e)
            continue
        if cues:
            write_status(vid, step="Türkçeye çevriliyor", progress=0.3)
            for c, t in zip(cues, translate([c["t"] for c in cues])):
                c["t"] = t
            return cues, "youtube-" + key + "+ceviri"
    return None, None


def whisper_subs(vid, info, work):
    import numpy as np
    write_status(vid, step="Ses indiriliyor", progress=0.1)
    run([YTDLP, "--no-warnings", "-f", "bestaudio/best", "-o", str(work / "audio.%(ext)s"),
         f"https://www.youtube.com/watch?v={vid}"], timeout=1800)
    src = next(p for p in work.glob("audio.*") if not p.name.endswith(".part"))
    raw_pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                             capture_output=True, check=True).stdout
    audio = np.frombuffer(raw_pcm, dtype=np.float32)
    src.unlink(missing_ok=True)
    model = get_model(vid)
    write_status(vid, step="Konuşma yazıya dökülüyor", progress=0.2)
    dur = float(info.get("duration") or 1)
    segs, winfo = model.transcribe(audio, vad_filter=True)
    raw = []
    for s in segs:
        raw.append({"s": s.start, "e": s.end, "t": s.text.strip()})
        write_status(vid, progress=round(0.2 + 0.4 * min(1, s.end / dur), 3))
    raw = [c for c in raw if c["t"]]
    if not raw:
        return [], "whisper"
    if (winfo.language or "").startswith("tr"):
        return raw, "whisper"
    write_status(vid, step="Türkçeye çevriliyor", progress=0.62)
    texts = translate([c["t"] for c in raw])
    for c, t in zip(raw, texts):
        c["t"] = t
    return raw, "whisper"


_model = None


def get_model(vid):
    global _model
    if _model is None:
        write_status(vid, step="Konuşma tanıma modeli hazırlanıyor (ilk seferde indirilir)", progress=0.15)
        from faster_whisper import WhisperModel
        _model = WhisperModel(WHISPER_MODEL, device=os.environ.get("SECKI_DEVICE", "cpu"), compute_type="int8")
    return _model


def gtx(text):
    import urllib.parse
    import urllib.request
    body = urllib.parse.urlencode({"q": text}).encode()
    req = urllib.request.Request(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t",
        data=body, headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode("utf-8"))
    return "".join(part[0] for part in data[0] if part and part[0])


def translate(texts):
    """Google Çeviri; satırlar toplu çevrilir, sayı tutmazsa tek tek."""
    out, batch, size, fails = [], [], 0, 0

    def flush():
        nonlocal batch, size, fails
        if not batch:
            return
        try:
            res = gtx("\n".join(batch)).split("\n")
            if len(res) != len(batch):
                raise ValueError("satır sayısı tutmadı")
        except Exception:
            res = []
            for t in batch:
                try:
                    res.append(gtx(t))
                except Exception as e:
                    fails += 1
                    log("çeviri hatası:", e)
                    res.append(t)
        out.extend(r.strip() for r in res)
        batch, size = [], 0

    for t in texts:
        if size + len(t) > 3500:
            flush()
        batch.append(t.replace("\n", " "))
        size += len(t) + 1
    flush()
    if texts and fails > len(texts) / 2:
        raise RuntimeError("Google Çeviri'ye ulaşılamadı; çeviri yapılamadı.")
    return out


# ---------------------------------------------------------------- seslendirme
def sentences(cues):
    """Kısa altyazı satırlarını okunabilir cümlelere birleştirir."""
    groups = []
    for c in cues:
        g = groups[-1] if groups else None
        if (g and c["s"] - g["e"] < 0.6 and c["e"] - g["s"] < 9
                and not re.search(r"[.!?…]$", g["t"])):
            g["t"] += " " + c["t"]
            g["e"] = c["e"]
        else:
            groups.append(dict(c))
    return groups


async def tts_all(groups, work, vid):
    import edge_tts
    sem = asyncio.Semaphore(4)
    done = 0

    async def one(i, g):
        nonlocal done
        path = work / f"tts_{i:05d}.mp3"
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(g["t"], VOICE, rate="+8%").save(str(path))
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(1.5)
        done += 1
        if done % 5 == 0:
            write_status(vid, progress=round(0.65 + 0.25 * done / len(groups), 3))
        return path

    return await asyncio.gather(*(one(i, g) for i, g in enumerate(groups)))


def decode(path, tempo=1.0):
    import numpy as np
    cmd = ["ffmpeg", "-v", "error", "-i", str(path)]
    if tempo > 1.01:
        cmd += ["-filter:a", f"atempo={min(tempo, 2.0):.3f}"]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def build_dub(vid, cues, duration, work):
    import numpy as np
    groups = sentences(cues)
    write_status(vid, step="Türkçe seslendiriliyor", progress=0.65)
    paths = asyncio.run(tts_all(groups, work, vid))
    write_status(vid, step="Ses birleştiriliyor", progress=0.92)
    total = int((max(duration, groups[-1]["e"]) + 8) * SR)
    track = np.zeros(total, dtype=np.float32)
    cursor = 0
    for i, (g, p) in enumerate(zip(groups, paths)):
        nxt = groups[i + 1]["s"] if i + 1 < len(groups) else g["e"] + 3
        slot = max(0.6, nxt - g["s"])
        clip = decode(p)
        need = len(clip) / SR
        if need > slot * 1.02:
            clip = decode(p, tempo=min(need / slot, 1.6))
        start = max(int(g["s"] * SR), cursor)
        end = min(start + len(clip), total)
        track[start:end] += clip[: end - start]
        cursor = end
        p.unlink(missing_ok=True)
    peak = float(np.max(np.abs(track))) or 1.0
    track *= min(1.0, 0.95 / peak)
    out = jdir(vid) / "dub.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-b:a", "48k", str(out)], input=track.tobytes(), check=True)


# ---------------------------------------------------------------- işçi
def process(vid):
    work = Path(tempfile.mkdtemp(prefix=f"secki_{vid}_"))
    try:
        write_status(vid, state="working", step="Video bilgisi alınıyor", progress=0.03, error=None)
        info = video_info(vid)
        duration = float(info.get("duration") or 0)
        lang = (info.get("language") or "").lower()
        write_status(vid, title=info.get("title"), duration=duration, lang=lang,
                     step="Türkçe altyazı aranıyor", progress=0.06)
        cues, source = youtube_turkish_subs(vid, info, work)
        if not cues:
            cues, source = whisper_subs(vid, info, work)
        if not cues:
            raise RuntimeError("Videoda yazıya dökülecek konuşma bulunamadı.")
        (jdir(vid) / "cues.json").write_text(json.dumps(cues, ensure_ascii=False))
        write_status(vid, subs=True, source=source, cues=len(cues), progress=0.64)
        if lang.startswith("tr"):
            write_status(vid, state="done", dub=False, step="Video zaten Türkçe", progress=1)
            return
        build_dub(vid, cues, duration, work)
        write_status(vid, state="done", dub=True, step="Hazır", progress=1)
    except Exception as e:
        traceback.print_exc()
        msg = str(e)
        if "Sign in to confirm" in msg:
            msg = "YouTube doğrulama istedi; biraz sonra tekrar dene."
        write_status(vid, state="error", error=msg[:300], step="Hata")
    finally:
        shutil.rmtree(work, ignore_errors=True)


def worker():
    while True:
        vid = q.get()
        log("başladı", vid)
        t0 = time.time()
        busy.set()
        try:
            process(vid)
        finally:
            busy.clear()
        log("bitti", vid, f"{time.time() - t0:.0f} sn")


def enqueue(vid, force=False):
    st = None if force else read_status(vid)
    if st and st.get("state") in ("queued", "working"):
        return st
    if st and st.get("state") == "done" and (jdir(vid) / "cues.json").exists():
        return st
    st = write_status(vid, state="queued", step="Sırada", progress=0, error=None)
    q.put(vid)
    return st


def cleanup(days=45):
    cut = time.time() - days * 86400
    for d in JOBS.iterdir():
        try:
            if d.is_dir() and d.stat().st_mtime < cut:
                shutil.rmtree(d)
        except Exception:
            pass
    # yarıda kalmış işleri yeniden sıraya al
    for d in JOBS.iterdir():
        st = read_status(d.name)
        if st and st.get("state") in ("queued", "working"):
            write_status(d.name, state="queued", step="Sırada")
            q.put(d.name)


# ---------------------------------------------------------------- HTTP
class H(BaseHTTPRequestHandler):
    server_version = "SeckiDublaj/" + VERSION

    def log_message(self, fmt, *a):
        pass

    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")

    def send_json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def authed(self, qs):
        t = (qs.get("t") or [""])[0]
        return bool(TOKEN) and hmac.compare_digest(t, TOKEN)

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def route(self, method):
        u = urlparse(self.path)
        qs = parse_qs(u.query)
        parts = [p for p in u.path.split("/") if p]
        if parts == ["health"]:
            return self.send_json({"ok": True, "version": VERSION, "auth": self.authed(qs), "queue": q.qsize()})
        if not self.authed(qs):
            return self.send_json({"error": "Token geçersiz."}, 401)
        if parts == ["update"] and method == "POST":
            update_now.set()
            return self.send_json({"ok": True})
        if len(parts) >= 2 and parts[0] == "jobs" and VID_RE.match(parts[1]):
            vid = parts[1]
            if len(parts) == 2:
                if method == "POST":
                    return self.send_json(enqueue(vid, force=(qs.get("force") or [""])[0] == "1"))
                return self.send_json(read_status(vid) or {"id": vid, "state": "none"})
            if parts[2] == "cues.json":
                return self.send_file(jdir(vid) / "cues.json", "application/json; charset=utf-8")
            if parts[2] == "dub.mp3":
                return self.send_file(jdir(vid) / "dub.mp3", "audio/mpeg")
        return self.send_json({"error": "Bulunamadı."}, 404)

    def send_file(self, path, ctype):
        if not path.exists():
            return self.send_json({"error": "Henüz hazır değil."}, 404)
        size = path.stat().st_size
        start, end = 0, size - 1
        rng = self.headers.get("Range")
        m = re.match(r"bytes=(\d*)-(\d*)", rng or "")
        if m:
            if m.group(1):
                start = int(m.group(1))
                if m.group(2):
                    end = min(int(m.group(2)), size - 1)
            elif m.group(2):
                start = max(0, size - int(m.group(2)))
            if start > end:
                self.send_response(416)
                self.cors()
                self.send_header("Content-Range", f"bytes */{size}")
                self.end_headers()
                return
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        else:
            self.send_response(200)
        self.cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "private, max-age=86400")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        if self.command == "HEAD":
            return
        with open(path, "rb") as f:
            f.seek(start)
            left = end - start + 1
            try:
                while left > 0:
                    chunk = f.read(min(65536, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def do_GET(self):
        self.route("GET")

    def do_HEAD(self):
        self.route("GET")

    def do_POST(self):
        self.route("POST")


busy = threading.Event()


update_now = threading.Event()


def self_update_loop():
    import urllib.request
    me = Path(__file__).resolve()
    time.sleep(20)
    while True:
        try:
            with urllib.request.urlopen(f"{UPDATE_URL}?v={int(time.time())}", timeout=30) as r:
                new = r.read()
            if new and new != me.read_bytes() and b"VERSION = " in new:
                compile(new, str(me), "exec")
                while busy.is_set() or not q.empty():
                    time.sleep(10)
                me.write_bytes(new)
                log("yeni sürüm yüklendi, yeniden başlıyor")
                os.execv(sys.executable, [sys.executable, str(me)])
        except Exception as e:
            log("güncelleme denetimi başarısız:", e)
        update_now.wait(15 * 60)
        update_now.clear()


def main():
    if not TOKEN:
        sys.exit("Token yok: ~/.secki-dublaj/token dosyasını oluştur.")
    cleanup()
    threading.Thread(target=worker, daemon=True).start()
    threading.Thread(target=self_update_loop, daemon=True).start()
    log(f"Seçki Dublaj {VERSION} 127.0.0.1:{PORT} üzerinde, ses: {VOICE}, whisper: {WHISPER_MODEL}")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()


if __name__ == "__main__":
    main()
