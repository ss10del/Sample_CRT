#!/usr/bin/env python3
"""
Copado Package.xml → Commit Loader  (OAuth 2.0 / MFA edition)

Run:  python copado_loader.py
Dep:  pip install requests
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import json, os, threading, subprocess, sys, platform, webbrowser, socket
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests as req

# ─── Config ───────────────────────────────────────────────────────────────────
CONFIG_PATH   = Path.home() / ".copado_loader_config.json"
CALLBACK_PORT = 8888
CALLBACK_URL  = f"http://localhost:{CALLBACK_PORT}/callback"

COLORS = dict(
    bg="#1e1e2e", card="#2a2a3e", dark="#181825",
    green="#12b886", green_dim="#1a3a27",
    text="#cdd6f4", muted="#6c7086", subtle="#a6adc8",
    border="#45475a",
    ok="#a6e3a1", err="#f38ba8", warn="#f9e2af", info="#89dceb"
)

def load_cfg() -> dict:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text())
        except Exception:
            pass
    return {}

def save_cfg(patch: dict):
    cfg = load_cfg()
    cfg.update(patch)
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2))
    if platform.system() != "Windows":
        CONFIG_PATH.chmod(0o600)

# ─── Browser open (robust, tries multiple methods) ────────────────────────────
def open_url(url: str, log=None):
    def _log(m): log(m, "info") if log else print(m)

    # 1. Try Chrome explicitly
    chrome_paths = {
        "Windows": [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe",
        ],
        "Darwin": [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ],
        "Linux": ["google-chrome", "google-chrome-stable",
                  "chromium-browser", "chromium", "xdg-open"],
    }
    for path in chrome_paths.get(platform.system(), []):
        try:
            subprocess.Popen([path, url],
                             stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL)
            _log(f"🌐  Opened Chrome: {url}")
            return
        except (FileNotFoundError, OSError):
            continue

    # 2. Fall back to OS default browser
    try:
        webbrowser.open(url)
        _log(f"🌐  Opened in default browser: {url}")
        return
    except Exception:
        pass

    # 3. Last resort — show URL to user
    _log(f"⚠️  Could not open browser automatically.")
    _log(f"   Please open this URL manually:\n   {url}")

# ─── OAuth ────────────────────────────────────────────────────────────────────
_auth_code_holder = {"code": None, "error": None}

class _CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        _auth_code_holder["code"]  = (params.get("code",  [None])[0])
        _auth_code_holder["error"] = (params.get("error", [None])[0])
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        if _auth_code_holder["code"]:
            body = ("<html><body style='font-family:sans-serif;text-align:center;"
                    "padding:60px;background:#1e1e2e;color:#cdd6f4'>"
                    "<h2 style='color:#12b886'>&#10003; Authenticated!</h2>"
                    "<p>Return to the Copado Loader app.</p></body></html>")
        else:
            body = ("<html><body style='font-family:sans-serif;text-align:center;"
                    "padding:60px;background:#1e1e2e;color:#f38ba8'>"
                    "<h2>Authentication failed</h2>"
                    f"<p>{_auth_code_holder['error']}</p></body></html>")
        self.wfile.write(body.encode())

    def log_message(self, *_): pass   # silence


def _port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) != 0


def do_oauth_flow(client_id: str, client_secret: str,
                  login_url: str, log) -> tuple:
    """
    Returns (access_token, instance_url, refresh_token).
    Opens browser → waits for callback → exchanges code.
    """
    if not _port_free(CALLBACK_PORT):
        raise RuntimeError(
            f"Port {CALLBACK_PORT} is already in use.\n"
            f"Close whatever is using it and try again.")

    _auth_code_holder["code"]  = None
    _auth_code_holder["error"] = None

    auth_url = (f"{login_url}/services/oauth2/authorize?"
                + urlencode({
                    "response_type": "code",
                    "client_id":     client_id,
                    "redirect_uri":  CALLBACK_URL,
                    "scope":         "full refresh_token api",
                    "prompt":        "login",
                }))

    log(f"🌐  Opening Salesforce login page…", "info")
    log(f"   If browser doesn't open, paste this URL manually:", "warn")
    log(f"   {auth_url}", "warn")
    open_url(auth_url, log)

    log("⏳  Waiting for you to log in and approve (2 min timeout)…", "info")

    server = HTTPServer(("localhost", CALLBACK_PORT), _CallbackHandler)
    server.timeout = 5   # check every 5 s so we can show progress

    elapsed = 0
    while _auth_code_holder["code"] is None and elapsed < 120:
        server.handle_request()
        elapsed += 5
        if elapsed % 20 == 0 and _auth_code_holder["code"] is None:
            log(f"   Still waiting… ({elapsed}s)", "info")

    server.server_close()

    if _auth_code_holder["error"]:
        raise RuntimeError(f"Salesforce returned error: {_auth_code_holder['error']}")
    if not _auth_code_holder["code"]:
        raise TimeoutError("Login timed out (2 min). Please try again.")

    log("🔑  Got auth code — exchanging for tokens…", "info")
    resp = req.post(f"{login_url}/services/oauth2/token", data={
        "grant_type":    "authorization_code",
        "code":          _auth_code_holder["code"],
        "client_id":     client_id,
        "client_secret": client_secret,
        "redirect_uri":  CALLBACK_URL,
    }, timeout=30)
    resp.raise_for_status()
    t = resp.json()

    if "error" in t:
        raise RuntimeError(f"Token exchange failed: {t.get('error_description', t['error'])}")

    return t["access_token"], t["instance_url"], t.get("refresh_token", "")


def silent_refresh(refresh_token: str, client_id: str,
                   client_secret: str, login_url: str) -> tuple:
    resp = req.post(f"{login_url}/services/oauth2/token", data={
        "grant_type":    "refresh_token",
        "refresh_token": refresh_token,
        "client_id":     client_id,
        "client_secret": client_secret,
    }, timeout=30)
    resp.raise_for_status()
    t = resp.json()
    if "error" in t:
        raise RuntimeError(t.get("error_description", t["error"]))
    return t["access_token"], t["instance_url"]

# ─── Salesforce helpers ───────────────────────────────────────────────────────
def _h(tok): return {"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"}

def sf_query(tok, inst, soql):
    r = req.get(f"{inst}/services/data/v59.0/query",
                headers=_h(tok), params={"q": soql}, timeout=30)
    r.raise_for_status()
    return r.json().get("records", [])

def sf_delete_records(tok, inst, ids):
    for rid in ids:
        req.delete(f"{inst}/services/data/v59.0/sobjects/"
                   f"copado__User_Story_Metadata__c/{rid}",
                   headers=_h(tok), timeout=30).raise_for_status()

def sf_insert_records(tok, inst, records):
    CHUNK, inserted, failed = 200, 0, []
    for i in range(0, len(records), CHUNK):
        body = {"allOrNone": False, "records": [
            {"attributes": {"type": "copado__User_Story_Metadata__c"}, **r}
            for r in records[i:i+CHUNK]
        ]}
        r = req.post(f"{inst}/services/data/v59.0/composite/sobjects",
                     headers=_h(tok), json=body, timeout=60)
        r.raise_for_status()
        for res in r.json():
            if res.get("success"):
                inserted += 1
            else:
                failed.append(res.get("errors"))
    return inserted, failed

def parse_xml(path):
    root = ET.parse(path).getroot()
    ns   = {"sf": "http://soap.sforce.com/2006/04/metadata"}
    out  = []
    for tb in root.findall("sf:types", ns):
        tn = tb.find("sf:name", ns)
        if tn is None: continue
        for m in tb.findall("sf:members", ns):
            if m.text and m.text.strip() != "*":
                out.append({"type": tn.text.strip(), "apiName": m.text.strip()})
    return out

# ─── GUI ──────────────────────────────────────────────────────────────────────
C = COLORS

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Copado Commit Loader")
        self.minsize(700, 760)
        self.configure(bg=C["bg"])
        self._cfg   = load_cfg()
        self._tok   = None   # current access token
        self._inst  = None   # instance URL
        self._build()
        self._restore()

    # ── Build ──────────────────────────────────────────────────────────────────
    def _build(self):
        s = ttk.Style(self); s.theme_use("clam")
        s.configure("TLabel",      background=C["bg"],   foreground=C["text"], font=("Segoe UI",9))
        s.configure("TEntry",      fieldbackground=C["dark"], foreground=C["text"],
                                   insertcolor=C["text"], font=("Segoe UI",10))
        s.configure("TCombobox",   fieldbackground=C["dark"], foreground=C["text"])
        s.configure("TRadiobutton",background=C["card"], foreground=C["text"])
        s.configure("TCheckbutton",background=C["card"], foreground=C["text"])
        s.configure("Run.TButton", background=C["green"], foreground="white",
                                   font=("Segoe UI",10,"bold"), padding=8)
        s.configure("Auth.TButton",background="#3b5bdb", foreground="white",
                                   font=("Segoe UI",10,"bold"), padding=8)
        s.configure("Sm.TButton",  background=C["border"], foreground=C["text"],
                                   font=("Segoe UI",9), padding=5)
        s.configure("TProgressbar",troughcolor=C["dark"], background=C["green"])
        s.map("Run.TButton",  background=[("active","#0ca678"),("disabled","#2a2a3e")])
        s.map("Auth.TButton", background=[("active","#2f4ac9")])
        s.map("Sm.TButton",   background=[("active","#585b70")])

        # Header
        hdr = tk.Frame(self, bg=C["green"], pady=11)
        hdr.pack(fill="x")
        tk.Label(hdr, text="⚡  Copado Package.xml Commit Loader",
                 bg=C["green"], fg="white", font=("Segoe UI",14,"bold")).pack()
        tk.Label(hdr, text="OAuth 2.0  ·  MFA supported  ·  Authenticate once, silent forever",
                 bg=C["green"], fg="#d3f9d8", font=("Segoe UI",9)).pack()

        # Scroll canvas
        cv = tk.Canvas(self, bg=C["bg"], highlightthickness=0)
        sb = ttk.Scrollbar(self, orient="vertical", command=cv.yview)
        self._body = tk.Frame(cv, bg=C["bg"], padx=20, pady=10)
        self._body.bind("<Configure>",
            lambda e: cv.configure(scrollregion=cv.bbox("all")))
        cv.create_window((0,0), window=self._body, anchor="nw")
        cv.configure(yscrollcommand=sb.set)
        cv.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")

        self._section("STEP 1 — CONNECTED APP CREDENTIALS")
        self._build_creds()
        self._section("STEP 2 — AUTHENTICATE (once)")
        self._build_auth()
        self._section("STEP 3 — USER STORY & PACKAGE.XML")
        self._build_us()
        self._section("STEP 4 — COMMIT SETTINGS")
        self._build_settings()
        self._section("ACTIONS")
        self._build_actions()
        self._section("LOG")
        self._build_log()

    def _section(self, title):
        f = tk.Frame(self._body, bg=C["bg"]); f.pack(fill="x", pady=(14,3))
        tk.Frame(f, bg=C["border"], height=1).pack(fill="x", side="left", expand=True, pady=6)
        tk.Label(f, text=f"  {title}  ", bg=C["bg"], fg=C["muted"],
                 font=("Segoe UI",7,"bold")).pack(side="left")
        tk.Frame(f, bg=C["border"], height=1).pack(fill="x", side="left", expand=True, pady=6)

    def _card(self, parent=None):
        f = tk.Frame(parent or self._body, bg=C["card"], padx=14, pady=12)
        f.pack(fill="x", pady=3)
        return f

    def _field(self, parent, label, show=None, lw=16):
        f = tk.Frame(parent, bg=C["card"]); f.pack(fill="x", pady=3)
        tk.Label(f, text=label, width=lw, anchor="w",
                 bg=C["card"], fg=C["text"], font=("Segoe UI",9)).pack(side="left")
        v = tk.StringVar()
        ttk.Entry(f, textvariable=v, show=show).pack(side="left", fill="x", expand=True)
        return v

    def _build_creds(self):
        c = self._card()
        r = tk.Frame(c, bg=C["card"]); r.pack(fill="x", pady=3)
        tk.Label(r, text="Login URL", width=16, anchor="w",
                 bg=C["card"], fg=C["text"], font=("Segoe UI",9)).pack(side="left")
        self._login_url = tk.StringVar(value="https://login.salesforce.com")
        ttk.Combobox(r, textvariable=self._login_url,
                     values=["https://login.salesforce.com",
                              "https://test.salesforce.com"],
                     font=("Segoe UI",10)).pack(side="left", fill="x", expand=True)
        self._client_id     = self._field(c, "Client ID")
        self._client_secret = self._field(c, "Client Secret", show="•")
        tk.Label(c,
            text="ℹ  Setup → App Manager → New Connected App → OAuth → Callback: http://localhost:8888/callback",
            bg=C["card"], fg=C["muted"], font=("Segoe UI",8),
            wraplength=580, justify="left").pack(anchor="w", pady=(6,0))

    def _build_auth(self):
        c = self._card()

        # Auth status banner
        self._auth_frame = tk.Frame(c, bg=C["dark"], padx=12, pady=8)
        self._auth_frame.pack(fill="x", pady=(0,10))
        self._auth_icon  = tk.Label(self._auth_frame, text="●", bg=C["dark"],
                                    fg=C["err"], font=("Segoe UI",12))
        self._auth_icon.pack(side="left", padx=(0,8))
        self._auth_lbl   = tk.Label(self._auth_frame,
                                    text="Not authenticated",
                                    bg=C["dark"], fg=C["err"],
                                    font=("Segoe UI",10,"bold"))
        self._auth_lbl.pack(side="left")

        btn_row = tk.Frame(c, bg=C["card"]); btn_row.pack(fill="x")
        self._auth_btn = ttk.Button(btn_row,
            text="🔐  Authenticate Now  (opens Salesforce in browser)",
            style="Auth.TButton", command=self._do_auth)
        self._auth_btn.pack(side="left", padx=(0,8))
        ttk.Button(btn_row, text="↺  Reset & Re-auth",
                   style="Sm.TButton",
                   command=self._reset_auth).pack(side="left")

        tk.Label(c,
            text="→ A browser window will open  →  Log in with your credentials + MFA  →  Click Allow\n"
                 "→ After approval the page shows a green tick and the status above turns green.",
            bg=C["card"], fg=C["muted"],
            font=("Segoe UI",8), justify="left").pack(anchor="w", pady=(8,0))

    def _build_us(self):
        c = self._card()
        r = tk.Frame(c, bg=C["card"]); r.pack(fill="x", pady=3)
        tk.Label(r, text="User Story #", width=16, anchor="w",
                 bg=C["card"], fg=C["text"], font=("Segoe UI",9)).pack(side="left")
        self._us = tk.StringVar()
        ttk.Entry(r, textvariable=self._us).pack(side="left", fill="x", expand=True)
        tk.Label(r, text="  e.g. US-0042", bg=C["card"],
                 fg=C["muted"], font=("Segoe UI",8)).pack(side="left")

        r2 = tk.Frame(c, bg=C["card"]); r2.pack(fill="x", pady=3)
        tk.Label(r2, text="package.xml", width=16, anchor="w",
                 bg=C["card"], fg=C["text"], font=("Segoe UI",9)).pack(side="left")
        self._pkg = tk.StringVar()
        ttk.Entry(r2, textvariable=self._pkg).pack(side="left", fill="x",
                                                    expand=True, padx=(0,6))
        ttk.Button(r2, text="📂 Browse", style="Sm.TButton",
                   command=self._browse).pack(side="left")
        self._preview = tk.Label(c, text="", bg=C["card"],
                                 fg=C["info"], font=("Segoe UI",8), anchor="w")
        self._preview.pack(fill="x", pady=(3,0))

    def _build_settings(self):
        c = self._card()
        tk.Label(c, text="Commit Action", bg=C["card"], fg=C["text"],
                 font=("Segoe UI",9,"bold")).pack(anchor="w", pady=(0,5))
        self._action = tk.StringVar(value="add")
        for v, d in [("add",    "Add / Deploy  — load components to commit"),
                     ("delete", "Delete / Destructive  — mark for removal")]:
            f = tk.Frame(c, bg=C["card"]); f.pack(anchor="w", pady=1)
            ttk.Radiobutton(f, text=v.upper(),
                            variable=self._action, value=v).pack(side="left")
            tk.Label(f, text=f"  — {d}", bg=C["card"],
                     fg=C["muted"], font=("Segoe UI",8)).pack(side="left")

        tk.Frame(c, bg=C["border"], height=1).pack(fill="x", pady=8)

        tk.Label(c, text="Existing Metadata on User Story",
                 bg=C["card"], fg=C["text"],
                 font=("Segoe UI",9,"bold")).pack(anchor="w", pady=(0,5))
        self._mode = tk.StringVar(value="override")
        for v, d in [("override", "Override — wipe existing metadata, load fresh from package.xml"),
                     ("append",   "Append — keep existing, only add net-new components (safe for recommit)")]:
            f = tk.Frame(c, bg=C["card"]); f.pack(anchor="w", pady=1)
            ttk.Radiobutton(f, text=v.capitalize(),
                            variable=self._mode, value=v).pack(side="left")
            tk.Label(f, text=f"  — {d}", bg=C["card"],
                     fg=C["muted"], font=("Segoe UI",8)).pack(side="left")

        tk.Frame(c, bg=C["border"], height=1).pack(fill="x", pady=8)
        r = tk.Frame(c, bg=C["card"]); r.pack(fill="x")
        tk.Label(r, text="Module Directory", width=16, anchor="w",
                 bg=C["card"], fg=C["text"], font=("Segoe UI",9)).pack(side="left")
        self._moddir = tk.StringVar(value="force-app/main/default")
        ttk.Entry(r, textvariable=self._moddir).pack(side="left", fill="x", expand=True)

    def _build_actions(self):
        f = tk.Frame(self._body, bg=C["bg"]); f.pack(fill="x", pady=6)
        self._run_btn = ttk.Button(f, text="▶  Load Metadata to Copado",
                                   style="Run.TButton", command=self._run)
        self._run_btn.pack(side="left", padx=(0,8))
        ttk.Button(f, text="Clear Log", style="Sm.TButton",
                   command=self._clear_log).pack(side="left")
        self._prog = ttk.Progressbar(self._body, mode="indeterminate")
        self._prog.pack(fill="x", pady=(4,0))

    def _build_log(self):
        self._log_box = scrolledtext.ScrolledText(
            self._body, height=13, bg=C["dark"], fg=C["text"],
            font=("Consolas",9), relief="flat", bd=0, state="disabled")
        self._log_box.pack(fill="both", expand=True, pady=4)
        for t, col in [("ok",C["ok"]),("err",C["err"]),
                       ("warn",C["warn"]),("info",C["info"])]:
            self._log_box.tag_configure(t, foreground=col)

    # ── Helpers ────────────────────────────────────────────────────────────────
    def _restore(self):
        cfg = self._cfg
        if cfg.get("login_url"):     self._login_url.set(cfg["login_url"])
        if cfg.get("client_id"):     self._client_id.set(cfg["client_id"])
        if cfg.get("client_secret"): self._client_secret.set(cfg["client_secret"])

        if cfg.get("access_token") and cfg.get("instance_url"):
            self._tok  = cfg["access_token"]
            self._inst = cfg["instance_url"]
            self._set_auth_status(True, "Authenticated  ·  ready (refresh token active)")
            self._log("✅  Saved session found — no login required.", "ok")
        else:
            self._log("ℹ   Complete Steps 1 & 2 before loading metadata.", "info")

    def _log(self, msg: str, tag: str = ""):
        def _do():
            self._log_box.configure(state="normal")
            ts = datetime.now().strftime("%H:%M:%S")
            self._log_box.insert("end", f"[{ts}] {msg}\n", tag)
            self._log_box.see("end")
            self._log_box.configure(state="disabled")
        self.after(0, _do)

    def _clear_log(self):
        self._log_box.configure(state="normal")
        self._log_box.delete("1.0", "end")
        self._log_box.configure(state="disabled")

    def _busy(self, on: bool, btn=None):
        btn = btn or self._run_btn
        def _do():
            if on:
                btn.configure(state="disabled")
                self._prog.start(12)
            else:
                btn.configure(state="normal")
                self._prog.stop()
        self.after(0, _do)

    def _set_auth_status(self, ok: bool, msg: str):
        def _do():
            if ok:
                self._auth_icon.config(text="●", fg=C["ok"])
                self._auth_lbl.config(text=msg,  fg=C["ok"])
                self._auth_frame.config(bg=C["green_dim"])
                self._auth_icon.config(bg=C["green_dim"])
                self._auth_lbl.config(bg=C["green_dim"])
            else:
                self._auth_icon.config(text="●", fg=C["err"])
                self._auth_lbl.config(text=msg,  fg=C["err"])
                self._auth_frame.config(bg=C["dark"])
                self._auth_icon.config(bg=C["dark"])
                self._auth_lbl.config(bg=C["dark"])
        self.after(0, _do)

    def _browse(self):
        p = filedialog.askopenfilename(
            title="Select package.xml",
            filetypes=[("XML files","*.xml"),("All files","*.*")])
        if p:
            self._pkg.set(p)
            try:
                from collections import Counter
                comps  = parse_xml(p)
                counts = Counter(c["type"] for c in comps)
                self._preview.config(
                    text="📦  " + f"{len(comps)} components  ·  " +
                         "  |  ".join(f"{t}:{n}" for t,n in sorted(counts.items())))
                self._log(f"📦  Parsed {len(comps)} components from package.xml", "info")
            except Exception as e:
                self._preview.config(text=f"⚠  Parse error: {e}")

    def _reset_auth(self):
        save_cfg({"access_token": "", "refresh_token": "", "instance_url": ""})
        self._tok = None; self._inst = None
        self._set_auth_status(False, "Token cleared — click Authenticate Now")
        self._log("🔄  Tokens cleared. Click 'Authenticate Now' to re-login.", "warn")

    # ── Auth step (dedicated button) ───────────────────────────────────────────
    def _do_auth(self):
        threading.Thread(target=self._auth_task, daemon=True).start()

    def _auth_task(self):
        self._busy(True, self._auth_btn)
        self._set_auth_status(False, "Authenticating… check your browser")
        try:
            client_id     = self._client_id.get().strip()
            client_secret = self._client_secret.get().strip()
            login_url     = self._login_url.get().strip()

            if not client_id or not client_secret:
                raise ValueError(
                    "Enter Client ID and Client Secret first.\n"
                    "See README for how to create a Connected App.")

            # Try silent refresh first if we have a token
            cfg = load_cfg()
            if cfg.get("refresh_token"):
                self._log("🔄  Trying saved refresh token…", "info")
                try:
                    tok, inst = silent_refresh(
                        cfg["refresh_token"], client_id, client_secret, login_url)
                    self._tok  = tok
                    self._inst = inst
                    save_cfg({"access_token": tok, "instance_url": inst,
                              "client_id": client_id, "client_secret": client_secret,
                              "login_url": login_url})
                    self._set_auth_status(True, "Authenticated  ·  silent refresh succeeded")
                    self._log(f"✅  Connected → {inst}", "ok")
                    return
                except Exception as e:
                    self._log(f"⚠️  Refresh failed ({e}) — doing full login", "warn")

            # Full browser flow
            tok, inst, refresh = do_oauth_flow(
                client_id, client_secret, login_url, self._log)
            self._tok  = tok
            self._inst = inst
            save_cfg({
                "access_token":  tok,
                "refresh_token": refresh,
                "instance_url":  inst,
                "client_id":     client_id,
                "client_secret": client_secret,
                "login_url":     login_url,
            })
            self._set_auth_status(True,
                "Authenticated  ·  refresh token saved  ·  silent login forever")
            self._log(f"✅  Connected → {inst}", "ok")
            self._log("💾  Refresh token saved — next time is automatic.", "ok")
            self.after(0, lambda: messagebox.showinfo(
                "Authenticated!",
                f"Connected to:\n{inst}\n\nYou won't need to log in again."))
        except Exception as e:
            self._set_auth_status(False, f"Auth failed: {e}")
            self._log(f"✗  {e}", "err")
            self.after(0, lambda: messagebox.showerror("Auth Failed", str(e)))
        finally:
            self._busy(False, self._auth_btn)
            self.after(0, lambda: self._auth_btn.configure(state="normal"))

    # ── Load step ──────────────────────────────────────────────────────────────
    def _run(self):
        if not self._tok or not self._inst:
            messagebox.showwarning("Not Authenticated",
                "Please click 'Authenticate Now' first (Step 2).")
            return
        threading.Thread(target=self._load_task, daemon=True).start()

    def _load_task(self):
        self._busy(True)
        try:
            us_num   = self._us.get().strip()
            pkg_path = self._pkg.get().strip()
            action   = self._action.get()
            mode     = self._mode.get()
            mod_dir  = self._moddir.get().strip()

            if not us_num:
                raise ValueError("Enter a User Story number (e.g. US-0042)")
            if not pkg_path or not os.path.exists(pkg_path):
                raise FileNotFoundError(f"package.xml not found: {pkg_path}")

            self._log(f"📂  Parsing package.xml…", "info")
            components = parse_xml(pkg_path)
            if not components:
                raise ValueError("No components found (wildcards * are skipped).")
            self._log(f"📦  {len(components)} component(s)", "ok")

            self._log(f"🔍  Looking up User Story: {us_num}", "info")
            rows = sf_query(self._tok, self._inst,
                f"SELECT Id, Name FROM copado__User_Story__c "
                f"WHERE Name = '{us_num}' LIMIT 1")
            if not rows:
                raise ValueError(f"User Story '{us_num}' not found in org.")
            us_id = rows[0]["Id"]; us_name = rows[0]["Name"]
            self._log(f"✅  Found: {us_name} ({us_id})", "ok")

            existing = sf_query(self._tok, self._inst,
                f"SELECT Id, copado__Type__c, copado__Metadata_API_Name__c "
                f"FROM copado__User_Story_Metadata__c "
                f"WHERE copado__User_Story__c = '{us_id}'")
            self._log(f"📋  Existing metadata: {len(existing)} record(s)", "info")

            if mode == "override" and existing:
                self._log(f"🗑  Deleting {len(existing)} existing records…", "warn")
                sf_delete_records(self._tok, self._inst,
                                  [r["Id"] for r in existing])
                self._log(f"✅  Cleared {len(existing)} records", "ok")
            elif mode == "append":
                have = {(r["copado__Type__c"],
                         r["copado__Metadata_API_Name__c"]) for r in existing}
                before     = len(components)
                components = [c for c in components
                              if (c["type"], c["apiName"]) not in have]
                self._log(f"⏭  Skipped {before - len(components)} already-present,"
                          f" inserting {len(components)} new", "warn")

            if components:
                self._log(f"⬆  Inserting {len(components)} records (action={action})…","info")
                payload = [{
                    "copado__User_Story__c":        us_id,
                    "copado__Metadata_API_Name__c":  c["apiName"],
                    "copado__Type__c":               c["type"],
                    "copado__Action__c":             action,
                    "copado__ModuleDirectory__c":    mod_dir,
                } for c in components]
                inserted, failed = sf_insert_records(self._tok, self._inst, payload)
                if failed:
                    self._log(f"⚠️  {len(failed)} insert(s) failed: {failed[:2]}", "warn")
                self._log(f"✅  Inserted {inserted} components", "ok")
            else:
                self._log("✅  Nothing new to insert.", "ok")

            url = f"{self._inst}/lightning/r/copado__User_Story__c/{us_id}/view"
            self._log(f"🌐  Opening Copado commit page…", "info")
            open_url(url, self._log)
            self._log("✅  Done! Metadata tab → Commit Changes", "ok")

            summary = (f"User Story : {us_name}\n"
                       f"Components : {len(components)}\n"
                       f"Action     : {action.upper()}\n"
                       f"Mode       : {mode.upper()}\n\n"
                       "Browser opened → Metadata tab → Commit Changes")
            self.after(0, lambda: messagebox.showinfo("Done!", summary))

        except Exception as e:
            self._log(f"✗  {e}", "err")
            self.after(0, lambda: messagebox.showerror("Error", str(e)))
        finally:
            self._busy(False)


if __name__ == "__main__":
    App().mainloop()
