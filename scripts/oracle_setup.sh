#!/usr/bin/env bash
# ==============================================================================
# QuantCrypto Engine - Oracle Cloud Always Free 1-Click Setup Script
# Works on Ubuntu 22.04 LTS and Ubuntu 24.04 LTS
# ==============================================================================

set -e

echo "========================================================="
echo "🚀 Start QuantCrypto Setup op Oracle Cloud VM"
echo "========================================================="

# 1. Update system packages
echo "📦 [1/6] Systeempakketten bijwerken..."
sudo apt update -y
sudo apt install -y curl git build-essential ufw iptables-persistent

# 2. Install Node.js 20 LTS
echo "🟢 [2/6] Node.js 20 LTS installeren..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "Node.js $(node -v) is al aanwezig."
fi

# 3. Install PM2
echo "⚡ [3/6] PM2 Process Manager installeren..."
sudo npm install -g pm2

# 4. Open Port 3000 in iptables / ufw
echo "🛡️ [4/6] Poort 3000 openen in Ubuntu firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true
sudo ufw allow 3000/tcp || true
sudo netfilter-persistent save 2>/dev/null || true

# 5. Install Dependencies & Build
echo "🔨 [5/6] Dependencies installeren en productie-build maken..."
npm install
npm run build

# 6. Start with PM2
echo "🚀 [6/6] Bot starten in achtergrond met PM2..."
pm2 delete quant-crypto-bot 2>/dev/null || true
pm2 start npm --name "quant-crypto-bot" -- start
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true

echo "========================================================="
echo "✅ Installatie Voltooid!"
echo "Je bot draait nu 24/7 op de achtergrond!"
echo ""
echo "Open in je browser:"
echo "👉 http://$(curl -s ifconfig.me 2>/dev/null || echo '<JOUW_PUBLIC_IP>'):3000"
echo ""
echo "Handige commando's:"
echo "  pm2 logs quant-crypto-bot   (Live logboeken bekijken)"
echo "  pm2 status                  (Status bekijken)"
echo "  pm2 restart quant-crypto-bot (Herstarten)"
echo "========================================================="
