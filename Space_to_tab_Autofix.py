import os
import pathlib
import re
import subprocess

TAB_SIZE = 4
APEX_EXTS = {".cls"}

DEFAULT_BRANCH = os.environ.get("DEFAULT_BRANCH", "main")
EVENT_NAME = os.environ.get("EVENT_NAME", "")
BEFORE_SHA = os.environ.get("BEFORE_SHA", "")
HEAD_SHA = os.environ.get("HEAD_SHA", "HEAD")

ZERO_SHA = "0" * 40

def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd).decode().strip()

def get_base_ref() -> str:
    """
    For push: diff from BEFORE_SHA -> HEAD_SHA.
    For branch create (or first push where BEFORE_SHA is all zeros): diff from origin/<default_branch> -> HEAD.
    """
    if EVENT_NAME == "push" and BEFORE_SHA and BEFORE_SHA != ZERO_SHA:
        return BEFORE_SHA
    return f"origin/{DEFAULT_BRANCH}"

def get_changed_files(base_ref: str, head_ref: str) -> list[str]:
    cmd = ["git", "diff", "--name-only", f"{base_ref}...{head_ref}"]
    diff_out = run(cmd)
    files = diff_out.splitlines() if diff_out else []

    out: list[str] = []
    for f in files:
        p = pathlib.Path(f)
        # Only Apex classes under classes/
        if p.suffix.lower() in APEX_EXTS and p.parts and p.parts[0] == "classes":
            out.append(f)
    return out

def convert_spaces_to_tabs(line: str) -> str:
    m = re.match(r"^( +)", line)
    if not m:
        return line
    leading_spaces = len(m.group(1))
    tabs = leading_spaces // TAB_SIZE
    leftover_spaces = leading_spaces % TAB_SIZE
    return ("\t" * tabs) + (" " * leftover_spaces) + line[leading_spaces:]

def fix_whole_file(filepath: str) -> bool:
    updated = False
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        new_line = convert_spaces_to_tabs(line)
        if new_line != line:
            updated = True
        new_lines.append(new_line)

    if updated:
        with open(filepath, "w", encoding="utf-8", newline="\n") as f:
            f.writelines(new_lines)

    return updated

if __name__ == "__main__":
    # Ensure we can diff against origin/<default_branch>
    subprocess.run(["git", "fetch", "origin", DEFAULT_BRANCH, "--depth=1"], check=False)

    base = get_base_ref()
    head = HEAD_SHA or "HEAD"

    changed_files = get_changed_files(base, head)
    fixed_files = []

    for file in changed_files:
        if fix_whole_file(file):
            print(f"::warning file={file}::Spaces → Tabs auto-fix applied")
            fixed_files.append(file)

    if fixed_files:
        subprocess.run(["git", "config", "user.name", "mukeshranaotsi"], check=True)
        subprocess.run(["git", "config", "user.email", "mukesh.rana@Otsi.ca.gov"], check=True)
        subprocess.run(["git", "add"] + fixed_files, check=True)
        # Only commit if there are staged changes
        diff_rc = subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode
        if diff_rc != 0:
            subprocess.run(["git", "commit", "-m", "Auto-fix: Spaces → Tabs"], check=True)
            subprocess.run(["git", "push"], check=True)

    print("Space-to-tab check complete.")
