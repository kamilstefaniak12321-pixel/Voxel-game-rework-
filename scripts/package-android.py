"""Build and sign the offline preview APK with JDK 17+ and Android SDK 35."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "packaging/android"
BUILD_TOOLS = "35.0.0"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sdk", default=os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT"))
    parser.add_argument("--debug-keystore", type=Path,
                        default=Path(os.environ.get("ANDROID_USER_HOME", Path.home() / ".android")) / "debug.keystore")
    args = parser.parse_args()
    if not args.sdk:
        parser.error("Set ANDROID_HOME or pass --sdk.")
    sdk = Path(args.sdk).resolve()
    tools = sdk / "build-tools" / BUILD_TOOLS
    android = sdk / "platforms/android-35/android.jar"
    if not android.is_file() or not tools.is_dir():
        parser.error("Install platforms;android-35 and build-tools;35.0.0 with Android SDK Manager.")
    if not (ROOT / "dist/index.html").is_file():
        parser.error("Build the game first with npm run build.")
    jdk = os.environ.get("JAVA_HOME")
    def java_tool(name):
        return str(Path(jdk) / "bin" / name) if jdk else name

    def run(*command):
        subprocess.run([str(value) for value in command], check=True)

    version = json.loads((ROOT / "package.json").read_text())["version"]
    major, minor, patch = (int(number) for number in version.split("."))
    version_code = major * 1_000_000 + minor * 1000 + patch
    out = ROOT / "out"
    out.mkdir(exist_ok=True)
    target = out / f"Various-Roots-{version}-Android.apk"
    key = args.debug_keystore.resolve()
    if not key.exists():
        key.parent.mkdir(parents=True, exist_ok=True)
        run(java_tool("keytool"), "-genkeypair", "-keystore", key, "-storepass", "android",
            "-keypass", "android", "-alias", "androiddebugkey", "-keyalg", "RSA", "-keysize", 2048,
            "-validity", 10000, "-dname", "CN=Various Roots Preview,O=Android,C=PL")
    with tempfile.TemporaryDirectory(dir=out) as directory:
        stage = Path(directory)
        res = stage / "res/drawable-nodpi"
        classes, dex = stage / "classes", stage / "dex"
        for folder in (res, classes, dex):
            folder.mkdir(parents=True)
        shutil.copy(ROOT / "assets/icon.png", res / "game_icon.png")
        run(tools / "aapt2", "compile", "--dir", stage / "res", "-o", stage / "res.zip")
        resources = stage / "unsigned.apk"
        run(tools / "aapt2", "link", "-o", resources, "-I", android, "--manifest", PACKAGE / "AndroidManifest.xml",
            "-A", ROOT / "dist", "--min-sdk-version", "26", "--target-sdk-version", "35",
            "--version-code", version_code, "--version-name", version, stage / "res.zip")
        run(java_tool("javac"), "-encoding", "UTF-8", "-source", "8", "-target", "8", "-bootclasspath",
            os.pathsep.join([str(tools / "core-lambda-stubs.jar"), str(android)]),
            "-d", classes, *sorted((PACKAGE / "java").rglob("*.java")))
        run(java_tool("java"), "-cp", tools / "lib/d8.jar", "com.android.tools.r8.D8", "--release", "--min-api", "26",
            "--lib", android, "--output", dex, *sorted(classes.rglob("*.class")))
        with ZipFile(resources, "a", compression=ZIP_DEFLATED) as apk:
            apk.write(dex / "classes.dex", "classes.dex")
        aligned = stage / "aligned.apk"
        run(tools / "zipalign", "-f", "4", resources, aligned)
        signer = [java_tool("java"), "-jar", tools / "lib/apksigner.jar"]
        signed = stage / "signed.apk"
        run(*signer, "sign", "--ks", key, "--ks-key-alias", "androiddebugkey", "--ks-pass", "pass:android",
            "--key-pass", "pass:android", "--v4-signing-enabled", "false", "--out", signed, aligned)
        run(*signer, "verify", "--verbose", signed)
        signed.replace(target)
    print(target)


if __name__ == "__main__":
    main()
