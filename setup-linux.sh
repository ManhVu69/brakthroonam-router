#!/usr/bin/env bash
# Setup Brakthroonam Router for Ubuntu / Linux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================================="
echo "   CAI DAT VA CAU HINH BRAKTHROONAM ROUTER CHO UBUNTU / LINUX"
echo "======================================================================="

# 1. Cap quyen thuc thi cho cac file script
chmod +x "$SCRIPT_DIR/start.sh"
chmod +x "$SCRIPT_DIR/stop.sh"
chmod +x "$SCRIPT_DIR/bin/cli.js"

# 2. Cau hinh Ubuntu Nautilus de click dup file .sh la chay luon
if command -v gsettings >/dev/null 2>&1; then
    gsettings set org.gnome.nautilus.preferences executable-text-activation 'launch' 2>/dev/null || true
    echo "[OK] Da cau hinh Ubuntu cho phep click dup vao file .sh de chay truc tiep."
fi

# 3. Tao Shortcut Desktop va Application Menu
DESKTOP_DIR="$HOME/Desktop"
APPS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPS_DIR"

DESKTOP_CONTENT="[Desktop Entry]
Version=1.0
Type=Application
Name=Brakthroonam Router
Comment=Local AI Gateway & Reverse Proxy Engine
Exec=bash -c \"cd '$SCRIPT_DIR' && ./start.sh\"
Icon=utilities-terminal
Terminal=true
Categories=Development;Network;"

echo "$DESKTOP_CONTENT" > "$APPS_DIR/brakthroonam-router.desktop"
chmod +x "$APPS_DIR/brakthroonam-router.desktop"

if [ -d "$DESKTOP_DIR" ]; then
    echo "$DESKTOP_CONTENT" > "$DESKTOP_DIR/brakthroonam-router.desktop"
    chmod +x "$DESKTOP_DIR/brakthroonam-router.desktop"
    if command -v gio >/dev/null 2>&1; then
        gio set "$DESKTOP_DIR/brakthroonam-router.desktop" metadata::trusted true 2>/dev/null || true
    fi
    echo "[OK] Da tao icon 'Brakthroonam Router' ngay tren man hinh Desktop!"
fi

echo "[OK] Da tich hop vao menu ung dung Ubuntu (Applications)."
echo ""
echo "======================================================================="
echo "   HOAN TAT! Tu gio ban co the:"
echo "   1. Click dup vao icon 'Brakthroonam Router' tren man hinh Desktop."
echo "   2. Hoac click dup truc tiep vao file 'start.sh'."
echo "======================================================================="
