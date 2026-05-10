/* Officina dei Venti — motore audio.

   Ogni vento è una catena di nodi Web Audio costruita dal vivo:

       BufferSource (rumore generato)
          → [highpass]?
          → [lowpass]?
          → [bandpass + LFO sulla frequenza]?
          → GainNode (modulato da LFO di ampiezza)
          → StereoPanner (in base ai gradi cardinali)
          → GainNode (envelope di ingresso/uscita)
          → master → destination

   Niente registrazioni, niente sample, niente librerie.
   Tutto viene dal rumore filtrato. */

class WindEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.winds = new Map();      // id → record di nodi
    this._buffers = {};          // cache: { white, pink, brown }
    this.masterVolume = 0.55;
  }

  /* ----- contesto e cleanup ----- */

  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.gain.linearRampToValueAtTime(
        this.masterVolume,
        this.ctx.currentTime + 0.4
      );
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  setMasterVolume(v) {
    this.masterVolume = v;
    if (!this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(v, t + 0.3);
  }

  /* ----- rumore ----- */

  // Generatori di rumore tabulati. Bianco è uniforme, rosa è -3dB/ottava
  // (algoritmo di Paul Kellet), bruno è -6dB/ottava (random walk).
  _makeNoiseBuffer(type, seconds) {
    const sr = this.ctx.sampleRate;
    const length = Math.floor(sr * seconds);
    const buf = this.ctx.createBuffer(1, length, sr);
    const data = buf.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else if (type === "brown") {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buf;
  }

  _getBuffer(type) {
    if (!this._buffers[type]) {
      // 8 secondi loopati: lungo abbastanza da non sentire la ripetizione.
      this._buffers[type] = this._makeNoiseBuffer(type, 8);
    }
    return this._buffers[type];
  }

  /* ----- accendi un vento ----- */

  igniteWind(spec) {
    if (this.winds.has(spec.id)) return;
    this.ensureContext();
    const ctx = this.ctx;
    const r = spec.ricetta;
    const now = ctx.currentTime;

    // sorgente: rumore in loop
    const src = ctx.createBufferSource();
    src.buffer = this._getBuffer(r.noise || "pink");
    src.loop = true;

    let node = src;
    const lfos = [];
    const filters = [];

    // catena di filtri
    if (r.highpass) {
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = r.highpass.freq;
      f.Q.value = r.highpass.q || 0.7;
      node.connect(f);
      node = f;
      filters.push(f);
    }
    if (r.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = r.lowpass.freq;
      f.Q.value = r.lowpass.q || 0.7;
      node.connect(f);
      node = f;
      filters.push(f);
    }
    if (r.bandpass) {
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = r.bandpass.freq;
      f.Q.value = r.bandpass.q || 1;
      node.connect(f);
      node = f;
      filters.push(f);

      // LFO sulla frequenza del bandpass (effetto fischio modulato)
      if (r.bandpass.lfo) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = r.bandpass.lfo.shape || "sine";
        lfo.frequency.value = r.bandpass.lfo.rate;
        lfoGain.gain.value = r.bandpass.lfo.depth;
        lfo.connect(lfoGain).connect(f.frequency);
        lfo.start();
        lfos.push(lfo);
      }
    }

    // gain modulato da LFO di ampiezza (le raffiche)
    const ampNode = ctx.createGain();
    ampNode.gain.value = r.lfoBase != null ? r.lfoBase : 0.55;
    node.connect(ampNode);
    node = ampNode;

    if (r.ampLfo) {
      const lfo = ctx.createOscillator();
      const lfoDepth = ctx.createGain();
      lfo.type = r.ampLfo.shape || "sine";
      lfo.frequency.value = r.ampLfo.rate;
      lfoDepth.gain.value = r.ampLfo.depth;
      lfo.connect(lfoDepth).connect(ampNode.gain);
      lfo.start();
      lfos.push(lfo);
    }

    // drone opzionale (oscillatore aggiunto in parallelo per i venti pesanti)
    let drone = null, droneGain = null;
    if (r.drone) {
      drone = ctx.createOscillator();
      drone.type = r.drone.shape || "sine";
      drone.frequency.value = r.drone.freq;
      droneGain = ctx.createGain();
      droneGain.gain.value = 0;
      droneGain.gain.linearRampToValueAtTime(
        r.drone.gain || 0.04,
        now + (r.drone.attack || 4)
      );
      drone.connect(droneGain);
    }

    // panning stereo per direzione cardinale.
    // 0° N → pan 0  ·  90° E → pan +1  ·  180° S → pan 0  ·  270° W → pan -1
    const panValue = Math.max(-1, Math.min(1,
      Math.sin(spec.gradi * Math.PI / 180)
    ));
    const panner = ctx.createStereoPanner();
    panner.pan.value = panValue;

    // envelope di ingresso/uscita
    const envelope = ctx.createGain();
    envelope.gain.value = 0;
    const target = spec.intensita != null ? spec.intensita : 0.6;
    envelope.gain.linearRampToValueAtTime(target, now + (r.attack || 2.4));

    node.connect(panner);
    if (droneGain) droneGain.connect(panner);
    panner.connect(envelope);
    envelope.connect(this.master);

    src.start();
    if (drone) drone.start();

    this.winds.set(spec.id, {
      src,
      drone,
      droneGain,
      ampNode,
      filters,
      panner,
      envelope,
      lfos,
      release: r.release || 1.8,
    });
  }

  /* ----- spegni un vento ----- */

  extinguishWind(id) {
    const w = this.winds.get(id);
    if (!w || !this.ctx) return;
    const now = this.ctx.currentTime;
    const rel = w.release;

    w.envelope.gain.cancelScheduledValues(now);
    w.envelope.gain.setValueAtTime(w.envelope.gain.value, now);
    w.envelope.gain.linearRampToValueAtTime(0, now + rel);

    if (w.droneGain) {
      w.droneGain.gain.cancelScheduledValues(now);
      w.droneGain.gain.linearRampToValueAtTime(0, now + rel);
    }

    const stopAt = now + rel + 0.05;
    try { w.src.stop(stopAt); } catch (e) {}
    if (w.drone) { try { w.drone.stop(stopAt); } catch (e) {} }
    w.lfos.forEach(l => { try { l.stop(stopAt); } catch (e) {} });

    this.winds.delete(id);
  }

  /* ----- intensità a runtime ----- */

  setIntensity(id, value) {
    const w = this.winds.get(id);
    if (!w) return;
    const now = this.ctx.currentTime;
    w.envelope.gain.cancelScheduledValues(now);
    w.envelope.gain.linearRampToValueAtTime(value, now + 0.4);
  }

  /* ----- query ----- */

  isActive(id) { return this.winds.has(id); }
  activeIds() { return Array.from(this.winds.keys()); }
  activeCount() { return this.winds.size; }

  extinguishAll() {
    for (const id of Array.from(this.winds.keys())) {
      this.extinguishWind(id);
    }
  }
}
