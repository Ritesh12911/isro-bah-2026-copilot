// AetherNOC Simulation Engine
// Team Pathfinders - ISRO BAH 2026

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE VARIABLES ---
  const state = {
    tunnelDecay: 0,
    ospfFlapping: false,
    congestion: 12,
    anomalyScore: 0,
    activeAlerts: [],
    selectedAlertId: null,
    terminalHistory: [],
    clockTime: '',
    
    // Telemetry History (40 data points)
    history: {
      latency: Array(40).fill(24),
      loss: Array(40).fill(0),
      anomaly: Array(40).fill(0.02)
    },
    
    // Simulation metadata
    countdownTime: 0,
    mitigationInProgress: false
  };

  // --- HTML ELEMENTS ---
  const el = {
    clock: document.getElementById('live-clock'),
    valTunnelDecay: document.getElementById('val-tunnel-decay'),
    sliderTunnelDecay: document.getElementById('slider-tunnel-decay'),
    valOspfFlap: document.getElementById('val-ospf-flap'),
    switchOspfFlap: document.getElementById('switch-ospf-flap'),
    valCongestion: document.getElementById('val-congestion'),
    sliderCongestion: document.getElementById('slider-congestion'),
    btnInjectSolar: document.getElementById('btn-inject-solar'),
    btnResetNetwork: document.getElementById('btn-reset-network'),
    gaugeScore: document.getElementById('gaugeScore'),
    gaugeFill: document.getElementById('gauge-fill'),
    gaugeFillGlow: document.getElementById('gauge-fill-glow'),
    threatLevel: document.getElementById('threatLevel'),
    precursorMatch: document.getElementById('precursorMatch'),
    estFailureTime: document.getElementById('estFailureTime'),
    chartValLatency: document.getElementById('chart-val-latency'),
    chartValLoss: document.getElementById('chart-val-loss'),
    chartValAnomaly: document.getElementById('chart-val-anomaly'),
    alertsList: document.getElementById('alerts-list'),
    playbookView: document.getElementById('playbook-view'),
    terminalOutput: document.getElementById('terminal-output'),
    terminalInput: document.getElementById('terminal-input'),
    systemStatus: document.querySelector('.system-status')
  };

  // --- CANVAS INITIALIZATION ---
  const canvases = {
    latency: { ctx: document.getElementById('chartLatency').getContext('2d'), color: '#00f0ff' },
    loss: { ctx: document.getElementById('chartLoss').getContext('2d'), color: '#ff9d00' },
    anomaly: { ctx: document.getElementById('chartAnomaly').getContext('2d'), color: '#ff3355' }
  };

  // --- RUNBOOK DATABASE (LOCAL RAG) ---
  const runbooks = {
    'alert-tunnel-decay': {
      id: 'SOP-MPLS-042',
      name: 'IPSec Tunnel Decay Remediation Protocol',
      meta: 'Scope: Edge Tunnels | Target: BR-WEST | Confidence Match: 94%',
      desc: 'Remediation guidelines for crypto key exchange drift, frame check sequence (FCS) errors, and gradual Tunnel Decay warnings observed on IPSec peering sites.',
      steps: [
        {
          num: 'Step 1: Diagnostic',
          text: 'Verify crypto security associations (SAs) and identify packet drop count.',
          cmd: 'show crypto ipsec sa'
        },
        {
          num: 'Step 2: Clear Session',
          text: 'Reset security associations on the remote peer to force a fresh cryptographic key exchange.',
          cmd: 'clear crypto session peer 10.200.1.5'
        },
        {
          num: 'Step 3: Verification',
          text: 'Check log buffer to confirm successful phase-1 and phase-2 renegotiations.',
          cmd: 'show interfaces tunnel 2'
        }
      ]
    },
    'alert-ospf-flap': {
      id: 'SOP-MPLS-089',
      name: 'OSPF Route Adjacency Stabilization Protocol',
      meta: 'Scope: Routing Core | Target: MAIN-HUB | Confidence Match: 87%',
      desc: 'Standard SOP for flapping dynamic neighbor relationships on physical PE-CE interfaces caused by route database size mismatches or MTU conflicts.',
      steps: [
        {
          num: 'Step 1: Check Neighbors',
          text: 'Inspect dynamic neighbor state, transitions, and CPU utilization.',
          cmd: 'show ip ospf neighbor'
        },
        {
          num: 'Step 2: Apply Interface Dampening',
          text: 'Enter configuration mode, adjust link hello-interval to buffer transient disruptions and stabilize adjacencies.',
          cmd: 'configure terminal'
        },
        {
          num: 'Step 3: Clear Routing Table',
          text: 'Flush route cache to enforce standard path recalculations.',
          cmd: 'clear ip route *'
        }
      ]
    },
    'alert-congestion': {
      id: 'SOP-MPLS-115',
      name: 'QoS Bandwidth Optimization Protocol',
      meta: 'Scope: Queue Policing | Target: BR-EAST | Confidence Match: 78%',
      desc: 'Remediation of priority queuing congestion thresholds. Restores critical SCADA/Telemetry packets while shaping bulk transfer streams.',
      steps: [
        {
          num: 'Step 1: View Drops',
          text: 'Determine dropped packet percentages inside priority classes.',
          cmd: 'show policy-map interface'
        },
        {
          num: 'Step 2: Apply Priority Shaping',
          text: 'Enforce strict traffic-shaping parameters to low-priority network queues.',
          cmd: 'service-policy output Shape-LowPriority'
        }
      ]
    }
  };

  // --- SYSTEM CLOCK ---
  function updateClock() {
    const now = new Date();
    // Simulate timezone offset or just current local time formatted cleanly
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    state.clockTime = `${h}:${m}:${s} UTC`;
    el.clock.innerText = state.clockTime;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // --- CHART RENDERING ENGINE (CUSTOM CANVAS DRAWING) ---
  function drawChart(canvasObj, data, maxVal) {
    const ctx = canvasObj.ctx;
    const canvas = ctx.canvas;
    const color = canvasObj.color;
    
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      let y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Draw area chart under path
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    const step = w / (data.length - 1);
    for (let i = 0; i < data.length; i++) {
      let val = data[i];
      let x = i * step;
      let y = h - ((val / maxVal) * (h - 10)) - 5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    
    // Gradient fill
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, color + '20'); // 12% opacity
    fillGrad.addColorStop(1, color + '00'); // 0% opacity
    ctx.fillStyle = fillGrad;
    ctx.fill();
    
    // Draw stroke line with glow
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      let val = data[i];
      let x = i * step;
      let y = h - ((val / maxVal) * (h - 10)) - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    
    // Reset shadow for subsequent draws
    ctx.shadowBlur = 0;
  }

  // --- SIMULATION DATA UPDATE LOOP (Every 1 second) ---
  function runSimulation() {
    // Read input values
    const decay = parseInt(el.sliderTunnelDecay.value);
    const flap = el.switchOspfFlap.checked;
    const congestion = parseInt(el.sliderCongestion.value);
    
    // 1. Calculate values with slight random noise
    const noise = () => (Math.random() - 0.5) * 1.5;
    
    // Latency logic
    let latency = 24 + noise();
    if (decay > 0) {
      latency += (decay / 100) * 160; // Up to 184ms
    }
    if (flap) {
      latency += 35 + Math.random() * 80; // Intermittent flapping spikes
    }
    if (congestion > 15) {
      latency += ((congestion - 15) / 85) * 45; // Up to 69ms
    }
    latency = Math.max(12, Math.round(latency));
    
    // Packet Loss logic
    let loss = 0;
    if (decay > 15) {
      loss += Math.pow((decay - 15) / 85, 2) * 22; // Non-linear loss up to 22%
    }
    if (flap) {
      loss += 1.5 + Math.random() * 4; // Flapping dropouts
    }
    if (congestion > 60) {
      loss += ((congestion - 60) / 40) * 8; // Congestion queue drops up to 8%
    }
    loss = parseFloat(Math.max(0, loss + (Math.random() * 0.05)).toFixed(2));
    
    // Anomaly Score Logic (Mimicking ML output)
    let rawAnomaly = 0.02;
    if (decay > 0) {
      rawAnomaly += (decay / 100) * 0.45;
    }
    if (flap) {
      rawAnomaly += 0.38;
    }
    if (congestion > 30) {
      rawAnomaly += ((congestion - 30) / 70) * 0.22;
    }
    rawAnomaly = Math.min(1.0, rawAnomaly + (Math.random() * 0.02 - 0.01));
    rawAnomaly = parseFloat(Math.max(0.01, rawAnomaly).toFixed(2));
    const anomalyPercentage = Math.round(rawAnomaly * 100);
    
    // 2. Append to state history arrays
    state.history.latency.push(latency);
    state.history.latency.shift();
    
    state.history.loss.push(loss);
    state.history.loss.shift();
    
    state.history.anomaly.push(rawAnomaly);
    state.history.anomaly.shift();
    
    // 3. Update Text Values
    el.chartValLatency.innerText = `${latency} ms`;
    el.chartValLoss.innerText = `${loss.toFixed(2)}%`;
    el.chartValAnomaly.innerText = rawAnomaly.toFixed(2);
    
    el.valTunnelDecay.innerText = `${decay}%`;
    el.valTunnelDecay.className = `val-display ${decay > 75 ? 'text-red' : decay > 30 ? 'text-orange' : 'text-green'}`;
    
    el.valCongestion.innerText = `${congestion}%`;
    el.valCongestion.className = `val-display ${congestion > 80 ? 'text-red' : congestion > 50 ? 'text-orange' : 'text-green'}`;
    
    el.valOspfFlap.innerText = flap ? 'FLAPPING' : 'Stable';
    el.valOspfFlap.className = `val-display ${flap ? 'text-orange' : 'text-green'}`;
    
    // 4. Draw Charts
    drawChart(canvases.latency, state.history.latency, 250);
    drawChart(canvases.loss, state.history.loss, 25);
    drawChart(canvases.anomaly, state.history.anomaly, 1.0);
    
    // 5. Update Gauge & Predictor UI
    updatePredictorUI(anomalyPercentage);
    
    // 6. Handle Alerts Ingestion / Clearing based on precursors
    checkPrecursorAlerts(decay, flap, congestion);
    
    // 7. Update Map SVG styling
    updateMapSVG(decay, flap, congestion);
  }

  // --- UPDATE PREDICTOR UI PANEL ---
  function updatePredictorUI(score) {
    el.gaugeScore.textContent = `${score}%`;
    
    // Dash Offset calculation for SVG arc
    // Radius of arc is 80, length is PI * R = 251.3
    // Offset is 251.3 - (251.3 * (score / 100))
    const circumference = 251.3;
    const offset = circumference - (circumference * (score / 100));
    el.gaugeFill.style.strokeDashoffset = offset;
    
    // Color settings based on score
    let strokeColor = 'var(--neon-green)';
    let threatText = 'NOMINAL';
    let threatClass = 'text-green';
    let statusClass = 'air-gapped';
    
    if (score > 70) {
      strokeColor = 'var(--neon-red)';
      threatText = 'CRITICAL THREAT';
      threatClass = 'text-red';
      statusClass = 'air-gapped error-mode';
    } else if (score > 25) {
      strokeColor = 'var(--neon-orange)';
      threatText = 'ELEVATED PRECURSOR';
      threatClass = 'text-orange';
      statusClass = 'air-gapped warning-mode';
    }
    
    el.gaugeFill.style.stroke = strokeColor;
    el.threatLevel.textContent = threatText;
    el.threatLevel.className = `val ${threatClass}`;
    
    // Update general status container glow
    el.systemStatus.className = `system-status ${statusClass}`;
    
    // Setup Precursor Details & Estimations
    if (score > 70) {
      el.precursorMatch.textContent = 'Multi-Vector Outage Risk';
      el.precursorMatch.className = 'val text-red';
      el.estFailureTime.textContent = 'IMMINENT (< 3m)';
      el.estFailureTime.className = 'val text-red font-mono';
    } else if (score > 25) {
      // Find highest trigger
      const decay = parseInt(el.sliderTunnelDecay.value);
      const flap = el.switchOspfFlap.checked;
      const congestion = parseInt(el.sliderCongestion.value);
      
      if (flap) {
        el.precursorMatch.textContent = 'BGP/OSPF Adjacency Flapping (87%)';
        el.precursorMatch.className = 'val text-orange';
      } else if (decay > congestion) {
        el.precursorMatch.textContent = 'IPSec Key-Exchange Drift (94%)';
        el.precursorMatch.className = 'val text-orange';
      } else {
        el.precursorMatch.textContent = 'Priority Queue Ingress Limit (78%)';
        el.precursorMatch.className = 'val text-orange';
      }
      
      // Countdown simulation
      if (state.countdownTime <= 0) {
        state.countdownTime = 600 + Math.floor(Math.random() * 400); // ~10 to 16 mins
      } else {
        state.countdownTime = Math.max(12, state.countdownTime - 1);
      }
      const mins = Math.floor(state.countdownTime / 60);
      const secs = state.countdownTime % 60;
      el.estFailureTime.textContent = `${mins}m ${String(secs).padStart(2, '0')}s`;
      el.estFailureTime.className = 'val text-orange font-mono';
    } else {
      el.precursorMatch.textContent = 'None Detected';
      el.precursorMatch.className = 'val text-gray';
      el.estFailureTime.textContent = 'STABLE (N/A)';
      el.estFailureTime.className = 'val text-green font-mono';
      state.countdownTime = 0;
    }
  }

  // --- PRECURSOR ALERTS LOGIC (ML INGESTION WORKFLOW) ---
  function checkPrecursorAlerts(decay, flap, congestion) {
    const currentAlerts = [...state.activeAlerts];
    let changed = false;

    // Alert: Tunnel Decay
    const tunnelIdx = currentAlerts.findIndex(a => a.id === 'alert-tunnel-decay');
    if (decay >= 25 && tunnelIdx === -1) {
      currentAlerts.push({
        id: 'alert-tunnel-decay',
        title: 'IPSec Tunnel Decay Warning',
        desc: 'BR-WEST peer packet loss warning & crypto key-drift.',
        confidence: 85 + Math.floor(decay * 0.15),
        critical: decay > 80
      });
      changed = true;
    } else if (decay < 25 && tunnelIdx !== -1) {
      currentAlerts.splice(tunnelIdx, 1);
      if (state.selectedAlertId === 'alert-tunnel-decay') state.selectedAlertId = null;
      changed = true;
    } else if (decay >= 25 && tunnelIdx !== -1) {
      // Update critical status dynamically
      const isCrit = decay > 80;
      if (currentAlerts[tunnelIdx].critical !== isCrit) {
        currentAlerts[tunnelIdx].critical = isCrit;
        currentAlerts[tunnelIdx].confidence = 85 + Math.floor(decay * 0.15);
        changed = true;
      }
    }

    // Alert: OSPF Adjacency Flap
    const flapIdx = currentAlerts.findIndex(a => a.id === 'alert-ospf-flap');
    if (flap && flapIdx === -1) {
      currentAlerts.push({
        id: 'alert-ospf-flap',
        title: 'OSPF Adjacency Flapping',
        desc: 'Continuous PE-CE route flaps observed on MAIN-HUB.',
        confidence: 87,
        critical: true
      });
      changed = true;
    } else if (!flap && flapIdx !== -1) {
      currentAlerts.splice(flapIdx, 1);
      if (state.selectedAlertId === 'alert-ospf-flap') state.selectedAlertId = null;
      changed = true;
    }

    // Alert: Bandwidth Congestion
    const congIdx = currentAlerts.findIndex(a => a.id === 'alert-congestion');
    if (congestion >= 60 && congIdx === -1) {
      currentAlerts.push({
        id: 'alert-congestion',
        title: 'BR-EAST Queue Congestion',
        desc: 'Priority queue limit exceeded. Packet loss risks.',
        confidence: 65 + Math.floor(congestion * 0.3),
        critical: congestion > 85
      });
      changed = true;
    } else if (congestion < 60 && congIdx !== -1) {
      currentAlerts.splice(congIdx, 1);
      if (state.selectedAlertId === 'alert-congestion') state.selectedAlertId = null;
      changed = true;
    } else if (congestion >= 60 && congIdx !== -1) {
      const isCrit = congestion > 85;
      if (currentAlerts[congIdx].critical !== isCrit) {
        currentAlerts[congIdx].critical = isCrit;
        currentAlerts[congIdx].confidence = 65 + Math.floor(congestion * 0.3);
        changed = true;
      }
    }

    if (changed) {
      state.activeAlerts = currentAlerts;
      
      // Auto select first alert if nothing is selected and alerts exist
      if (!state.selectedAlertId && state.activeAlerts.length > 0) {
        state.selectedAlertId = state.activeAlerts[0].id;
      }
      
      renderAlertsList();
      renderPlaybook();
    }
  }

  // --- RENDER ALERTS LIST ---
  function renderAlertsList() {
    el.alertsList.innerHTML = '';
    
    if (state.activeAlerts.length === 0) {
      el.alertsList.innerHTML = '<div class="empty-alerts">System clean. Monitoring logs...</div>';
      return;
    }
    
    // Sort critical alerts first, then by confidence
    const sorted = [...state.activeAlerts].sort((a, b) => {
      if (a.critical && !b.critical) return -1;
      if (!a.critical && b.critical) return 1;
      return b.confidence - a.confidence;
    });
    
    sorted.forEach(alert => {
      const card = document.createElement('div');
      card.className = `alert-card ${alert.critical ? 'critical' : ''} ${state.selectedAlertId === alert.id ? 'selected' : ''}`;
      card.onclick = () => selectAlert(alert.id);
      
      card.innerHTML = `
        <div class="alert-icon-wrapper">${alert.critical ? '🚨' : '⚠️'}</div>
        <div class="alert-info">
          <div class="alert-title-row">
            <span class="alert-title">${alert.title}</span>
            <span class="alert-confidence ${alert.critical ? 'text-red' : 'text-orange'}">${alert.confidence}% Conf.</span>
          </div>
          <span class="alert-desc">${alert.desc}</span>
        </div>
      `;
      el.alertsList.appendChild(card);
    });
  }

  function selectAlert(id) {
    state.selectedAlertId = id;
    renderAlertsList();
    renderPlaybook();
  }

  // --- RENDER MATCHED PLAYBOOK ---
  function renderPlaybook() {
    el.playbookView.innerHTML = '';
    
    if (!state.selectedAlertId) {
      el.playbookView.innerHTML = '<div class="empty-playbook">No active issues. Runbook database idling.</div>';
      return;
    }
    
    const playbook = runbooks[state.selectedAlertId];
    if (!playbook) return;
    
    const container = document.createElement('div');
    container.className = 'playbook-container';
    
    container.innerHTML = `
      <div class="playbook-header">
        <span class="playbook-id">${playbook.id}</span>
        <h4 class="playbook-name">${playbook.name}</h4>
        <div class="playbook-meta">${playbook.meta}</div>
      </div>
      <p class="playbook-desc">${playbook.desc}</p>
      <div class="playbook-steps">
        ${playbook.steps.map((step, idx) => `
          <div class="playbook-step ${state.selectedAlertId === 'alert-ospf-flap' && idx === 1 ? 'warning-step' : ''}">
            <div class="step-num">${step.num}</div>
            <div class="step-text">${step.text}</div>
            <div class="step-cmd">
              <span>router# ${step.cmd}</span>
              <button class="run-cmd-btn" onclick="executeCommandFromStep('${step.cmd}')">Run Code</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    el.playbookView.appendChild(container);
  }

  // --- EXPORT FUNCTION TO GLOBAL SCOPE FOR BUTTON CLICKS ---
  window.executeCommandFromStep = function(cmd) {
    el.terminalInput.value = cmd;
    handleTerminalCommand(cmd);
    el.terminalInput.value = '';
  };

  // --- MAP SVG STYLING LOGIC ---
  function updateMapSVG(decay, flap, congestion) {
    // 1. Reset all elements to baseline
    const nodes = {
      hub: document.getElementById('status-hub'),
      east: document.getElementById('status-east'),
      west: document.getElementById('status-west'),
      dc: document.getElementById('status-dc')
    };
    
    const links = {
      hubDc: document.getElementById('link-hub-dc'),
      eastHub: document.getElementById('link-east-hub'),
      westHub: document.getElementById('link-west-hub'),
      eastDc: document.getElementById('link-east-dc'),
      westDc: document.getElementById('link-west-dc')
    };

    // Reset status classes
    Object.values(nodes).forEach(n => { n.className = 'node-status status-green'; });
    Object.values(links).forEach(l => { l.className = 'topo-link link-healthy'; });

    // Apply Tunnel Decay (West Branch)
    if (decay >= 85) {
      nodes.west.className = 'node-status status-red';
      links.westHub.className = 'topo-link link-error';
      links.westDc.className = 'topo-link link-error';
    } else if (decay >= 25) {
      nodes.west.className = 'node-status status-orange';
      links.westHub.className = 'topo-link link-warning';
      links.westDc.className = 'topo-link link-warning';
    }

    // Apply OSPF Flapping (Main Hub)
    if (flap) {
      nodes.hub.className = 'node-status status-orange';
      links.hubDc.className = 'topo-link link-warning';
      links.eastHub.className = 'topo-link link-warning';
      if (decay < 25) {
        links.westHub.className = 'topo-link link-warning';
      }
    }

    // Apply Congestion (East Branch)
    if (congestion >= 85) {
      nodes.east.className = 'node-status status-orange';
      links.eastDc.className = 'topo-link link-warning';
    } else if (congestion >= 60) {
      nodes.east.className = 'node-status status-orange';
      links.eastDc.className = 'topo-link link-warning';
    }
  }

  // --- TERMINAL EMULATOR LOGIC ---
  function printToTerminal(text) {
    el.terminalOutput.innerText += '\n' + text;
    el.terminalOutput.scrollTop = el.terminalOutput.scrollHeight;
  }

  function handleTerminalCommand(rawCmd) {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    
    printToTerminal(`router# ${cmd}`);
    
    // Command Router
    setTimeout(() => {
      const parts = cmd.toLowerCase().split(' ');
      const action = parts[0];
      
      switch (cmd.toLowerCase()) {
        case 'help':
          printToTerminal(
`Available commands:
  help                             Display this list of operational tools
  clear                            Clear the terminal log screen
  show status                      View current predictive anomaly analysis
  show crypto ipsec sa             Inspect secure tunnel cryptographic maps
  clear crypto session peer 10.200.1.5     Reset VPN security associations (Remedies Tunnel Decay)
  show ip ospf neighbor           Display routing adjacency log buffers
  configure terminal               Enter global system configurations
  show policy-map interface        Show dynamic queuing metric counters
  service-policy output shape-lowpriority Apply priority bandwidth shaping (Remedies Congestion)`
          );
          break;
          
        case 'clear':
          el.terminalOutput.innerText = 'Terminal cleared. Secure console active.\nrouter#';
          break;
          
        case 'show status':
          const decayVal = parseInt(el.sliderTunnelDecay.value);
          const flapVal = el.switchOspfFlap.checked;
          const congVal = parseInt(el.sliderCongestion.value);
          printToTerminal(
`--- SECURITY PERIMETER HARDWARE STATUS ---
[LOCAL] Anomaly Index Coefficient: ${state.history.anomaly[state.history.anomaly.length - 1]}
[SITE]  HQ-Datacenter Core: ONLINE (Load: 14%)
[EDGE]  BR-West IPSec Peer: ${decayVal > 80 ? 'CRITICAL OUTAGE' : decayVal > 25 ? 'DEGRADED' : 'NOMINAL'} (FCS Error: ${Math.round(decayVal * 1.2)}/s)
[EDGE]  BR-East MPLS Path: ${congVal > 80 ? 'CONGESTED' : 'NOMINAL'} (Inbound: ${congVal}%)
[CORE]  Main-Hub Dynamic Route: ${flapVal ? 'FLAPPING (OSPF neighbor adjacency unstable)' : 'STABLE'}
------------------------------------------`
          );
          break;
          
        case 'show crypto ipsec sa':
          const d = parseInt(el.sliderTunnelDecay.value);
          if (d > 0) {
            printToTerminal(
`interface: Tunnel2
    Crypto session state: UP-ACTIVE
    peer: 10.200.1.5 port 500
    IKEv2 SA: local 10.200.1.1/500 remote 10.200.1.5/500 Active
    IPSEC flow: local_endpoint 192.168.20.0/24 remote_endpoint 192.168.10.0/24
    [WARNING] Key exchange drift detected!
    Inbound packets dropped (FCS): ${Math.round(d * 14.5)}
    Outbound packets dropped (SeqMismatch): ${Math.round(d * 9.2)}
    Active security associations renegotiated: 0`
            );
          } else {
            printToTerminal(
`interface: Tunnel2
    Crypto session state: UP-ACTIVE
    peer: 10.200.1.5 port 500
    IKEv2 SA: local 10.200.1.1/500 remote 10.200.1.5/500 Active
    IPSEC flow: local_endpoint 192.168.20.0/24 remote_endpoint 192.168.10.0/24
    Key exchange lock status: SECURED (No drift)
    Inbound packets dropped (FCS): 0
    Outbound packets dropped: 0`
            );
          }
          break;
          
        case 'clear crypto session peer 10.200.1.5':
          if (parseInt(el.sliderTunnelDecay.value) > 0) {
            printToTerminal(`%CRYPTO-6-IKEMP_REKEY: Force-rekey command initiated for peer 10.200.1.5...`);
            setTimeout(() => {
              printToTerminal(`%CRYPTO-6-IKE_PHASE1_UP: IKEv2 Phase 1 SA established with peer 10.200.1.5.`);
              printToTerminal(`%CRYPTO-6-IPSEC_REKEY: Tunnel2 renegotiation complete. Cryptographic drift resolved.`);
              // Mitigate fault
              el.sliderTunnelDecay.value = 0;
              state.tunnelDecay = 0;
              printToTerminal(`\n[SUCCESS] BR-WEST Tunnel Decay mitigated successfully. Telemetry stabilizing.`);
            }, 1000);
          } else {
            printToTerminal(`%CRYPTO-6-IPSEC_REKEY: Peering session 10.200.1.5 already synchronized. Skipped.`);
          }
          break;
          
        case 'show ip ospf neighbor':
          const f = el.switchOspfFlap.checked;
          if (f) {
            printToTerminal(
`Neighbor ID     Pri   State           Dead Time   Address         Interface
10.100.1.2        1   INIT/EXSTART    00:00:36    10.100.1.2      GigabitEthernet0/1
%OSPF-5-ADJCHG: Process 1, Nbr 10.100.1.2 on GigabitEthernet0/1 from EXSTART to DOWN, Neighbor Down: Interface flapping
%OSPF-5-ADJCHG: Process 1, Nbr 10.100.1.2 on GigabitEthernet0/1 from DOWN to INIT, Neighbor Up
Neighbor transition counts (last 60s): 14 flaps`
            );
          } else {
            printToTerminal(
`Neighbor ID     Pri   State           Dead Time   Address         Interface
10.100.1.2        1   FULL/DR         00:00:39    10.100.1.2      GigabitEthernet0/1
Neighbor transition counts (last 60s): 0`
            );
          }
          break;
          
        case 'configure terminal':
          printToTerminal(
`Enter configuration commands, one per line. End with CNTL/Z.
router(config)#`
          );
          if (el.switchOspfFlap.checked) {
            printToTerminal(`router(config)# interface GigabitEthernet0/1`);
            printToTerminal(`router(config-if)# ip ospf hello-interval 10`);
            printToTerminal(`router(config-if)# exit`);
            printToTerminal(`router(config)# exit`);
            setTimeout(() => {
              el.switchOspfFlap.checked = false;
              state.ospfFlapping = false;
              printToTerminal(`\n[SUCCESS] Dynamic dampening timer applied. OSPF route flap mitigated.`);
            }, 1200);
          }
          break;
          
        case 'show policy-map interface':
          const c = parseInt(el.sliderCongestion.value);
          if (c > 50) {
            printToTerminal(
`GigabitEthernet0/2 - Ingress Queue Policy: Shape-Normal
  Class-map: SCADA-Telemetry (match-any)
    Queue Priority: High (Strict Priority Profile)
    Total packets forwarded: 120484  Drops (tail-drop): 0
  Class-map: Bulk-Data-Transfer (match-any)
    Queue Priority: Low (Ingress Limit Profile: 80% bandwidth)
    Total packets: 420958  Drops (tail-drop): ${Math.round((c - 50) * 144.2)}
    [WARNING] Congestion threshold triggered! Ingress queues saturated.`
            );
          } else {
            printToTerminal(
`GigabitEthernet0/2 - Ingress Queue Policy: Shape-Normal
  Class-map: SCADA-Telemetry (match-any)
    Total packets: 110592  Drops: 0
  Class-map: Bulk-Data-Transfer (match-any)
    Total packets: 295104  Drops: 0
    Queue status: NOMINAL (Utilization: ${c}%)`
            );
          }
          break;
          
        case 'service-policy output shape-lowpriority':
          if (parseInt(el.sliderCongestion.value) > 12) {
            printToTerminal(`Applying strict priority policing maps...`);
            setTimeout(() => {
              printToTerminal(`Policy-map Shape-LowPriority attached to interface GigabitEthernet0/2.`);
              printToTerminal(`Rate-limiting bulk transfers to 15Mbps maximum window. SCADA queue prioritized.`);
              // Mitigate fault
              el.sliderCongestion.value = 12;
              state.congestion = 12;
              printToTerminal(`\n[SUCCESS] Class-policing active. BR-EAST MPLS congestion resolved.`);
            }, 1000);
          } else {
            printToTerminal(`Policy-map Shape-LowPriority already active on interface. Skipped.`);
          }
          break;
          
        case 'clear ip route *':
          printToTerminal(`Routing tables flushed. Dynamic routing converges in 0.4s...`);
          break;
          
        default:
          if (parts[0] === 'ping') {
            printToTerminal(
`Sending 5, 100-byte ICMP Echos to ${parts[1] || '127.0.0.1'}, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 22/24/28 ms`
            );
          } else {
            printToTerminal(`% Invalid command prefix or parameter mismatch at '${cmd}'. Type 'help' for support.`);
          }
      }
      
      printToTerminal('router# █');
    }, 400);
  }

  // --- FAULT INPUT HANDLERS ---
  el.sliderTunnelDecay.addEventListener('input', () => {
    state.tunnelDecay = parseInt(el.sliderTunnelDecay.value);
  });
  
  el.switchOspfFlap.addEventListener('change', () => {
    state.ospfFlapping = el.switchOspfFlap.checked;
  });
  
  el.sliderCongestion.addEventListener('input', () => {
    state.congestion = parseInt(el.sliderCongestion.value);
  });

  // Solar Flare Event Injection (Interactive Fun Scenario)
  el.btnInjectSolar.addEventListener('click', () => {
    printToTerminal(`\n*** [ALERT] SIMULATING SPACE WEATHER / SOLAR STORM FLUX ***`);
    printToTerminal(`%EMI-WARNING: High geomagnetic flux detected on air-gap RF receivers.`);
    
    // Inject multiple faults at once
    el.sliderTunnelDecay.value = 65;
    state.tunnelDecay = 65;
    
    el.switchOspfFlap.checked = true;
    state.ospfFlapping = true;
    
    el.sliderCongestion.value = 85;
    state.congestion = 85;
    
    printToTerminal(`%PORT-5-UPDOWN: Line protocol on interfaces Tunnel2 and Gi0/1 transitioned to unstable.`);
    printToTerminal(`All ML models updating precursor weight vectors.`);
  });

  // Reset Network Baseline
  el.btnResetNetwork.addEventListener('click', () => {
    el.sliderTunnelDecay.value = 0;
    state.tunnelDecay = 0;
    
    el.switchOspfFlap.checked = false;
    state.ospfFlapping = false;
    
    el.sliderCongestion.value = 12;
    state.congestion = 12;
    
    printToTerminal(`\n*** [INFO] NETWORKING CONTEXT FORCE RESET TO BASELINE ***`);
    printToTerminal(`Clearing buffer caches... All site nodes restored to green status.`);
  });

  // Terminal input keypress listener
  el.terminalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const cmd = el.terminalInput.value;
      if (cmd) {
        handleTerminalCommand(cmd);
        el.terminalInput.value = '';
      }
    }
  });

  // --- INITIALIZATION ---
  setInterval(runSimulation, 1000);
  runSimulation();
});
