# 🚀 Oracle Cloud (Always Free) 24/7 Deployment Gids

Deze bot is volledig geoptimaliseerd om **24 uur per dag, 7 dagen per week gratis** te draaien op een **Oracle Cloud Infrastructure (OCI) Always Free VM** (bijvoorbeeld een AMD micro instance of een Ampere A1 ARM instance met Ubuntu 24.04/22.04 LTS).

In Paper Trading modus voert de bot zelfstandig alle signalen, trailing stops, doelen en Discord/Slack-notificaties uit zonder enig echt kapitaalrisico.

---

## 1. Oracle Cloud VM Aanmaken (Always Free)
1. Log in op je **Oracle Cloud Console** ([cloud.oracle.com](https://cloud.oracle.com/)).
2. Ga naar **Compute** &rarr; **Instances** &rarr; klik op **Create Instance**.
3. **Image:** Kies **Canonical Ubuntu 24.04** of **Ubuntu 22.04 Minimal**.
4. **Shape:** Kies **Always Free Eligible**:
   - *Optie A (Aanbevolen):* **VM.Standard.A1.Flex** (Ampere ARM, bijv. 1 of 2 OCPU, 6 tot 12 GB RAM) - 100% gratis.
   - *Optie B:* **VM.Standard.E2.1.Micro** (AMD, 1 OCPU, 1 GB RAM) - 100% gratis.
5. Download je **SSH Private Key** (`.key` bestand) naar je computer.
6. Klik op **Create**. Binnen ~1 minuut is de server actief en heb je een **Public IP** (bijv. `129.151.xx.xx`).

---

## 2. Netwerkpoort 3000 Openen (Oracle VCN Ingress Rule)
Oracle Cloud blokkeert standaard alle inkomende poorten behalve poort 22 (SSH). Om toegang te krijgen tot het webdashboard via `http://<JOUW_IP>:3000`:

1. Klik in de instance-details op je **Virtual Cloud Network (VCN)**.
2. Klik op **Security Lists** &rarr; **Default Security List for...**.
3. Klik op **Add Ingress Rules**:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Destination Port Range:** `3000` (of `80, 443, 3000`)
   - **Description:** `QuantCrypto Dashboard`
4. Klik op **Add Ingress Rules**.

---

## 3. Verbinden via SSH en Installatie in 3 Minuten

Verbind via je terminal of PowerShell:
```bash
ssh -i /pad/naar/jouw_ssh_key.key ubuntu@<JOUW_PUBLIC_IP>
```

Voer daarna de volgende commando's uit op je Ubuntu server:

```bash
# 1. Server bijwerken
sudo apt update && sudo apt upgrade -y

# 2. Node.js 20 LTS en Git installeren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# 3. PM2 Process Manager installeren (zorgt dat de bot 24/7 herstart bij reboots)
sudo npm install -g pm2

# 4. Ubuntu firewall (iptables/ufw) poort 3000 openzetten
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo ufw allow 3000/tcp

# 5. Het project ophalen (of uploaden)
git clone <JOUW_REPO_URL> trading-bot
cd trading-bot

# 6. Dependencies installeren en bouwen
npm install
npm run build

# 7. Start de bot 24/7 met PM2
pm2 start npm --name "quant-crypto-bot" -- start
pm2 save
pm2 startup
```

---

## 4. Toegang tot je Live Dashboard

Open je browser en ga naar:
```
http://<JOUW_PUBLIC_IP>:3000
```

### Belangrijke veiligheidstips:
1. **Master PIN instellen:** Ga direct naar het tabblad **Notificaties & Beveiliging** en stel een Master PIN in. Zonder PIN kan iedereen die je IP raadt orders plaatsen.
2. **Discord / Slack koppelen:** Vul je Webhook URL in zodat je notificaties op je telefoon ontvangt als de bot autonoom posities opent of met winst/verlies sluit.
3. **Paper Trading staat standaard aan:** De bot test nu 100% veilig met virtueel geld tegen realtime marktdata van de crypto exchanges.
4. **Herstartgarantie:** Alle openstaande posities en trades worden continu opgeslagen in `data/bot_state.json`. Als Oracle de server herstart, pakt PM2 de bot automatisch weer op en worden alle posities naadloos hervat.

---

## 5. Handige PM2 Beheercommando's

```bash
# Realtime logboeken bekijken (trades, signalen, exits)
pm2 logs quant-crypto-bot

# Status controleren van de bot
pm2 status

# Bot herstarten
pm2 restart quant-crypto-bot

# Bot stoppen
pm2 stop quant-crypto-bot
```
