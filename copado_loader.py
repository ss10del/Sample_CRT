#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════╗
║   Copado Package.xml → User Story Commit Loader      ║
║   Loads metadata components from package.xml into    ║
║   Copado User Story and opens the commit page.       ║
╚══════════════════════════════════════════════════════╝
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import json
import os
import threading
import subprocess
import sys
import platform
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

# ─── Credential Store ─────────────────────────────────────────────────────────
CONFIG_FILE = Path.home() / ".copado_loader_config.json"

def load_saved_credentials():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_credentials(data: dict):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(data, f, indent=2)
        # Restrict file permissions on Unix
        if platform.system() != "Windows":
            os.chmod(CONFIG_FILE, 0o600)
    except Exception as e:
        print(f"Warning: Could not save credentials: {e}")

# ─── Salesforce / Copado Logic ────────────────────────────────────────────────
def parse_package_xml(file_path: str):
    """Parse package.xml and return list of {type, apiName} dicts."""
    tree = ET.parse(file_path)
    root = tree.getroot()
    ns = {"sf": "http://soap.sforce.com/2006/04/metadata"}

    components = []
    for type_block in root.findall("sf:types", ns):
        type_name_el = type_block.find("sf:name", ns)
        if type_name_el is None:
            continue
        type_name = type_name_el.text.strip()
        for member_el in type_block.findall("sf:members", ns):
            member = member_el.text.strip()
            if member != "*":
                components.append({"type": type_name, "apiName": member})
    return components


def connect_to_salesforce(username, password, token, login_url, log_fn):
    """Connect using simple_salesforce and return sf instance + instance_url."""
    try:
        from simple_salesforce import Salesforce
    except ImportError:
        raise RuntimeError("simple_salesforce not installed. Run: pip install simple-salesforce")

    log_fn("🔌 Connecting to Salesforce…")
    sf = Salesforce(
        username=username,
        password=password,
        security_token=token,
        domain="test" if "sandbox" in login_url or "test" in login_url else "login"
    )
    log_fn(f"✅ Connected → {sf.sf_instance}")
    return sf


def find_user_story(sf, identifier: str, log_fn):
    """Find User Story by Name or Id."""
    log_fn(f"🔍 Looking up User Story: {identifier}")
    query = f"SELECT Id, Name, copado__Branch__c FROM copado__User_Story__c WHERE Name = '{identifier}' LIMIT 1"
    result = sf.query(query)
    if result["totalSize"] == 0 and len(identifier) == 18:
        query = f"SELECT Id, Name, copado__Branch__c FROM copado__User_Story__c WHERE Id = '{identifier}' LIMIT 1"
        result = sf.query(query)
    if result["totalSize"] == 0:
        raise ValueError(f"User Story not found: '{identifier}'. Check the name (e.g. US-0042).")
    us = result["records"][0]
    log_fn(f"✅ Found: {us['Name']} (ID: {us['Id']})")
    return us


def get_existing_metadata(sf, user_story_id: str):
    """Return existing metadata records for a User Story."""
    result = sf.query(
        f"SELECT Id, copado__Metadata_API_Name__c, copado__Type__c "
        f"FROM copado__User_Story_Metadata__c "
        f"WHERE copado__User_Story__c = '{user_story_id}'"
    )
    return result["records"]


def delete_metadata_records(sf, records, log_fn):
    """Bulk delete metadata records."""
    if not records:
        return 0
    ids = [r["Id"] for r in records]
    CHUNK = 200
    deleted = 0
    for i in range(0, len(ids), CHUNK):
        chunk = ids[i:i+CHUNK]
        sf.bulk.copado__User_Story_Metadata__c.delete(
            [{"Id": rid} for rid in chunk]
        )
        deleted += len(chunk)
    log_fn(f"🗑  Deleted {deleted} existing metadata record(s)")
    return deleted


