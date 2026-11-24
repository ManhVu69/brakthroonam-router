#!/usr/bin/env bash
# Brakthroonam Router Start Script for Linux / macOS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================================="
echo "   BRAKTHROONAM ROUTER PRO GATEWAY (Linux)"
echo "======================================================================="
echo "   Dashboard : http://localhost:20129"
echo "   OpenAI API: http://localhost:20129/v1"
echo "======================================================================="
echo ""

# Kiem tra va tu dong cap nhat ban moi nhat tu GitHub (neu co git va online)
if command -v git >/dev/null 2>&1 && [ -d ".git" ]; then
    echo "[*] Dang kiem tra cap nhat tu GitHub..."
    if git pull --ff-only >/dev/null 2>&1; then
        echo "[OK] He thong da duoc cap nhat len ban moi nhat tu GitHub!"
    else
        echo "[!] Khong the tu dong cap nhat (co the do offline hoac xung dot code)."
    fi
    echo ""
fi

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "[!] Node.js chua duoc cai dat tren he thong."
    echo "    Vui long cai dat Node.js bang lenh sau:"
    echo "    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs"
    echo ""
    read -p "Nhan Enter de thoat..."
    exit 1
fi

NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "======================================================================="
    echo "[!] CANH BAO: Phien ban Node.js hien tai la $(node -v) (qua cu)."
    echo "    Thu vien better-sqlite3 yeu cau Node.js v20 hoac v22 (LTS) de chay."
    echo "    Chay tren Node.js v18 se bi loi Segmentation fault (core dumped)."
    echo ""
    echo "    Vui long nang cap len Node.js v22 bang 2 lenh sau:"
    echo "    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "    sudo apt install -y nodejs"
    echo "======================================================================="
    echo ""
    read -p "Nhan Enter de thoat..."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[*] Thu muc node_modules chua ton tai. Dang chay npm install..."
    npm install
fi

# Check if router is already running on port 20129
if command -v lsof >/dev/null 2>&1 && lsof -ti:20129 >/dev/null 2>&1; then
    echo "[*] Brakthroonam Router da dang chay tren cong 20129! Dang mo Web Dashboard..."
    xdg-open "http://localhost:20129" 2>/dev/null || true
    exit 0
fi

# Launch router
node "$SCRIPT_DIR/bin/cli.js" "$@"
