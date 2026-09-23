# 🌐 24/7 Gratis Hosting Vergelijking & Gidsen voor de Crypto Bot

Hieronder vind je de **beste gratis alternatieven** voor Oracle Cloud om de QuantCrypto bot 24/7 te laten draaien, inclusief voor- en nadelen en concrete instructies.

---

## Overzicht van de Opties

| Methode | Type | Kosten | Moeilijkheid | 24/7 Zonder Slaapstand? | Persistentie (data/bot_state.json)? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Raspberry Pi / Oude Laptop thuis** | Eigen Hardware | 100% Gratis (~€1-2 stroom/mnd) | Zeer Eenvoudig | ✅ Ja (100% continu) | ✅ Ja (lokale SSD/SD) |
| **2. Render.com / Railway / Fly.io** | Cloud PaaS (Docker/Node) | Gratis Tiers / $5 maandtegoed | Eenvoudig (Git push) | ⚠️ Render slaapt na 15 min (gratis ping nodig). Fly/Railway blijft actief binnen budget. | ⚠️ Vereist volume mount voor dataopslag. |
| **3. Google Cloud (e2-micro Always Free)** | Cloud VPS | 100% Levenslang Gratis | Gemiddeld (zoals Oracle) | ✅ Ja (24/7) | ✅ Ja (30 GB persistente schijf) |
| **4. GitHub Codespaces / Gitpod** | Cloud Dev Environment | Gratis 60 uur/mnd | Zeer Eenvoudig | ❌ Nee (sluit af bij inactiviteit, alleen geschikt voor testen) | ⚠️ Tijdelijk |

---

## 🌟 Optie 1: Oude Laptop of Raspberry Pi Thuis (Aanrader!)

Heb je thuis nog een oude laptop (Windows, Mac of Linux) of een Raspberry Pi 3/4/5 in de kast liggen? Dit is veruit de **meest betrouwbare en gemakkelijkste gratis manier**:

### Waarom dit geweldig werkt voor Paper Trading:
* **Ingebouwde batterij (laptop):** Mocht de stroom even uitvallen, blijft de laptop gewoon doordraaien op accu en verlies je geen trades.
* **Geen cloud restricties:** Geen poortblokkades van cloudproviders, geen creditcardregistratie vereist, geen datalimieten.
* **Verbruik:** Een oude laptop met dichtgeklapt scherm verbruikt amper 5 tot 10 Watt (~€1 per maand aan stroom). Een Raspberry Pi verbruikt slechts ~2-3 Watt.

### Hoe instellen op een oude laptop/PC:
1. **Installeer Node.js 20 LTS** vanaf [nodejs.org](https://nodejs.org).
2. Download de code en open de map in je terminal / PowerShell.
3. Voer uit:
   ```bash
   npm install
   npm run build
   npm install -g pm2
   pm2 start npm --name "trading-bot" -- start
   pm2 save
   ```
4. **Scherm dichtklappen instelling (Windows/Mac):**
   * *Windows:* Ga naar Configuratiescherm &rarr; Energiebeheer &rarr; *"Actie bij sluiten van het deksel"* &rarr; kies **"Geen actie ondernemen"**.
   * Nu kun je de laptop dichtklappen, in de meterkast of werkkamer leggen, en de bot scant 24/7 autonoom de markten terwijl jij Discord/Slack alerts op je telefoon krijgt!

---

## 🌟 Optie 2: Google Cloud Platform (GCP) Always Free `e2-micro`

Net als Oracle biedt ook **Google Cloud** een machine die **levenslang gratis** is in bepaalde regio's:

* **Specificaties:** 1 `e2-micro` instance (2 vCPU burst, 1 GB RAM, 30 GB SSD schijf per maand gratis).
* **Regio's (belangrijk voor Always Free):** `us-central1` (Iowa), `us-east1` (South Carolina) of `us-west1` (Oregon).

### Stappen:
1. Ga naar [console.cloud.google.com](https://console.cloud.google.com).
2. Maak een VM aan met machine type **e2-micro** in bijv. `us-central1`.
3. Kies **Ubuntu 22.04 LTS** of **Debian 12**.
4. Vink aan: *"Allow HTTP traffic"* en voeg in de firewall een regel toe voor poort `3000`.
5. Start de bot met `pm2 start npm --name "bot" -- start`.

---

## 🌟 Optie 3: Render.com / Koyeb (PaaS via GitHub)

Wil je geen server beheren via SSH? Platforms zoals **Render.com** of **Koyeb** kunnen een Node.js applicatie direct starten vanuit een GitHub repository.

### Hoe werkt het gratis:
* Je koppelt je GitHub repo aan Render (als "Web Service").
* **Build command:** `npm install && npm run build`
* **Start command:** `npm start`
* *Aandachtspunt:* De gratis versie van Render gaat na 15 minuten inactiviteit in slaapstand. Dit kun je omzeilen door een gratis uptime-monitor (zoals [cron-job.org](https://cron-job.org) of [uptimerobot.com](https://uptimerobot.com)) elke 5 minuten een `GET` verzoek te laten sturen naar `https://jouw-app.onrender.com/api/state`. Zo blijft de bot continu wakker!

---

## Samenvatting & Advies

1. **Als je thuis een oude laptop hebt:** Gebruik die! Het is in 5 minuten geregeld, 100% gratis, super stabiel en heeft met de accu zelfs een noodstroomvoorziening.
2. **Als je 100% Cloud wilt zonder creditcard gezeur:** **Render.com** (met een gratis UptimeRobot ping) of **Koyeb**.
3. **Als je een echte krachtige gratis Cloud server wilt:** **Oracle Cloud Always Free** (heeft de ruimste specificaties: tot 4 cores en 24GB RAM) of **Google Cloud e2-micro**.