def insert_metadata_records(sf, user_story_id: str, components: list,
                             commit_action: str, module_dir: str, log_fn):
    """Bulk insert metadata records."""
    records = [
        {
            "copado__User_Story__c":        user_story_id,
            "copado__Metadata_API_Name__c":  c["apiName"],
            "copado__Type__c":               c["type"],
            "copado__Action__c":             commit_action,
            "copado__ModuleDirectory__c":    module_dir,
        }
        for c in components
    ]

    CHUNK = 200
    inserted = 0
    failed = []
    for i in range(0, len(records), CHUNK):
        chunk = records[i:i+CHUNK]
        results = sf.bulk.copado__User_Story_Metadata__c.insert(chunk)
        for res in results:
            if res.get("success"):
                inserted += 1
            else:
                failed.append(res.get("errors", []))

    if failed:
        log_fn(f"⚠️  {len(failed)} record(s) failed to insert:")
        for err in failed[:5]:
            log_fn(f"   {err}")
    log_fn(f"✅ Inserted {inserted} of {len(records)} components")
    return inserted, failed


def open_in_chrome(url: str):
    """Open a URL in Chrome browser."""
    system = platform.system()
    chrome_cmds = {
        "Windows": [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ],
        "Darwin":  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
        "Linux":   ["google-chrome", "google-chrome-stable", "chromium-browser", "chromium"],
    }
    candidates = chrome_cmds.get(system, [])
    for cmd in candidates:
        try:
            subprocess.Popen([cmd, url])
            return True
        except (FileNotFoundError, OSError):
            continue
    # Fallback to default browser
    import webbrowser
    webbrowser.open(url)
    return False


def build_commit_url(instance_url: str, user_story_id: str):
    return f"https://{instance_url}/lightning/r/copado__User_Story__c/{user_story_id}/view"


