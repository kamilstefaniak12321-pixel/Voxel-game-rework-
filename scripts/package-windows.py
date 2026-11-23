"""Build the x64 Windows installer using NSIS on Linux, macOS or Windows."""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from urllib.request import urlretrieve
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
ELECTRON = "45.4.1"
ARCHIVE = f"electron-v{ELECTRON}-win32-x64.zip"
SHA256 = "2ba6223afa9121f42831fefe92c434334907540165294fc56697449d12e7cfe9"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--electron-zip", type=Path, help="Reuse a previously downloaded runtime.")
    parser.add_argument("--makensis", default="makensis")
    args = parser.parse_args()
    version = json.loads((ROOT / "package.json").read_text())["version"]
    web = ROOT / "dist/index.html"
    if not web.is_file():
        parser.error("Build the game first with npm run build.")
    out = ROOT / "out"
    out.mkdir(exist_ok=True)
    windows = ROOT / "packaging/windows"
    target = out / f"Various-Roots-{version}-Windows-x64-Setup.exe"
    with tempfile.TemporaryDirectory(dir=out) as directory:
        stage = Path(directory)
        archive = args.electron_zip or stage / ARCHIVE
        if not args.electron_zip:
            urlretrieve(f"https://github.com/electron/electron/releases/download/v{ELECTRON}/{ARCHIVE}", archive)
        with archive.open("rb") as stream:
            checksum = hashlib.file_digest(stream, "sha256").hexdigest()
        if checksum != SHA256:
            raise ValueError(f"Incorrect Electron checksum for {archive.name}")
        runtime = stage / "runtime"
        with ZipFile(archive) as source:
            source.extractall(runtime)
        (runtime / "electron.exe").rename(runtime / "VariousRoots.exe")
        (runtime / "resources/default_app.asar").unlink(missing_ok=True)
        app = runtime / "resources/app"
        app.mkdir()
        shutil.copy(web, app)
        shutil.copy(windows / "main.cjs", app)
        shutil.copy(windows / "preload.cjs", app)
        shutil.copy(ROOT / "out/desktop/updates.cjs", app)
        (runtime / "resources/app-update.yml").write_text("updaterCacheDirName: various-roots-preview-updater\n", encoding="utf-8")
        shutil.copy(ROOT / "assets/icon.png", app)
        (app / "package.json").write_text(json.dumps({
            "name": "various-roots", "productName": "Various Roots", "version": version, "main": "main.cjs"
        }), encoding="utf-8")
        prefix = "/D" if os.name == "nt" else "-D"
        subprocess.run([args.makensis, prefix + "VERSION=" + version,
                        prefix + "OUTPUT_FILE=" + str(target), prefix + "RUNTIME_FILES=" + str(runtime / "*"),
                        prefix + "ICON_FILE=" + str(windows / "icon.ico"), str(windows / "setup.nsi")], check=True)
    with target.open("rb") as stream:
        checksum = base64.b64encode(hashlib.file_digest(stream, "sha512").digest()).decode("ascii")
    manifest = {"version": version, "path": target.name, "sha512": checksum,
                "files": [{"url": target.name, "sha512": checksum, "size": target.stat().st_size}],
                "releaseDate": datetime.now(timezone.utc).isoformat()}
    (out / "latest.yml").write_text(json.dumps(manifest), encoding="utf-8")
    print(target)


if __name__ == "__main__":
    main()
