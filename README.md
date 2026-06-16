# AetherNOC // Secure Predictive MPLS Copilot

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://isro-bah-2026-copilot-wgynwswuwwyt6yjnhbsnbo.streamlit.app/)

Developed by **Team Pathfinders** for the **Bharatiya Antariksh Hackathon (ISRO BAH) 2026**.

AetherNOC is a high-fidelity, interactive, and visually stunning Network Operations Center (NOC) dashboard prototype. It demonstrates proactive fault forecasting under absolute air-gap isolation for secure MPLS network operations.

## 🌌 The Problem & Our Solution

Traditional NOC utilities suffer from **reactive detection**—triggering alarms only *after* performance thresholds are breached and services are already disrupted. Standard AI solutions rely on external cloud APIs, violating the strict **air-gap constraints** of secure satellite ground networks.

**AetherNOC** introduces a proactive, entirely on-premises paradigm: a fully autonomous, offline AI NOC Copilot that predicts network failures with enough lead time to act, keeping all telemetry data fully contained within the secure ground perimeter.

---

## 🏗️ The Four Core Pillars

1. **Multi-Site Network Simulation**: A self-contained network topology mimicking a branch, hub, and datacenter grid running active MPLS, VPNs, BGP/OSPF routing, and IPSec tunnels.
2. **Precursor-Based Fault Analytics**: Machine learning models (Isolation Forests/LSTMs) engineered specifically to forecast network errors by tracking early warning signs (latency creep, route flaps, queue congestion) before outages occur.
3. **Self-Hosted LLM NOC Copilot**: A highly optimized local language model (Qwen-2.5-Coder) operating over on-site runbooks and topology configuration telemetry.
4. **Integrated Workflow Automation**: Event-correlation and alert prioritization with dynamic confidence scoring, providing automated playbooks with copy-and-run verification commands to operators.

---

## 🎨 Design Aesthetics
- **Theme**: Premium obsidian dark mode ("Cosmic Dark").
- **Colors**: Deep indigo backgrounds, neon cyan highlights (`#00f0ff`), warning amber/orange (`#ff9d00`), and critical red alerts (`#ff3355`).
- **Telemetry Charts**: Smooth, high-performance HTML5 `<canvas>` rendering engine with glowing vector path trails and dynamic grid systems.
- **Micro-Animations**: Hover-triggered topology nodes, moving link-traffic particles, glowing warning badges, and a typing terminal cursor.

---

## 📂 Project Structure

```
isro-bah-2026-copilot/
├── index.html          # Semantic dashboard structure & inline SVG topology assets
├── styles.css          # Design tokens, keyframe animations, and styling guidelines
├── app.js              # Interactive simulation loop, telemetry models, and terminal CLI
├── streamlit_app.py    # Streamlit wrapper to serve/deploy the application
├── requirements.txt    # Streamlit python dependencies
└── README.md           # Repository documentation
```

---

## ⚡ How to Run

### Option A: Pure Static Web (Zero Dependencies)
Ideal for 100% air-gapped engineering workstations with zero python setup:
1. Double-click [index.html](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/isro-bah-2026-copilot/index.html) or drag it into any modern browser (Chrome, Edge, Firefox, Safari).

### Option B: Streamlit Framework
For hosting locally or deploying live to the **Streamlit Community Cloud**:
1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Run locally:
   ```bash
   streamlit run streamlit_app.py
   ```
3. Deploy to the cloud: push this repository to GitHub, go to [Streamlit Share](https://share.streamlit.io/), and link the repository. It will automatically detect `streamlit_app.py` and run it live!