# ─── GUI ──────────────────────────────────────────────────────────────────────
class CopadoLoaderApp(tk.Tk):
    COMMIT_ACTIONS = ["add", "delete"]
    COMMIT_ACTION_LABELS = {
        "add":    "Add / Deploy  →  Load components to commit",
        "delete": "Delete / Destructive  →  Mark for removal",
    }
    METADATA_MODES = {
        "override": "Override  — clear existing metadata, then insert fresh",
        "append":   "Append   — keep existing metadata and add new components",
    }

    def __init__(self):
        super().__init__()
        self.title("Copado Package.xml Commit Loader")
        self.resizable(True, True)
        self.minsize(720, 700)
        self.configure(bg="#1e1e2e")

        self._creds = load_saved_credentials()
        self._sf = None
        self._us = None
        self._components = []
        self._thread = None

        self._build_ui()
        self._restore_saved_values()

    # ── UI Construction ───────────────────────────────────────────────────────
    def _build_ui(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        self._configure_styles(style)

        # ── Header
        hdr = tk.Frame(self, bg="#12b886", pady=10)
        hdr.pack(fill="x")
        tk.Label(hdr, text="⚡  Copado Package.xml Commit Loader",
                 bg="#12b886", fg="white",
                 font=("Segoe UI", 15, "bold")).pack()
        tk.Label(hdr, text="Load metadata from package.xml into a Copado User Story",
                 bg="#12b886", fg="#d3f9d8",
                 font=("Segoe UI", 9)).pack()

        # ── Scrollable body
        canvas = tk.Canvas(self, bg="#1e1e2e", highlightthickness=0)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
        self._body = tk.Frame(canvas, bg="#1e1e2e", padx=20, pady=10)
        self._body.bind("<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=self._body, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        self._build_credentials_section()
        self._build_separator("USER STORY & PACKAGE.XML")
        self._build_us_section()
        self._build_separator("COMMIT SETTINGS")
        self._build_commit_settings()
        self._build_separator("ACTIONS")
        self._build_action_buttons()
        self._build_separator("LOG")
        self._build_log_area()

    def _configure_styles(self, style):
        bg  = "#1e1e2e"
        fg  = "#cdd6f4"
        acc = "#12b886"
        ent = "#2a2a3e"
        style.configure("TLabel",     background=bg, foreground=fg, font=("Segoe UI", 9))
        style.configure("TFrame",     background=bg)
        style.configure("TEntry",     fieldbackground=ent, foreground=fg,
                                      insertcolor=fg, font=("Segoe UI", 10))
        style.configure("TCombobox",  fieldbackground=ent, foreground=fg,
                                      selectbackground=acc)
        style.configure("TRadiobutton", background=bg, foreground=fg, font=("Segoe UI", 9))
        style.configure("TCheckbutton", background=bg, foreground=fg, font=("Segoe UI", 9))
        style.configure("Green.TButton", background=acc, foreground="white",
                                          font=("Segoe UI", 10, "bold"), padding=8)
        style.configure("Gray.TButton",  background="#45475a", foreground=fg,
                                          font=("Segoe UI", 9), padding=6)
        style.configure("TProgressbar", troughcolor=ent, background=acc)
        style.map("Green.TButton", background=[("active", "#0ca678")])
        style.map("Gray.TButton",  background=[("active", "#585b70")])

    def _section_label(self, text):
        tk.Label(self._body, text=text, bg="#1e1e2e", fg="#a6e3a1",
                 font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(10, 2))

    def _build_separator(self, title=""):
        f = tk.Frame(self._body, bg="#1e1e2e")
        f.pack(fill="x", pady=(14, 2))
        tk.Frame(f, bg="#45475a", height=1).pack(fill="x", side="left", expand=True, pady=6)
        if title:
            tk.Label(f, text=f"  {title}  ", bg="#1e1e2e", fg="#6c7086",
                     font=("Segoe UI", 7, "bold")).pack(side="left")
        tk.Frame(f, bg="#45475a", height=1).pack(fill="x", side="left", expand=True, pady=6)

    def _entry_row(self, parent, label, show=None):
        row = tk.Frame(parent, bg="#1e1e2e")
        row.pack(fill="x", pady=3)
        tk.Label(row, text=label, width=18, anchor="w",
                 bg="#1e1e2e", fg="#cdd6f4", font=("Segoe UI", 9)).pack(side="left")
        var = tk.StringVar()
        e = ttk.Entry(row, textvariable=var, show=show, font=("Segoe UI", 10))
        e.pack(side="left", fill="x", expand=True)
        return var

    def _build_credentials_section(self):
        hdr_frame = tk.Frame(self._body, bg="#1e1e2e")
        hdr_frame.pack(fill="x", pady=(6, 2))
        tk.Label(hdr_frame, text="🔐  CREDENTIALS",
                 bg="#1e1e2e", fg="#a6e3a1",
                 font=("Segoe UI", 9, "bold")).pack(side="left")
        self._saved_badge = tk.Label(hdr_frame, text="", bg="#1e1e2e",
                                     fg="#a6e3a1", font=("Segoe UI", 8))
        self._saved_badge.pack(side="left", padx=8)

        cred_frame = tk.Frame(self._body, bg="#2a2a3e", padx=12, pady=10,
                              relief="flat", bd=0)
        cred_frame.pack(fill="x", pady=4)

        # Login URL row with dropdown
        row = tk.Frame(cred_frame, bg="#2a2a3e")
        row.pack(fill="x", pady=3)
        tk.Label(row, text="Login URL", width=18, anchor="w",
                 bg="#2a2a3e", fg="#cdd6f4", font=("Segoe UI", 9)).pack(side="left")
        self._login_url = tk.StringVar(value="https://login.salesforce.com")
        url_combo = ttk.Combobox(row, textvariable=self._login_url,
                                 values=["https://login.salesforce.com",
                                         "https://test.salesforce.com"],
                                 font=("Segoe UI", 10), width=40)
        url_combo.pack(side="left", fill="x", expand=True)

        for label, attr, show in [
            ("Username",       "_username",  None),
            ("Password",       "_password",  "•"),
            ("Security Token", "_token",     "•"),
        ]:
            row = tk.Frame(cred_frame, bg="#2a2a3e")
            row.pack(fill="x", pady=3)
            tk.Label(row, text=label, width=18, anchor="w",
                     bg="#2a2a3e", fg="#cdd6f4", font=("Segoe UI", 9)).pack(side="left")
            var = tk.StringVar()
            setattr(self, attr, var)
            ttk.Entry(row, textvariable=var, show=show,
                      font=("Segoe UI", 10)).pack(side="left", fill="x", expand=True)

        # Save checkbox
        self._save_creds = tk.BooleanVar(value=True)
        ttk.Checkbutton(cred_frame, text="Save credentials locally (~/.copado_loader_config.json)",
                        variable=self._save_creds).pack(anchor="w", pady=(6, 0))
        tk.Label(cred_frame,
                 text="⚠  Stored in plain JSON — use on personal/dev machines only.",
                 bg="#2a2a3e", fg="#f38ba8", font=("Segoe UI", 8)).pack(anchor="w")

    def _build_us_section(self):
        us_frame = tk.Frame(self._body, bg="#2a2a3e", padx=12, pady=10)
        us_frame.pack(fill="x", pady=4)

        # User Story
        row = tk.Frame(us_frame, bg="#2a2a3e")
        row.pack(fill="x", pady=3)
        tk.Label(row, text="User Story #", width=18, anchor="w",
                 bg="#2a2a3e", fg="#cdd6f4", font=("Segoe UI", 9)).pack(side="left")
        self._us_number = tk.StringVar()
        ttk.Entry(row, textvariable=self._us_number,
                  font=("Segoe UI", 10)).pack(side="left", fill="x", expand=True)
        tk.Label(row, text=" e.g. US-0042", bg="#2a2a3e",
                 fg="#6c7086", font=("Segoe UI", 8)).pack(side="left")

        # Package.xml browse
        row2 = tk.Frame(us_frame, bg="#2a2a3e")
        row2.pack(fill="x", pady=3)
        tk.Label(row2, text="package.xml", width=18, anchor="w",
                 bg="#2a2a3e", fg="#cdd6f4", font=("Segoe UI", 9)).pack(side="left")
        self._pkg_path = tk.StringVar()
        ttk.Entry(row2, textvariable=self._pkg_path,
                  font=("Segoe UI", 9)).pack(side="left", fill="x", expand=True, padx=(0, 6))
        ttk.Button(row2, text="📂  Browse", style="Gray.TButton",
                   command=self._browse_package_xml).pack(side="left")

        # Preview label
        self._pkg_preview = tk.Label(us_frame, text="", bg="#2a2a3e",
                                     fg="#89dceb", font=("Segoe UI", 8), anchor="w")
        self._pkg_preview.pack(fill="x", pady=(2, 0))

    def _build_commit_settings(self):
        cfg_frame = tk.Frame(self._body, bg="#2a2a3e", padx=12, pady=10)
        cfg_frame.pack(fill="x", pady=4)

        # Commit Action
        tk.Label(cfg_frame, text="Commit Action", bg="#2a2a3e",
                 fg="#cdd6f4", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self._commit_action = tk.StringVar(value="add")
        for val, desc in self.COMMIT_ACTION_LABELS.items():
            f = tk.Frame(cfg_frame, bg="#2a2a3e")
            f.pack(anchor="w", fill="x", pady=1)
            ttk.Radiobutton(f, text=val.upper(), variable=self._commit_action,
                            value=val).pack(side="left")
            tk.Label(f, text=f"  — {desc}", bg="#2a2a3e", fg="#6c7086",
                     font=("Segoe UI", 8)).pack(side="left")

        tk.Frame(cfg_frame, bg="#45475a", height=1).pack(fill="x", pady=8)

        # Metadata mode
        tk.Label(cfg_frame, text="Existing Metadata on User Story",
                 bg="#2a2a3e", fg="#cdd6f4",
                 font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self._metadata_mode = tk.StringVar(value="override")
        for val, desc in self.METADATA_MODES.items():
            f = tk.Frame(cfg_frame, bg="#2a2a3e")
            f.pack(anchor="w", fill="x", pady=1)
            ttk.Radiobutton(f, text=val.capitalize(),
                            variable=self._metadata_mode, value=val).pack(side="left")
            tk.Label(f, text=f"  — {desc.split('—')[1].strip()}", bg="#2a2a3e",
                     fg="#6c7086", font=("Segoe UI", 8)).pack(side="left")

        tk.Frame(cfg_frame, bg="#45475a", height=1).pack(fill="x", pady=8)

        # Module directory
        row = tk.Frame(cfg_frame, bg="#2a2a3e")
        row.pack(fill="x", pady=2)
        tk.Label(row, text="Module Directory", width=18, anchor="w",
                 bg="#2a2a3e", fg="#cdd6f4", font=("Segoe UI", 9)).pack(side="left")
        self._module_dir = tk.StringVar(value="force-app/main/default")
        ttk.Entry(row, textvariable=self._module_dir,
                  font=("Segoe UI", 10)).pack(side="left", fill="x", expand=True)

    def _build_action_buttons(self):
        btn_frame = tk.Frame(self._body, bg="#1e1e2e")
        btn_frame.pack(fill="x", pady=8)

        self._run_btn = ttk.Button(btn_frame, text="▶  Connect & Load to Copado",
                                   style="Green.TButton", command=self._run)
        self._run_btn.pack(side="left", padx=(0, 8))

        ttk.Button(btn_frame, text="Clear Log", style="Gray.TButton",
                   command=self._clear_log).pack(side="left")

        self._progress = ttk.Progressbar(self._body, mode="indeterminate",
                                         style="TProgressbar")
        self._progress.pack(fill="x", pady=(4, 0))

    def _build_log_area(self):
        self._log = scrolledtext.ScrolledText(
            self._body, height=14, bg="#181825", fg="#cdd6f4",
            font=("Consolas", 9), insertbackground="#cdd6f4",
            relief="flat", bd=0, state="disabled"
        )
        self._log.pack(fill="both", expand=True, pady=4)
        self._log.tag_configure("ok",   foreground="#a6e3a1")
        self._log.tag_configure("err",  foreground="#f38ba8")
        self._log.tag_configure("warn", foreground="#f9e2af")
        self._log.tag_configure("info", foreground="#89dceb")

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _restore_saved_values(self):
        if self._creds:
            self._login_url.set(self._creds.get("login_url", "https://login.salesforce.com"))
            self._username.set(self._creds.get("username", ""))
            self._password.set(self._creds.get("password", ""))
            self._token.set(self._creds.get("token", ""))
            self._saved_badge.config(text="✔  Credentials loaded from saved config")
            self._log_msg("✔  Saved credentials loaded.", "ok")

    def _browse_package_xml(self):
        path = filedialog.askopenfilename(
            title="Select package.xml",
            filetypes=[("XML files", "*.xml"), ("All files", "*.*")]
        )
        if path:
            self._pkg_path.set(path)
            try:
                comps = parse_package_xml(path)
                from collections import Counter
                counts = Counter(c["type"] for c in comps)
                summary = "  |  ".join(f"{t}: {n}" for t, n in sorted(counts.items()))
                self._pkg_preview.config(
                    text=f"📦  {len(comps)} components  ·  {summary}"
                )
                self._log_msg(f"📦  Parsed {len(comps)} components from package.xml", "info")
            except Exception as e:
                self._pkg_preview.config(text=f"⚠  Parse error: {e}")

    def _log_msg(self, msg: str, tag: str = ""):
        def _do():
            self._log.configure(state="normal")
            ts = datetime.now().strftime("%H:%M:%S")
            self._log.insert("end", f"[{ts}] {msg}\n", tag or "")
            self._log.see("end")
            self._log.configure(state="disabled")
        self.after(0, _do)

    def _clear_log(self):
        self._log.configure(state="normal")
        self._log.delete("1.0", "end")
        self._log.configure(state="disabled")

    def _set_running(self, running: bool):
        def _do():
            if running:
                self._run_btn.config(state="disabled", text="⏳  Running…")
                self._progress.start(12)
            else:
                self._run_btn.config(state="normal", text="▶  Connect & Load to Copado")
                self._progress.stop()
                self._progress["value"] = 0
        self.after(0, _do)

    # ── Main run ──────────────────────────────────────────────────────────────
    def _run(self):
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._run_task, daemon=True)
        self._thread.start()

    def _run_task(self):
        self._set_running(True)
        try:
            self._do_load()
        except Exception as e:
            self._log_msg(f"✗  Error: {e}", "err")
            self.after(0, lambda: messagebox.showerror("Error", str(e)))
        finally:
            self._set_running(False)

    def _do_load(self):
        # ── Validate inputs
        username   = self._username.get().strip()
        password   = self._password.get().strip()
        token      = self._token.get().strip()
        login_url  = self._login_url.get().strip()
        us_number  = self._us_number.get().strip()
        pkg_path   = self._pkg_path.get().strip()
        action     = self._commit_action.get()
        mode       = self._metadata_mode.get()
        module_dir = self._module_dir.get().strip()

        if not all([username, password, us_number, pkg_path]):
            raise ValueError("Username, password, User Story #, and package.xml are required.")
        if not os.path.exists(pkg_path):
            raise FileNotFoundError(f"package.xml not found: {pkg_path}")

        # ── Optionally save credentials
        if self._save_creds.get():
            save_credentials({
                "login_url": login_url,
                "username":  username,
                "password":  password,
                "token":     token,
            })
            self._log_msg("💾  Credentials saved to ~/.copado_loader_config.json", "info")
            self.after(0, lambda: self._saved_badge.config(text="✔  Credentials saved"))

        # ── Parse package.xml
        self._log_msg(f"📂  Parsing: {pkg_path}", "info")
        components = parse_package_xml(pkg_path)
        self._log_msg(f"📦  Found {len(components)} component(s)", "ok")
        if not components:
            raise ValueError("No components found in package.xml (wildcards * are skipped).")

        # ── Connect
        sf = connect_to_salesforce(username, password, token, login_url, self._log_msg)

        # ── Find User Story
        us = find_user_story(sf, us_number, self._log_msg)
        us_id = us["Id"]

        # ── Check existing
        existing = get_existing_metadata(sf, us_id)
        self._log_msg(f"📋  Existing metadata on US: {len(existing)} record(s)", "info")

        if mode == "override":
            if existing:
                self._log_msg(f"🔄  Override mode — deleting {len(existing)} existing record(s)…", "warn")
                delete_metadata_records(sf, existing, self._log_msg)
            else:
                self._log_msg("ℹ   No existing records to clear.", "info")
        else:
            # Append — skip components that are already present
            existing_set = {
                (r["copado__Type__c"], r["copado__Metadata_API_Name__c"])
                for r in existing
            }
            before = len(components)
            components = [
                c for c in components
                if (c["type"], c["apiName"]) not in existing_set
            ]
            skipped = before - len(components)
            if skipped:
                self._log_msg(f"⏭   Append mode — skipped {skipped} already-present component(s)", "warn")
            self._log_msg(f"➕  Will insert {len(components)} new component(s)", "info")

        if not components:
            self._log_msg("✅  Nothing new to insert. All components already on US.", "ok")
        else:
            # ── Insert
            self._log_msg(f"⬆   Inserting {len(components)} records (action={action})…", "info")
            inserted, failed = insert_metadata_records(
                sf, us_id, components, action, module_dir, self._log_msg
            )

        # ── Open commit page
        instance = sf.sf_instance
        commit_url = build_commit_url(instance, us_id)
        self._log_msg(f"🌐  Opening commit page: {commit_url}", "info")
        opened = open_in_chrome(commit_url)
        if opened:
            self._log_msg("✅  Opened in Chrome. Go to the Metadata tab → Click 'Commit Changes'", "ok")
        else:
            self._log_msg("✅  Opened in default browser (Chrome not found on PATH).", "ok")
            self._log_msg(f"   URL: {commit_url}", "info")

        # ── Final summary popup
        summary = (
            f"User Story : {us['Name']}\n"
            f"Components : {len(components)}\n"
            f"Action     : {action.upper()}\n"
            f"Mode       : {mode.upper()}\n\n"
            "Browser opened. Go to the Metadata tab and click 'Commit Changes'."
        )
        self.after(0, lambda: messagebox.showinfo("Done!", summary))


# ─── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = CopadoLoaderApp()
    app.mainloop()
