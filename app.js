(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const PLANETS = {
    terre: ['Terre', 'terre.webp'], moon: ['Lune', 'moon.webp'], sun: ['Soleil', 'sun.webp'],
    venus: ['Vénus', 'venus.webp'], mars: ['Mars', 'mars.webp'], jupiter: ['Jupiter', 'jupiter.webp']
  };
  const SOUNDS = {
    'ambient-dream': 'ambient-dream.mp3', 'lunar-wind': 'lunar-wind.mp3',
    'future-city': 'future-city.mp3', spacecraft: 'spacecraft.mp3', neptune: 'neptune.mp3'
  };
  const defaults = { planet: 'terre', inhale: 4, exhale: 6, minutes: 3, sound: 'none', light: false };
  let preferences = readPreferences();
  let phase = 'idle';
  let startedAt = 0;
  let elapsedBeforePause = 0;
  let pausedAt = 0;
  let ticker = 0;
  let lastPhase = '';
  let soundEnabled = true;
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0.15;

  const stage = $('#breathStage');
  const timeRemaining = $('#timeRemaining');
  const phaseLabel = $('#phaseLabel');
  const phaseCount = $('#phaseCount');
  const progressFill = $('#progressFill');
  const progressBar = $('.session-progress');
  const pauseButton = $('#pauseSession');
  const endButton = $('#endSession');
  const status = $('#sessionStatus');
  const durationSeconds = () => preferences.minutes * 60;
  const totalSeconds = () => preferences.inhale + preferences.exhale;

  function readPreferences() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('heartsync-preferences') || '{}') }; }
    catch { return { ...defaults }; }
  }
  function savePreferences() {
    try { localStorage.setItem('heartsync-preferences', JSON.stringify(preferences)); } catch { /* Storage is optional. */ }
  }
  function formatTime(seconds) {
    const n = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }
  function selectButton(button, selector, dataKey) {
    $$(selector).forEach(item => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    return button.dataset[dataKey];
  }
  function setPlanet(name) {
    if (!PLANETS[name]) return;
    preferences.planet = name;
    const [label, file] = PLANETS[name];
    $('#activePlanet').src = `assets/planets/${file}`;
    $('#activePlanet').alt = `Planète ${label}`;
    $$('.planet-choice').forEach(button => {
      const active = button.dataset.planet === name;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    savePreferences();
  }
  function setRhythm(inhale, exhale) {
    preferences.inhale = Number(inhale);
    preferences.exhale = Number(exhale);
    $('#activeRhythm').innerHTML = `${preferences.inhale} / ${preferences.exhale} <small>sec</small>`;
    $('#rhythmHint').textContent = `${preferences.inhale} secondes d’inspiration · ${preferences.exhale} secondes d’expiration`;
    $$('.rhythm-choice').forEach(button => {
      const active = Number(button.dataset.in) === preferences.inhale && Number(button.dataset.out) === preferences.exhale;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    savePreferences();
  }
  function setDuration(minutes) {
    preferences.minutes = Number(minutes);
    $('#timeRemaining').textContent = formatTime(durationSeconds());
    $$('.duration-choice').forEach(button => {
      const active = Number(button.dataset.minutes) === preferences.minutes;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    savePreferences();
  }
  function loadSettings() {
    setPlanet(preferences.planet);
    setRhythm(preferences.inhale, preferences.exhale);
    setDuration(preferences.minutes);
    $('#soundSelect').value = Object.hasOwn(SOUNDS, preferences.sound) ? preferences.sound : 'none';
    soundEnabled = preferences.sound !== 'none';
    $('#soundToggle').setAttribute('aria-pressed', String(soundEnabled));
    $('#soundToggle').setAttribute('aria-label', soundEnabled ? 'Couper le son' : 'Activer le son');
    document.body.classList.toggle('light-mode', Boolean(preferences.light));
  }

  function elapsedNow() {
    return elapsedBeforePause + (phase === 'running' ? performance.now() - startedAt : 0);
  }
  function updatePhase(elapsed) {
    const cycleSeconds = totalSeconds();
    const cycleElapsed = (elapsed / 1000) % cycleSeconds;
    const isInhale = cycleElapsed < preferences.inhale;
    const nextPhase = isInhale ? 'inhale' : 'exhale';
    const left = isInhale ? preferences.inhale - cycleElapsed : cycleSeconds - cycleElapsed;
    if (nextPhase !== lastPhase) {
      lastPhase = nextPhase;
      stage.style.setProperty('--phase-duration', `${isInhale ? preferences.inhale : preferences.exhale}s`);
      stage.dataset.phase = nextPhase;
      phaseLabel.textContent = isInhale ? 'Inspire doucement' : 'Expire lentement';
    }
    phaseCount.textContent = `${Math.max(1, Math.ceil(left))} s`;
  }
  function render() {
    if (phase !== 'running') return;
    const elapsed = elapsedNow();
    const total = durationSeconds() * 1000;
    const bounded = Math.min(elapsed, total);
    const remaining = Math.max(0, (total - elapsed) / 1000);
    timeRemaining.textContent = formatTime(remaining);
    const percent = Math.min(100, Math.round((bounded / total) * 100));
    progressFill.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', String(percent));
    $('#cycleCount').textContent = String(Math.floor(elapsed / (totalSeconds() * 1000)));
    updatePhase(elapsed);
    if (elapsed >= total) finishSession(true);
  }
  function playSelectedSound() {
    if (!soundEnabled || preferences.sound === 'none' || !SOUNDS[preferences.sound]) return;
    const src = `assets/audio/${SOUNDS[preferences.sound]}`;
    if (!audio.src.endsWith(src)) audio.src = src;
    audio.volume = 0.15;
    audio.play().catch(() => showToast('Le son n’a pas pu démarrer. Tu peux réessayer avec ♫.'));
  }
  function lockSessionSetup(locked) {
    $$('.planet-choice, .rhythm-choice, .duration-choice').forEach(button => { button.disabled = locked; });
    $('#startSession').disabled = locked;
  }
  function startSession() {
    if (phase === 'running') return;
    if (phase === 'paused') {
      startedAt = performance.now();
      phase = 'running';
      lockSessionSetup(true);
      status.textContent = 'SÉANCE EN COURS';
      $('#sessionCaption').textContent = 'Reprends tranquillement, à ton rythme.';
      pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
      pauseButton.setAttribute('aria-label', 'Mettre la séance en pause');
      pauseButton.disabled = false;
      endButton.disabled = false;
      playSelectedSound();
      ticker = window.setInterval(render, 100);
      render();
      stage.focus({ preventScroll: true });
      return;
    }
    elapsedBeforePause = 0;
    startedAt = performance.now();
    phase = 'running';
    lockSessionSetup(true);
    lastPhase = '';
    status.textContent = 'SÉANCE EN COURS';
    $('#sessionCaption').textContent = 'Laisse le mouvement te guider. Pas besoin de forcer.';
    pauseButton.disabled = false;
    endButton.disabled = false;
    pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
    playSelectedSound();
    ticker = window.setInterval(render, 100);
    render();
    stage.focus({ preventScroll: true });
    $('#sessionCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function pauseSession() {
    if (phase === 'running') {
      elapsedBeforePause += performance.now() - startedAt;
      phase = 'paused';
      clearInterval(ticker);
      audio.pause();
      stage.dataset.phase = 'paused';
      phaseLabel.textContent = 'En pause';
      phaseCount.textContent = '—';
      status.textContent = 'SÉANCE EN PAUSE';
      pauseButton.innerHTML = '<span aria-hidden="true">▶</span> Reprendre';
      pauseButton.setAttribute('aria-label', 'Reprendre la séance');
      $('#sessionCaption').textContent = 'Prends le temps qu’il te faut.';
    } else if (phase === 'paused') startSession();
  }
  function finishSession(completed = false) {
    if (phase === 'idle') return;
    clearInterval(ticker);
    audio.pause();
    if (completed) {
      $('#timeRemaining').textContent = '00:00';
      progressFill.style.width = '100%';
      progressBar.setAttribute('aria-valuenow', '100');
      $('#cycleCount').textContent = String(Math.floor(durationSeconds() / totalSeconds()));
      status.textContent = 'PAUSE TERMINÉE';
      stage.dataset.phase = 'ready';
      phaseLabel.textContent = 'Bien joué';
      phaseCount.textContent = 'Merci';
      $('#sessionCaption').textContent = 'Prends un instant avant de reprendre ta journée.';
      showToast('Ta séance est terminée. Prends un instant pour toi.');
    } else {
      resetSession();
      showToast('Séance terminée. Tu peux reprendre quand tu veux.');
    }
    phase = 'idle';
    lockSessionSetup(false);
    pauseButton.disabled = true;
    endButton.disabled = true;
    pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
    pauseButton.setAttribute('aria-label', 'Mettre la séance en pause');
  }
  function resetSession() {
    phase = 'idle';
    lockSessionSetup(false);
    elapsedBeforePause = 0;
    lastPhase = '';
    stage.dataset.phase = 'ready';
    phaseLabel.textContent = 'À ton rythme';
    phaseCount.textContent = '—';
    timeRemaining.textContent = formatTime(durationSeconds());
    $('#cycleCount').textContent = '0';
    progressFill.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
    status.textContent = 'PRÊT QUAND TU L’ES';
    $('#sessionCaption').textContent = 'Laisse le mouvement te guider. Pas besoin de forcer.';
  }
  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function showDialog(dialog) { if (!dialog.open) dialog.showModal(); }

  $$('.planet-choice').forEach(button => button.addEventListener('click', () => setPlanet(button.dataset.planet)));
  $$('.rhythm-choice').forEach(button => button.addEventListener('click', () => setRhythm(button.dataset.in, button.dataset.out)));
  $$('.duration-choice').forEach(button => button.addEventListener('click', () => setDuration(button.dataset.minutes)));
  $('#soundSelect').addEventListener('change', event => {
    preferences.sound = event.target.value;
    savePreferences();
    audio.pause();
    if (preferences.sound === 'none') soundEnabled = false;
    else soundEnabled = true;
    $('#soundToggle').setAttribute('aria-pressed', String(soundEnabled));
    if (phase === 'running') playSelectedSound();
  });
  $('#soundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('#soundToggle').setAttribute('aria-pressed', String(soundEnabled));
    $('#soundToggle').setAttribute('aria-label', soundEnabled ? 'Couper le son' : 'Activer le son');
    if (soundEnabled && phase === 'running') playSelectedSound(); else audio.pause();
  });
  $('#startSession').addEventListener('click', startSession);
  pauseButton.addEventListener('click', pauseSession);
  endButton.addEventListener('click', () => finishSession(false));
  $('#themeToggle').addEventListener('click', () => {
    preferences.light = !preferences.light;
    document.body.classList.toggle('light-mode', preferences.light);
    $('meta[name="theme-color"]').content = preferences.light ? '#f4f2f7' : '#111522';
    savePreferences();
    $('#themeToggle').setAttribute('aria-label', preferences.light ? 'Activer le thème sombre' : 'Activer le thème clair');
  });
  $('#openHelp').addEventListener('click', () => showDialog($('#helpDialog')));
  $('#openHelpFooter').addEventListener('click', () => showDialog($('#helpDialog')));
  $('#openSafety').addEventListener('click', () => showDialog($('#safetyDialog')));
  $$('.modal').forEach(dialog => {
    $('.modal-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  });
  $('#year').textContent = new Date().getFullYear();
  loadSettings();
  $('meta[name="theme-color"]').content = preferences.light ? '#f4f2f7' : '#111522';

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
})();
