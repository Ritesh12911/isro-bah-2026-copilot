# AetherNOC // Secure Predictive MPLS Copilot

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
├── index.html     # Semantic dashboard structure & inline SVG topology assets
├── styles.css     # Design tokens, keyframe animations, and styling guidelines
├── app.js         # Interactive simulation loop, telemetry models, and terminal CLI
└── README.md      # Repository documentation
```

---

## ⚡ How to Run

AetherNOC is designed with a zero-dependency static file architecture, ensuring 100% compatibility in air-gapped workstations.

1. Clone this repository:
   ```bash
   git clone <your-repository-url>
   ```
2. Navigate to the project folder and double-click `index.html` (or open it using Google Chrome, Microsoft Edge, Firefox, or Safari).
3. Interact with the **Fault Injector** to see the system predict failures in real-time, generate automated RAG runbooks, and test diagnostic mitigation commands!
