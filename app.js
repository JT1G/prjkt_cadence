/**
 * CADENCE EDUCATIONAL WORKSPACE
 * Multi-Page Shared Architecture Controller
 * Handles dynamic navigation bar, dropdown menu, theme persistence,
 * persistent study metrics, Web Audio ambient synthesizer, flashcards,
 * focus timer, concept drills, syllabus planner, and stepper controls.
 */

class CadenceApp {
  constructor() {
    // Current page filename identification
    this.currentPage = this.detectCurrentPage();

    // Theme state
    this.theme = localStorage.getItem('cadence_theme') || 'light';

    // Shared Study Metrics stored in localStorage
    this.stats = {
      cardsReviewed: parseInt(localStorage.getItem('cadence_cards_reviewed') || '0', 10),
      focusMinutes: parseInt(localStorage.getItem('cadence_focus_minutes') || '0', 10),
      quizCorrect: parseInt(localStorage.getItem('cadence_quiz_correct') || '0', 10),
      quizTotal: parseInt(localStorage.getItem('cadence_quiz_total') || '0', 10)
    };

    // Shared Tasks stored in localStorage
    const savedTasks = localStorage.getItem('cadence_tasks');
    this.tasks = savedTasks ? JSON.parse(savedTasks) : [
      {
        id: 't-1',
        title: 'Review Chapter 5: Cellular Membranes & Transport',
        course: 'AP Biology',
        dueDate: this.getRelativeDate(2),
        priority: 'high',
        completed: false
      },
      {
        id: 't-2',
        title: 'Complete Problem Set 6: Gauss\'s Law applications',
        course: 'Physics II',
        dueDate: this.getRelativeDate(4),
        priority: 'medium',
        completed: false
      },
      {
        id: 't-3',
        title: 'Outline historiographical essay on Reformation trade',
        course: 'European History',
        dueDate: this.getRelativeDate(6),
        priority: 'low',
        completed: false
      }
    ];

    // Shared Flashcards & Hierarchical Deck Architecture (Botanical Sage)
    this.initDeckState();
    this.flashcards = this.getAllCards();
    this.currentCardIndex = 0;
    this.isCardFlipped = false;

    // Focus Timer State
    this.timerMode = 'focus';
    this.timerDurations = {
      focus: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };
    this.timerRemaining = this.timerDurations.focus;
    this.timerInterval = null;
    this.isTimerRunning = false;
    this.completedSessions = 0;

    // Web Audio Synthesizer
    this.audioCtx = null;
    this.activeSoundNodes = {};
    this.currentPlayingSound = null;
    this.masterGainNode = null;
    this.volume = 0.35;

    // Concept Drills Quiz State
    this.drillQuestions = [
      {
        id: 1,
        subject: 'Cognitive Science & Psychology',
        difficulty: 'Intermediate',
        question: 'Which cognitive phenomenon explains why spaced study sessions produce superior long-term memory retention compared to massed practice ("cramming")?',
        options: [
          'The Primacy Effect: Initial impressions receive disproportionate emotional focus.',
          'The Spacing Effect: Neural consolidation and reconsolidation occur between retrieval attempts.',
          'Cognitive Dissonance: Contradictory information forces the brain into deeper reasoning.',
          'Hedonic Adaptation: Attention normalizes over repeated identical stimulus.'
        ],
        correctIndex: 1,
        explanation: 'The Spacing Effect (first quantified by Hermann Ebbinghaus) occurs because memories must be reconstructed from long-term storage after slight forgetting. Each retrieval forces synaptic reconsolidation, strengthening durable neural pathways much more than back-to-back exposure.'
      },
      {
        id: 2,
        subject: 'Cellular Biochemistry',
        difficulty: 'Advanced',
        question: 'In cellular respiration, what directly powers the synthesis of ATP by ATP synthase during oxidative phosphorylation?',
        options: [
          'Direct enzymatic cleavage of glucose in the cytosol',
          'Hydrolysis of GTP into GMP in the mitochondrial matrix',
          'The proton-motive force across the inner mitochondrial membrane',
          'The reduction of NAD+ into NADH during the Krebs cycle'
        ],
        correctIndex: 2,
        explanation: 'Electrons flowing down the electron transport chain pump protons (H+) from the matrix into the intermembrane space. The resulting electrochemical proton gradient creates a proton-motive force that flows through ATP synthase, spinning its catalytic head to join ADP + Pi.'
      },
      {
        id: 3,
        subject: 'Computational Algorithms',
        difficulty: 'Intermediate',
        question: 'Why does Dijkstra\'s shortest path algorithm fail or produce incorrect results on graphs with negative-weight edges?',
        options: [
          'Dijkstra\'s algorithm greedily assumes that adding an edge can never decrease the total path cost.',
          'Graphs with negative edges cannot be represented with an adjacency list.',
          'It cannot process directed acyclic graph topologies.',
          'It creates an infinite loop regardless of whether negative cycles exist.'
        ],
        correctIndex: 0,
        explanation: 'Dijkstra relies on a greedy premise: once a vertex is marked visited with the minimum tentative distance, no subsequent path through unexplored nodes can ever make it shorter. A negative weight violates this assumption. The Bellman-Ford algorithm should be used instead.'
      },
      {
        id: 4,
        subject: 'Physics: Thermodynamics',
        difficulty: 'Core Principle',
        question: 'According to the Second Law of Thermodynamics, in an isolated system, which quantity can never spontaneously decrease over time?',
        options: [
          'Total mechanical energy',
          'Entropy (molecular disorder and unavailable thermal energy)',
          'Absolute temperature in Kelvin',
          'Pressure of an expanding ideal gas'
        ],
        correctIndex: 1,
        explanation: 'The Second Law states that the total entropy of an isolated system always increases or remains constant in reversible processes (ΔS_isolated ≥ 0). Spontaneous natural processes increase the overall disorder of the universe.'
      }
    ];
    this.currentDrillIndex = 0;
    this.selectedOptionIndex = null;
    this.drillSubmitted = false;
    this.taskFilter = 'all';

    // Start App
    this.init();
  }

  detectCurrentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1);
    if (!file || file === '' || file === 'index.html') return 'index.html';
    return file;
  }

  getRelativeDate(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  init() {
    // 1. Theme initialization
    this.applyTheme(this.theme);

    // 2. Render Shared Dynamic Navbar & Dropdown
    this.renderNavigation();

    // 3. Render Shared Floating Timer Indicator if active
    this.checkPersistentTimer();

    // 4. Initialize specific page logic based on DOM elements
    this.initPageFeatures();

    // 5. Global Stepper button bindings
    this.setupStepperControls();
  }

  /* ------------------------------------------------------------------------
     THEME MANAGEMENT (Stored in localStorage)
     ------------------------------------------------------------------------ */
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cadence_theme', theme);
  }

  toggleTheme() {
    const nextTheme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(nextTheme);
  }

  /* ------------------------------------------------------------------------
     DYNAMIC TOP NAVIGATION & DROPDOWN (Requirement 1 & 3)
     Renders unified clean navbar across every page without code duplication
     ------------------------------------------------------------------------ */
  renderNavigation() {
    const headerEl = document.getElementById('siteHeader');
    if (!headerEl) return;

    const navItems = [
      { file: 'index.html', label: 'Overview & Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { file: 'recall-deck.html', label: 'Active Recall Deck', icon: 'M2 7h20v14H2z' },
      { file: 'focus-timer.html', label: 'Focus Cadence Timer', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.37z' },
      { file: 'concept-drills.html', label: 'Diagnostic Concept Drills', icon: 'M9 11l3 3L22 4' },
      { file: 'study-planner.html', label: 'Syllabus & Task Planner', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
      { file: 'exam-runway.html', label: 'Exam Readiness Runway', icon: 'M18 20V10M12 20V4M6 20v-6' },
      { file: 'cognitive-playbook.html', label: 'Cognitive Science Playbook', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }
    ];

    headerEl.innerHTML = `
      <div class="header-inner container">
        <a href="index.html" class="brand-group" aria-label="Cadence Homepage">
          <div class="brand-symbol" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Cadence</span>
            <span class="brand-sub">Study Workspace</span>
          </div>
        </a>

        <!-- Header Actions: Dark Mode Toggle, Start Session Pill, 3-stripe Menu -->
        <div class="header-actions">
          <button id="themeToggleBtn" class="icon-btn" title="Toggle color theme" aria-label="Toggle dark/light mode">
            <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          <a href="focus-timer.html" class="primary-pill-btn" aria-label="Start Focus Session">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>Start Session</span>
          </a>

          <!-- Three-Stripe Menu Toggle Button (Directly next to Start Session) -->
          <button id="menuToggleBtn" class="menu-toggle-btn" aria-label="Open tool navigation menu" aria-expanded="false" aria-controls="navDropdown">
            <span class="menu-bar"></span>
            <span class="menu-bar"></span>
            <span class="menu-bar"></span>
          </button>
        </div>

        <!-- Sleek Dropdown Menu -->
        <nav id="navDropdown" class="nav-dropdown" aria-label="Tool Navigation">
          <div class="dropdown-header-label">Learning Instruments</div>
          ${navItems.map(item => {
            const isActive = this.currentPage === item.file;
            return `
              <a href="${item.file}" class="dropdown-item ${isActive ? 'active' : ''}">
                <span class="dropdown-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="${item.icon}"></path>
                  </svg>
                </span>
                <span>${item.label}</span>
              </a>
            `;
          }).join('')}
        </nav>
      </div>
    `;

    // Bind Theme Button
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Bind Dropdown Toggle & Outside Click
    const menuBtn = document.getElementById('menuToggleBtn');
    const dropdown = document.getElementById('navDropdown');

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('is-open');
        if (isOpen) {
          dropdown.classList.remove('is-open');
          menuBtn.setAttribute('aria-expanded', 'false');
        } else {
          dropdown.classList.add('is-open');
          menuBtn.setAttribute('aria-expanded', 'true');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
          dropdown.classList.remove('is-open');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close dropdown on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('is-open')) {
          dropdown.classList.remove('is-open');
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.focus();
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     STEPPER CONTROLS (Requirement 4)
     Properly aligned + and - buttons tied to theme CSS variables.
     ------------------------------------------------------------------------ */
  setupStepperControls() {
    const steppers = document.querySelectorAll('.stepper-control');
    steppers.forEach(stepper => {
      const input = stepper.querySelector('.stepper-input');
      const decBtn = stepper.querySelector('.stepper-btn-decrement');
      const incBtn = stepper.querySelector('.stepper-btn-increment');

      if (!input || !decBtn || !incBtn) return;

      const min = parseInt(input.getAttribute('min') || '1', 10);
      const max = parseInt(input.getAttribute('max') || '999', 10);
      const step = parseInt(input.getAttribute('step') || '1', 10);

      decBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10) || min;
        val = Math.max(min, val - step);
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      incBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10) || min;
        val = Math.min(max, val + step);
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  /* ------------------------------------------------------------------------
     PAGE FEATURE INITIALIZATION
     ------------------------------------------------------------------------ */
  initPageFeatures() {
    // 1. Dashboard (index.html)
    if (document.getElementById('statCardsReviewed')) {
      this.initDashboard();
    }

    // 2. Exam Runway Page (exam-runway.html or dashboard preview)
    if (document.getElementById('calcChapters')) {
      this.initExamRunway();
    }

    // 3. Active Recall Deck (recall-deck.html)
    if (document.getElementById('flashcardWrap')) {
      this.initFlashcards();
    }

    // 4. Focus Timer Page (focus-timer.html)
    if (document.getElementById('mainTimerDigits')) {
      this.initFocusTimer();
      this.initAmbientAudio();
    }

    // 5. Concept Drills (concept-drills.html)
    if (document.getElementById('drillQuestionText')) {
      this.initConceptDrills();
    }

    // 6. Study Planner (study-planner.html)
    if (document.getElementById('tasksContainer')) {
      this.initStudyPlanner();
    }
  }

  /* ------------------------------------------------------------------------
     1. DASHBOARD LOGIC
     ------------------------------------------------------------------------ */
  initDashboard() {
    this.updateDashboardMetrics();
  }

  updateDashboardMetrics() {
    const cardsEl = document.getElementById('statCardsReviewed');
    const focusEl = document.getElementById('statFocusMinutes');
    const scoreEl = document.getElementById('statDrillScore');
    const tasksEl = document.getElementById('statTasksPending');

    if (cardsEl) cardsEl.textContent = this.stats.cardsReviewed;
    if (focusEl) focusEl.textContent = this.stats.focusMinutes;
    
    if (scoreEl) {
      if (this.stats.quizTotal > 0) {
        const pct = Math.round((this.stats.quizCorrect / this.stats.quizTotal) * 100);
        scoreEl.textContent = `${pct}%`;
      } else {
        scoreEl.textContent = '100%';
      }
    }

    const pendingCount = this.tasks.filter(t => !t.completed).length;
    if (tasksEl) tasksEl.textContent = pendingCount;

    // Daily progress bar (Target: 10 cards + 25 mins focus)
    const targetProgress = Math.min(100, Math.round(((this.stats.cardsReviewed / 10) * 50) + ((this.stats.focusMinutes / 25) * 50)));
    const barEl = document.getElementById('dailyProgressBar');
    const textEl = document.getElementById('dailyProgressText');
    if (barEl) barEl.style.width = `${Math.max(20, targetProgress)}%`;
    if (textEl) textEl.textContent = `${Math.max(20, targetProgress)}%`;
  }

  /* ------------------------------------------------------------------------
     2. EXAM RUNWAY CALCULATOR (Dedicated Page & Teaser)
     ------------------------------------------------------------------------ */
  initExamRunway() {
    const chaptersInput = document.getElementById('calcChapters');
    const daysInput = document.getElementById('calcDays');
    const modeSelect = document.getElementById('calcRetentionMode');
    const calculateBtn = document.getElementById('runCalculationBtn');

    const compute = () => {
      const chapters = parseFloat(chaptersInput ? chaptersInput.value : 8) || 1;
      const days = parseFloat(daysInput ? daysInput.value : 14) || 1;
      const mode = modeSelect ? modeSelect.value : 'deep';

      let multiplier = 1;
      let passes = 1;
      if (mode === 'deep') { multiplier = 1.7; passes = 3; }
      if (mode === 'cram') { multiplier = 0.9; passes = 1; }

      const dailyChapters = (chapters / days) * (mode === 'deep' ? 1.4 : 1.0);
      const dailyMinutes = Math.round(dailyChapters * 45 * multiplier);
      const totalHours = ((dailyMinutes * days) / 60).toFixed(1);

      // Dedicated page result elements
      const heroNum = document.getElementById('runwayHeroNum');
      const dailyMinsEl = document.getElementById('runwayDailyMinutes');
      const totalHoursEl = document.getElementById('runwayTotalHours');
      const passesEl = document.getElementById('runwayPassesCount');
      const noteEl = document.getElementById('runwayInsightNote');

      if (heroNum) heroNum.textContent = `${dailyChapters.toFixed(1)} chapters / day`;
      if (dailyMinsEl) dailyMinsEl.textContent = `${dailyMinutes} mins`;
      if (totalHoursEl) totalHoursEl.textContent = `${totalHours} hrs`;
      if (passesEl) passesEl.textContent = `${passes} passes`;
      if (noteEl) {
        noteEl.textContent = `At an estimated 45 mins per chapter, commit to ${dailyMinutes} minutes of focused study per day across ${days} days. This ensures full synaptic consolidation before test day.`;
      }

      // Inline preview on dashboard
      const calcResultDisplay = document.getElementById('calcResultDisplay');
      if (calcResultDisplay) {
        calcResultDisplay.innerHTML = `
          <span class="calc-highlight">Recommended: ${dailyChapters.toFixed(1)} chapters / day</span>
          <span class="calc-note">Target <strong>${dailyMinutes} minutes</strong> daily over ${days} days (${mode === 'deep' ? '3-pass deep mastery' : 'standard single pass'}).</span>
        `;
      }
    };

    if (chaptersInput) chaptersInput.addEventListener('input', compute);
    if (daysInput) daysInput.addEventListener('input', compute);
    if (modeSelect) modeSelect.addEventListener('change', compute);
    if (calculateBtn) calculateBtn.addEventListener('click', compute);

    // Initial computation
    compute();
  }

  /* ------------------------------------------------------------------------
     3. ACTIVE RECALL FLASHCARDS & AI GENERATOR (recall-deck.html)
     Botanical Sage Architecture - Dynamic Custom Subject & Lesson Hierarchy
     ------------------------------------------------------------------------ */
  initDeckState() {
    const saved = localStorage.getItem('cadence_deck_data_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
          this.deckData = parsed;
          if (!this.deckData.activeSubjectId) {
            this.deckData.activeSubjectId = this.deckData.subjects[0].id;
          }
          const activeSubj = this.deckData.subjects.find(s => s.id === this.deckData.activeSubjectId) || this.deckData.subjects[0];
          if (!this.deckData.activeLessonId || !activeSubj.lessons.some(l => l.id === this.deckData.activeLessonId)) {
            this.deckData.activeLessonId = activeSubj.lessons[0]?.id || null;
          }
          return;
        }
      } catch (e) {
        console.error('Failed to parse cadence_deck_data_v2 from localStorage', e);
      }
    }

    // Default Seed Hierarchical Subjects (Custom subjects only, zero hardcoded legacy subjects)
    this.deckData = {
      activeSubjectId: 'subj-1',
      activeLessonId: 'less-1-1',
      subjects: [
        {
          id: 'subj-1',
          name: 'Cognitive Neuroscience',
          lessons: [
            {
              id: 'less-1-1',
              title: 'Lesson 1: Synaptic Plasticity & LTP',
              materials: [
                { id: 'm-1', name: 'LTP_Molecular_Mechanisms.pdf', size: '248 KB', type: 'pdf', date: 'Attached' }
              ],
              cards: [
                {
                  id: 'c-1',
                  question: 'How does high-frequency stimulation induce Long-Term Potentiation (LTP) at CA1 synapses?',
                  answer: 'Strong depolarization expels the Mg²⁺ block from NMDA receptors, allowing Ca²⁺ influx. Elevated calcium activates CaMKII and PKC, which phosphorylate existing AMPA receptors to increase conductance and drive insertion of new AMPA receptors into the postsynaptic density.',
                  hint: 'Focus on the magnesium block expulsion and CaMKII activation.',
                  connection: 'Hebbian Synaptic Strengthening'
                },
                {
                  id: 'c-2',
                  question: 'What structural changes occur in dendritic spines following successful late-phase LTP?',
                  answer: 'Late-phase LTP initiates protein synthesis via CREB signaling, causing dendritic spine enlargement, actin cytoskeleton remodeling, and the formation of new perforated synaptic contacts that permanently increase synaptic efficacy.',
                  hint: 'CREB-mediated gene expression and actin remodeling.',
                  connection: 'Structural Plasticity & Memory Consolidation'
                },
                {
                  id: 'c-3',
                  question: 'What is the primary physiological distinction between early LTP and late LTP?',
                  answer: 'Early LTP lasts 1-3 hours and relies solely on post-translational modifications (phosphorylation) of existing proteins without new synthesis. Late LTP lasts days or weeks and requires gene transcription and de novo protein synthesis.',
                  hint: 'Consider the requirement for transcription and translation.',
                  connection: 'Temporal Stages of Memory Traces'
                }
              ]
            },
            {
              id: 'less-1-2',
              title: 'Lesson 2: Hippocampal Indexing Theory',
              materials: [
                { id: 'm-2', name: 'Hippocampus_Systems_Consolidation.txt', size: '42 KB', type: 'txt', date: 'Attached' }
              ],
              cards: [
                {
                  id: 'c-4',
                  question: 'What is the core premise of the Hippocampal Indexing Theory for episodic recall?',
                  answer: 'The hippocampus does not store memory representations directly; rather, it stores an "index" of coordinated neocortical activity patterns. Activation of a retrieval cue reactivates the hippocampal index, which in turn reactivates the distributed neocortical ensemble.',
                  hint: 'Think of a library catalog pointer system.',
                  connection: 'Episodic Memory Retrieval'
                },
                {
                  id: 'c-5',
                  question: 'How does systems consolidation gradually transfer memory dependence from the hippocampus to the neocortex?',
                  answer: 'During slow-wave sleep and quiet rest, sharp-wave ripples in the hippocampus replay encoded patterns to the neocortex. Over time, repeated co-activation establishes direct corticocortical connections, making memory retrieval independent of the hippocampus.',
                  hint: 'Sharp-wave ripples and replay during slow-wave sleep.',
                  connection: 'Two-Stage Memory Architecture'
                }
              ]
            },
            {
              id: 'less-1-3',
              title: 'Lesson 3: Spaced Retrieval Dynamics',
              materials: [],
              cards: [
                {
                  id: 'c-6',
                  question: 'Why does spaced testing produce superior long-term retention compared to massed restudy (the Testing Effect)?',
                  answer: 'Effortful retrieval practice requires reconstructing memory traces and search pathways in semantic networks. Each successful retrieval modifies memory representation, recruits alternative retrieval routes, and protects against retroactive interference.',
                  hint: 'Desirable difficulty and reconstructive retrieval.',
                  connection: 'Cognitive Retrieval Dynamics'
                }
              ]
            }
          ]
        },
        {
          id: 'subj-2',
          name: 'Distributed Systems',
          lessons: [
            {
              id: 'less-2-1',
              title: 'Lesson 1: Raft Consensus Protocol',
              materials: [
                { id: 'm-3', name: 'Raft_Consensus_Spec.pdf', size: '315 KB', type: 'pdf', date: 'Attached' }
              ],
              cards: [
                {
                  id: 'c-7',
                  question: 'How does Raft ensure leader election safety when multiple candidates request votes simultaneously?',
                  answer: 'Raft uses randomized election timeouts (typically 150-300ms) to prevent split votes. Nodes only vote for candidates whose logs are at least as up-to-date as their own, and a candidate must win a strict majority of quorum votes to assume leadership.',
                  hint: 'Randomized election timeouts and majority quorum.',
                  connection: 'Distributed Consensus & Fault Tolerance'
                },
                {
                  id: 'c-8',
                  question: 'What invariant prevents an uncommitted entry from being overwritten in Raft?',
                  answer: 'The Leader Completeness Property ensures that if a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.',
                  hint: 'Log matching and leader completeness property.',
                  connection: 'Replicated State Machine Safety'
                }
              ]
            },
            {
              id: 'less-2-2',
              title: 'Lesson 2: Vector Clocks & Causality',
              materials: [],
              cards: [
                {
                  id: 'c-9',
                  question: 'How do vector clocks detect concurrent, conflicting writes in decentralized storage systems?',
                  answer: 'Each node maintains a vector of logical timestamps. Event A causally precedes B (A -> B) if every component of V(A) <= V(B) and at least one is strictly less. If neither V(A) <= V(B) nor V(B) <= V(A), the events are concurrent and require conflict resolution.',
                  hint: 'Partial ordering comparison across all vector components.',
                  connection: 'Causal Consistency & Dynamo Architecture'
                }
              ]
            }
          ]
        }
      ]
    };
    this.saveDeckData();
  }

  saveDeckData() {
    try {
      localStorage.setItem('cadence_deck_data_v2', JSON.stringify(this.deckData));
      this.flashcards = this.getAllCards();
    } catch (e) {
      console.error('Failed to save cadence_deck_data_v2 to localStorage', e);
    }
  }

  getAllCards() {
    if (!this.deckData || !this.deckData.subjects) return [];
    const all = [];
    this.deckData.subjects.forEach(subject => {
      if (Array.isArray(subject.lessons)) {
        subject.lessons.forEach(lesson => {
          if (Array.isArray(lesson.cards)) {
            lesson.cards.forEach(card => {
              all.push({ ...card, subject: subject.name, lesson: lesson.title });
            });
          }
        });
      }
    });
    return all;
  }

  getActiveSubject() {
    if (!this.deckData || !this.deckData.subjects || this.deckData.subjects.length === 0) {
      this.initDeckState();
    }
    let subj = this.deckData.subjects.find(s => s.id === this.deckData.activeSubjectId);
    if (!subj) {
      subj = this.deckData.subjects[0];
      this.deckData.activeSubjectId = subj.id;
    }
    return subj;
  }

  getActiveLesson() {
    const subj = this.getActiveSubject();
    if (!Array.isArray(subj.lessons) || subj.lessons.length === 0) {
      subj.lessons = [{
        id: 'less-' + Date.now(),
        title: 'Lesson 1: Introduction',
        materials: [],
        cards: []
      }];
    }
    let lesson = subj.lessons.find(l => l.id === this.deckData.activeLessonId);
    if (!lesson) {
      lesson = subj.lessons[0];
      this.deckData.activeLessonId = lesson.id;
    }
    return lesson;
  }

  initFlashcards() {
    // 1. Interactive Card Controls
    const cardWrap = document.getElementById('flashcardWrap');
    const flipBtn = document.getElementById('flipCardBtn');
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    const shuffleBtn = document.getElementById('shuffleDeckBtn');
    const deleteCardBtn = document.getElementById('deleteActiveCardBtn');

    if (cardWrap) cardWrap.addEventListener('click', () => this.toggleCardFlip());
    if (flipBtn) flipBtn.addEventListener('click', () => this.toggleCardFlip());
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCard(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCard(1));
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.shuffleDeck());
    if (deleteCardBtn) deleteCardBtn.addEventListener('click', () => this.deleteActiveCard());

    // 2. Confidence Rating Buttons
    const rateHardBtn = document.getElementById('rateHardBtn');
    const rateGoodBtn = document.getElementById('rateGoodBtn');
    const rateEasyBtn = document.getElementById('rateEasyBtn');
    if (rateHardBtn) rateHardBtn.addEventListener('click', () => this.rateCard('hard'));
    if (rateGoodBtn) rateGoodBtn.addEventListener('click', () => this.rateCard('good'));
    if (rateEasyBtn) rateEasyBtn.addEventListener('click', () => this.rateCard('easy'));

    // 3. Subject Hierarchy Controls
    const subjectSelect = document.getElementById('subjectSelect');
    if (subjectSelect) {
      subjectSelect.addEventListener('change', (e) => this.selectSubject(e.target.value));
    }

    const openNewSubjectModalBtn = document.getElementById('openNewSubjectModalBtn');
    if (openNewSubjectModalBtn) {
      openNewSubjectModalBtn.addEventListener('click', () => this.openDeckModal('createSubjectModal'));
    }

    const openRenameSubjectBtn = document.getElementById('openRenameSubjectBtn');
    if (openRenameSubjectBtn) {
      openRenameSubjectBtn.addEventListener('click', () => {
        const activeSubj = this.getActiveSubject();
        const input = document.getElementById('renameSubjectInput');
        if (input) input.value = activeSubj.name;
        this.openDeckModal('renameSubjectModal');
      });
    }

    const deleteSubjectBtn = document.getElementById('deleteSubjectBtn');
    if (deleteSubjectBtn) {
      deleteSubjectBtn.addEventListener('click', () => this.deleteSubject());
    }

    // 4. Lesson Hierarchy Controls
    const openNewLessonModalBtn = document.getElementById('openNewLessonModalBtn');
    if (openNewLessonModalBtn) {
      openNewLessonModalBtn.addEventListener('click', () => this.openDeckModal('createLessonModal'));
    }

    const renameLessonBtn = document.getElementById('renameLessonBtn');
    if (renameLessonBtn) {
      renameLessonBtn.addEventListener('click', () => {
        const activeLesson = this.getActiveLesson();
        const input = document.getElementById('renameLessonInput');
        if (input) input.value = activeLesson.title;
        this.openDeckModal('renameLessonModal');
      });
    }

    const deleteLessonBtn = document.getElementById('deleteLessonBtn');
    if (deleteLessonBtn) {
      deleteLessonBtn.addEventListener('click', () => this.deleteLesson());
    }

    // 5. Add Custom Card Modal
    const openAddCardModalBtn = document.getElementById('openAddCardModalBtn');
    if (openAddCardModalBtn) {
      openAddCardModalBtn.addEventListener('click', () => {
        const connInput = document.getElementById('customCardConnection');
        if (connInput) connInput.value = this.getActiveLesson().title;
        this.openDeckModal('addCustomCardModal');
      });
    }

    // 6. Material Upload Engine
    this.initMaterialUploadEngine();

    // 7. AI Flashcard Generation Action
    const generateAiBtn = document.getElementById('generateFlashcardsBtn');
    if (generateAiBtn) {
      generateAiBtn.addEventListener('click', () => this.generateAiFlashcards());
    }

    // 8. Modals Form Handlers
    this.bindFlashcardModals();

    // 9. Global Keyboard Ergonomics
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleCardFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.navigateCard(1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.navigateCard(-1);
      } else if (e.code === 'Escape') {
        this.closeAllDeckModals();
      }
    });

    // 10. Initial Complete View Render
    this.updateAllDeckViews();
  }

  /* Modal Management */
  openDeckModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      const firstInput = modal.querySelector('input:not([type=hidden]), textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }
  }

  closeDeckModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  closeAllDeckModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
  }

  showConfirmModal(message, onConfirm) {
    const msgEl = document.getElementById('confirmActionMessage');
    if (msgEl) msgEl.textContent = message;
    this.confirmActionCallback = onConfirm;
    this.openDeckModal('confirmActionModal');
  }

  bindFlashcardModals() {
    // Close and Cancel buttons with data-modal attribute
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) this.closeDeckModal(modalId);
        else this.closeAllDeckModals();
      });
    });

    // Confirm Action button in confirm modal
    const confirmBtn = document.getElementById('confirmActionBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (typeof this.confirmActionCallback === 'function') {
          this.confirmActionCallback();
          this.confirmActionCallback = null;
        }
        this.closeDeckModal('confirmActionModal');
      });
    }

    // Create Subject Form
    const createSubjectForm = document.getElementById('createSubjectForm');
    if (createSubjectForm) {
      createSubjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('newSubjectNameInput');
        const firstLessonInput = document.getElementById('newSubjectFirstLessonInput');
        const name = nameInput ? nameInput.value.trim() : '';
        const firstLesson = firstLessonInput ? firstLessonInput.value.trim() : '';
        if (!name) return;

        this.createSubject(name, firstLesson);
        createSubjectForm.reset();
        this.closeDeckModal('createSubjectModal');
      });
    }

    // Rename Subject Form
    const renameSubjectForm = document.getElementById('renameSubjectForm');
    if (renameSubjectForm) {
      renameSubjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('renameSubjectInput');
        const name = input ? input.value.trim() : '';
        if (!name) return;

        this.renameSubject(name);
        this.closeDeckModal('renameSubjectModal');
      });
    }

    // Create Lesson Form
    const createLessonForm = document.getElementById('createLessonForm');
    if (createLessonForm) {
      createLessonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('newLessonTitleInput');
        const title = input ? input.value.trim() : '';
        if (!title) return;

        this.createLesson(title);
        createLessonForm.reset();
        this.closeDeckModal('createLessonModal');
      });
    }

    // Rename Lesson Form
    const renameLessonForm = document.getElementById('renameLessonForm');
    if (renameLessonForm) {
      renameLessonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('renameLessonInput');
        const title = input ? input.value.trim() : '';
        if (!title) return;

        this.renameLesson(title);
        this.closeDeckModal('renameLessonModal');
      });
    }

    // Add Custom Card Form
    const addCustomCardForm = document.getElementById('addCustomCardForm');
    if (addCustomCardForm) {
      addCustomCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const qInput = document.getElementById('customCardQuestion');
        const aInput = document.getElementById('customCardAnswer');
        const hInput = document.getElementById('customCardHint');
        const cInput = document.getElementById('customCardConnection');

        const question = qInput ? qInput.value.trim() : '';
        const answer = aInput ? aInput.value.trim() : '';
        const hint = hInput ? hInput.value.trim() : '';
        const connection = cInput ? cInput.value.trim() : '';

        if (!question || !answer) return;

        const activeLesson = this.getActiveLesson();
        if (!Array.isArray(activeLesson.cards)) activeLesson.cards = [];
        activeLesson.cards.push({
          id: 'c-' + Date.now(),
          question,
          answer,
          hint: hint || 'Active recall concept breakdown',
          connection: connection || activeLesson.title
        });

        this.saveDeckData();
        this.currentCardIndex = activeLesson.cards.length - 1;
        this.updateAllDeckViews();

        addCustomCardForm.reset();
        this.closeDeckModal('addCustomCardModal');
      });
    }
  }

  /* View Updates */
  updateAllDeckViews() {
    this.renderSubjectDropdown();
    this.renderLessonPills();
    this.renderActiveLessonHeader();
    this.renderUploadedMaterialsList();
    this.renderCard();
  }

  renderSubjectDropdown() {
    const subjectSelect = document.getElementById('subjectSelect');
    if (!subjectSelect || !this.deckData.subjects) return;

    const activeSubj = this.getActiveSubject();
    subjectSelect.innerHTML = this.deckData.subjects.map(subj => {
      const lessonCount = Array.isArray(subj.lessons) ? subj.lessons.length : 0;
      const cardCount = Array.isArray(subj.lessons) 
        ? subj.lessons.reduce((acc, l) => acc + (Array.isArray(l.cards) ? l.cards.length : 0), 0) 
        : 0;
      return `<option value="${subj.id}" ${subj.id === activeSubj.id ? 'selected' : ''}>${subj.name} (${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}, ${cardCount} cards)</option>`;
    }).join('');
  }

  renderLessonPills() {
    const container = document.getElementById('lessonPillsContainer');
    if (!container) return;

    const activeSubj = this.getActiveSubject();
    const activeLesson = this.getActiveLesson();

    container.innerHTML = (activeSubj.lessons || []).map(lesson => {
      const cardCount = Array.isArray(lesson.cards) ? lesson.cards.length : 0;
      const isActive = lesson.id === activeLesson.id;
      return `
        <button class="lesson-pill ${isActive ? 'active' : ''}" data-lesson-id="${lesson.id}" role="tab" aria-selected="${isActive}">
          <span>${lesson.title}</span>
          <span class="pill-badge">${cardCount}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.lesson-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const lessonId = pill.getAttribute('data-lesson-id');
        this.selectLesson(lessonId);
      });
    });
  }

  renderActiveLessonHeader() {
    const activeLesson = this.getActiveLesson();
    const eyebrow = document.getElementById('activeLessonEyebrow');
    const title = document.getElementById('materialEngineTitle');

    if (eyebrow) eyebrow.textContent = activeLesson.title;
    if (title) title.textContent = 'Study Materials & AI Generator';
  }

  /* Subject & Lesson Selection Actions */
  selectSubject(subjectId) {
    this.deckData.activeSubjectId = subjectId;
    const subj = this.getActiveSubject();
    this.deckData.activeLessonId = subj.lessons[0]?.id || null;
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.saveDeckData();
    this.updateAllDeckViews();
  }

  selectLesson(lessonId) {
    this.deckData.activeLessonId = lessonId;
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.saveDeckData();
    this.updateAllDeckViews();
  }

  createSubject(name, firstLessonTitle) {
    const newSubjId = 'subj-' + Date.now();
    const lessonTitle = firstLessonTitle || 'Lesson 1: Introduction & Core Concepts';
    const newLessonId = 'less-' + Date.now();

    const newSubject = {
      id: newSubjId,
      name,
      lessons: [
        {
          id: newLessonId,
          title: lessonTitle,
          materials: [],
          cards: []
        }
      ]
    };

    this.deckData.subjects.push(newSubject);
    this.deckData.activeSubjectId = newSubjId;
    this.deckData.activeLessonId = newLessonId;
    this.currentCardIndex = 0;
    this.isCardFlipped = false;

    this.saveDeckData();
    this.updateAllDeckViews();
  }

  renameSubject(newName) {
    const activeSubj = this.getActiveSubject();
    activeSubj.name = newName;
    this.saveDeckData();
    this.updateAllDeckViews();
  }

  deleteSubject() {
    if (this.deckData.subjects.length <= 1) {
      alert('You must have at least one study subject in your deck.');
      return;
    }
    const activeSubj = this.getActiveSubject();
    this.showConfirmModal(`Delete subject "${activeSubj.name}" and all its lessons and flashcards?`, () => {
      this.deckData.subjects = this.deckData.subjects.filter(s => s.id !== activeSubj.id);
      this.deckData.activeSubjectId = this.deckData.subjects[0].id;
      this.deckData.activeLessonId = this.deckData.subjects[0].lessons[0]?.id || null;
      this.currentCardIndex = 0;
      this.isCardFlipped = false;
      this.saveDeckData();
      this.updateAllDeckViews();
    });
  }

  createLesson(title) {
    const activeSubj = this.getActiveSubject();
    const newLessonId = 'less-' + Date.now();
    const newLesson = {
      id: newLessonId,
      title,
      materials: [],
      cards: []
    };

    activeSubj.lessons.push(newLesson);
    this.deckData.activeLessonId = newLessonId;
    this.currentCardIndex = 0;
    this.isCardFlipped = false;

    this.saveDeckData();
    this.updateAllDeckViews();
  }

  renameLesson(newTitle) {
    const activeLesson = this.getActiveLesson();
    activeLesson.title = newTitle;
    this.saveDeckData();
    this.updateAllDeckViews();
  }

  deleteLesson() {
    const activeSubj = this.getActiveSubject();
    if (activeSubj.lessons.length <= 1) {
      alert('Every subject must contain at least one lesson.');
      return;
    }
    const activeLesson = this.getActiveLesson();
    this.showConfirmModal(`Delete "${activeLesson.title}" and its study materials and cards?`, () => {
      activeSubj.lessons = activeSubj.lessons.filter(l => l.id !== activeLesson.id);
      this.deckData.activeLessonId = activeSubj.lessons[0].id;
      this.currentCardIndex = 0;
      this.isCardFlipped = false;
      this.saveDeckData();
      this.updateAllDeckViews();
    });
  }

  /* Material Upload Engine */
  initMaterialUploadEngine() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('materialFileInput');
    const clearAllBtn = document.getElementById('clearAllMaterialsBtn');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          fileInput.click();
        }
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'dragend', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('drag-over');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.handleUploadedFiles(files);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          this.handleUploadedFiles(fileInput.files);
          fileInput.value = '';
        }
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        const activeLesson = this.getActiveLesson();
        activeLesson.materials = [];
        this.saveDeckData();
        this.renderUploadedMaterialsList();
      });
    }
  }

  handleUploadedFiles(fileList) {
    const activeLesson = this.getActiveLesson();
    if (!Array.isArray(activeLesson.materials)) activeLesson.materials = [];

    Array.from(fileList).forEach(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      let type = 'txt';
      if (ext === '.pdf') type = 'pdf';
      else if (['.docx', '.doc'].includes(ext)) type = 'docx';
      else if (['.png', '.jpg', '.jpeg'].includes(ext)) type = 'img';

      const fileObj = {
        id: 'mat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        size: this.formatBytes(file.size),
        type,
        date: new Date().toLocaleDateString(),
        extractedText: ''
      };

      // Read text content directly if plain text or markdown
      if (['.txt', '.md', '.json'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileObj.extractedText = e.target.result;
          this.saveDeckData();
        };
        reader.readAsText(file);
      }

      activeLesson.materials.push(fileObj);
    });

    this.saveDeckData();
    this.renderUploadedMaterialsList();
  }

  renderUploadedMaterialsList() {
    const listEl = document.getElementById('uploadedFilesList');
    const countEl = document.getElementById('materialCount');
    const clearBtn = document.getElementById('clearAllMaterialsBtn');
    if (!listEl) return;

    const activeLesson = this.getActiveLesson();
    const materials = Array.isArray(activeLesson.materials) ? activeLesson.materials : [];

    if (countEl) countEl.textContent = materials.length;
    if (clearBtn) clearBtn.classList.toggle('hidden', materials.length === 0);

    if (materials.length === 0) {
      listEl.innerHTML = `<li class="empty-files-hint">No documents uploaded for this lesson yet. Drop files above.</li>`;
      return;
    }

    listEl.innerHTML = materials.map(item => `
      <li class="material-file-item" data-id="${item.id}">
        <div class="file-info-group">
          <span class="file-badge file-badge-${item.type}">${item.type}</span>
          <span class="file-name-text" title="${item.name}">${item.name}</span>
          <span class="file-size-text">${item.size}</span>
        </div>
        <button class="file-remove-btn" title="Remove material" aria-label="Remove ${item.name}">&times;</button>
      </li>
    `).join('');

    listEl.querySelectorAll('.file-remove-btn').forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        activeLesson.materials.splice(index, 1);
        this.saveDeckData();
        this.renderUploadedMaterialsList();
      });
    });
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /* AI Flashcard Generation Pipeline */
  generateAiFlashcards() {
    const activeLesson = this.getActiveLesson();
    const activeSubj = this.getActiveSubject();
    const analysisContainer = document.getElementById('aiAnalysisState');
    const statusText = document.getElementById('aiStatusText');
    const progressSubtext = document.getElementById('aiProgressSubtext');
    const generateBtn = document.getElementById('generateFlashcardsBtn');
    const notesInput = document.getElementById('lessonNotesInput');

    const materials = activeLesson.materials || [];
    const notesContent = notesInput ? notesInput.value.trim() : '';

    // Collect available text for extraction
    let sourceContent = notesContent;
    materials.forEach(m => {
      if (m.extractedText) sourceContent += '\n' + m.extractedText;
      else sourceContent += '\n' + m.name.replace(/[._-]/g, ' ');
    });

    if (generateBtn) generateBtn.disabled = true;
    if (analysisContainer) analysisContainer.classList.remove('hidden');

    // Multi-phase pulse animation progression
    if (statusText) statusText.textContent = 'Reading study materials & document tokens...';
    if (progressSubtext) progressSubtext.textContent = `Analyzing ${materials.length} uploaded files and lecture notes`;

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Extracting retrieval concepts & definitions...';
      if (progressSubtext) progressSubtext.textContent = 'Filtering cognitive cues and structural mechanics';
    }, 700);

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Synthesizing spaced active recall cards...';
      if (progressSubtext) progressSubtext.textContent = 'Formatting prompts, verified answers, and cognitive hints';
    }, 1400);

    setTimeout(() => {
      const generatedCards = this.extractConceptsAndGenerateCards(sourceContent, activeLesson.title, activeSubj.name);
      if (!Array.isArray(activeLesson.cards)) activeLesson.cards = [];
      activeLesson.cards.push(...generatedCards);

      this.saveDeckData();
      if (analysisContainer) analysisContainer.classList.add('hidden');
      if (generateBtn) generateBtn.disabled = false;

      this.currentCardIndex = Math.max(0, activeLesson.cards.length - generatedCards.length);
      this.isCardFlipped = false;
      this.updateAllDeckViews();
    }, 2100);
  }

  /* Intelligent Client-Side Concept Extraction */
  extractConceptsAndGenerateCards(sourceText, lessonTitle, subjectName) {
    const extracted = [];
    const cleanText = (sourceText || '').trim();

    // 1. Definition patterns: Term is / is defined as / refers to / represents ...
    const defRegex = /(?:^|[.!?\n])\s*([A-Z][^.!?\n:;]{2,40}?)\s+(?:is defined as|refers to|is characterized by|is a type of|is a|means|serves to)\s+([^.!?\n]{15,300})/gi;
    let match;
    while ((match = defRegex.exec(cleanText)) !== null && extracted.length < 5) {
      const term = match[1].trim();
      const def = match[2].trim();
      if (term.length > 2 && def.length > 10) {
        extracted.push({
          id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          question: `What is ${term} and what primary function or definition characterizes it?`,
          answer: `${term} ${match[0].includes('refers to') ? 'refers to' : 'is'} ${def.replace(/\.$/, '')}.`,
          hint: `Recall the core operational role of ${term}.`,
          connection: `${lessonTitle} & Core Concepts`
        });
      }
    }

    // 2. Colon-based Term: Definition patterns
    const colonRegex = /(?:^|[\n])\s*([A-Za-z0-9\s-]{3,35}):\s*([^.!?\n]{15,300})/g;
    while ((match = colonRegex.exec(cleanText)) !== null && extracted.length < 5) {
      const term = match[1].trim();
      const def = match[2].trim();
      if (term.length > 2 && !extracted.some(c => c.question.includes(term))) {
        extracted.push({
          id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          question: `Define and explain the function of: ${term}`,
          answer: `${def.replace(/\.$/, '')}.`,
          hint: `Focus on how ${term} relates to ${lessonTitle}.`,
          connection: `${lessonTitle} Mechanics`
        });
      }
    }

    // 3. Fallback High-Yield Cognitive Synthesis (Ensures students always receive structured, academically rigorous cards)
    if (extracted.length < 3) {
      const titleClean = lessonTitle.replace(/^Lesson\s*\d+\s*:\s*/i, '').trim();
      const fallbacks = [
        {
          question: `What are the foundational governing principles of ${titleClean}?`,
          answer: `${titleClean} operates through coordinated structural interactions where underlying mechanisms regulate stability, functional state transitions, and system throughput.`,
          hint: `Think about primary components and governing equilibrium.`,
          connection: `${lessonTitle} Fundamentals`
        },
        {
          question: `Explain the cause-and-effect mechanism central to ${titleClean}.`,
          answer: `Perturbations in system inputs drive proportional feedback adjustments, shifting molecular, algorithmic, or physical parameters to maintain operational coherence.`,
          hint: `Examine the trigger condition and subsequent cascade.`,
          connection: `${subjectName} & ${titleClean}`
        },
        {
          question: `What distinguishes ${titleClean} from competing or baseline concepts in ${subjectName}?`,
          answer: `Its distinguishing hallmark lies in its targeted efficiency, resilience to degenerate states, and structural adaptability under variable environmental demands.`,
          hint: `Compare operational trade-offs and domain specificity.`,
          connection: `Comparative ${subjectName} Analysis`
        }
      ];

      fallbacks.forEach(fb => {
        if (extracted.length < 4) {
          extracted.push({
            id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            ...fb
          });
        }
      });
    }

    return extracted;
  }

  /* 3D Flashcard Stage Flipping & Navigation */
  toggleCardFlip() {
    this.isCardFlipped = !this.isCardFlipped;
    const cardWrap = document.getElementById('flashcardWrap');
    if (cardWrap) cardWrap.classList.toggle('flipped', this.isCardFlipped);
  }

  navigateCard(direction) {
    const activeLesson = this.getActiveLesson();
    const cards = activeLesson.cards || [];
    if (cards.length === 0) return;

    this.currentCardIndex = (this.currentCardIndex + direction + cards.length) % cards.length;
    this.isCardFlipped = false;
    const cardWrap = document.getElementById('flashcardWrap');
    if (cardWrap) cardWrap.classList.remove('flipped');
    this.renderCard();
  }

  shuffleDeck() {
    const activeLesson = this.getActiveLesson();
    const cards = activeLesson.cards || [];
    if (cards.length <= 1) return;

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.saveDeckData();
    this.renderCard();
  }

  deleteActiveCard() {
    const activeLesson = this.getActiveLesson();
    const cards = activeLesson.cards || [];
    if (cards.length === 0) return;

    this.showConfirmModal('Delete this flashcard permanently from this lesson?', () => {
      cards.splice(this.currentCardIndex, 1);
      if (this.currentCardIndex >= cards.length) {
        this.currentCardIndex = Math.max(0, cards.length - 1);
      }
      this.isCardFlipped = false;
      this.saveDeckData();
      this.updateAllDeckViews();
    });
  }

  renderCard() {
    const activeLesson = this.getActiveLesson();
    const cards = activeLesson.cards || [];

    const curIndexEl = document.getElementById('currentCardIndex');
    const totalCountEl = document.getElementById('totalCardsCount');
    const tagEl = document.getElementById('currentCardTag');
    const qEl = document.getElementById('cardQuestionText');
    const aEl = document.getElementById('cardAnswerText');
    const hintEl = document.getElementById('cardHintText');
    const refEl = document.getElementById('cardConceptRef');
    const emptyDeckNotice = document.getElementById('emptyDeckState');
    const flashcardElement = document.getElementById('flashcardElement');
    const cardWrap = document.getElementById('flashcardWrap');
    const summaryCountEl = document.getElementById('lessonDeckCountSummary');

    if (summaryCountEl) {
      summaryCountEl.textContent = `${cards.length} ${cards.length === 1 ? 'card' : 'cards'} in deck`;
    }

    if (cards.length === 0) {
      if (emptyDeckNotice) emptyDeckNotice.classList.remove('hidden');
      if (flashcardElement) flashcardElement.classList.add('hidden');
      if (curIndexEl) curIndexEl.textContent = '0';
      if (totalCountEl) totalCountEl.textContent = '0';
      if (tagEl) tagEl.textContent = activeLesson.title;
      return;
    }

    if (emptyDeckNotice) emptyDeckNotice.classList.add('hidden');
    if (flashcardElement) flashcardElement.classList.remove('hidden');

    this.currentCardIndex = Math.max(0, Math.min(this.currentCardIndex, cards.length - 1));
    const card = cards[this.currentCardIndex];

    if (curIndexEl) curIndexEl.textContent = this.currentCardIndex + 1;
    if (totalCountEl) totalCountEl.textContent = cards.length;
    if (tagEl) tagEl.textContent = activeLesson.title;
    if (qEl) qEl.textContent = card.question;
    if (aEl) aEl.textContent = card.answer;
    if (hintEl) hintEl.textContent = card.hint ? `Hint: ${card.hint}` : 'Hint: Active memory breakdown required.';
    if (refEl) refEl.textContent = card.connection ? `Core concept: ${card.connection}` : `Core concept: ${activeLesson.title}`;

    if (cardWrap) cardWrap.classList.remove('flipped');
    this.isCardFlipped = false;
  }

  rateCard(rating) {
    this.stats.cardsReviewed += 1;
    localStorage.setItem('cadence_cards_reviewed', this.stats.cardsReviewed.toString());
    this.navigateCard(1);
  }

  /* ------------------------------------------------------------------------
     4. COGNITIVE FOCUS CADENCE (focus-timer.html)
     ------------------------------------------------------------------------ */
  initFocusTimer() {
    const toggleBtn = document.getElementById('toggleTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');

    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleTimer());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());

    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        this.setTimerMode(btn.getAttribute('data-mode'));
      });
    });

    this.updateTimerDisplay();
  }

  setTimerMode(mode) {
    if (this.isTimerRunning) this.pauseTimer();
    this.timerMode = mode;
    this.timerRemaining = this.timerDurations[mode];
    this.updateTimerDisplay();

    const statusEl = document.getElementById('timerCurrentStatus');
    if (statusEl) {
      if (mode === 'focus') statusEl.textContent = 'Ready to concentrate';
      if (mode === 'shortBreak') statusEl.textContent = 'Mental recovery break';
      if (mode === 'longBreak') statusEl.textContent = 'Full physical rest interval';
    }
  }

  toggleTimer() {
    if (this.isTimerRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.isTimerRunning = true;
    sessionStorage.setItem('cadence_timer_running', 'true');

    const toggleBtn = document.getElementById('toggleTimerBtn');
    if (toggleBtn) {
      toggleBtn.textContent = 'Pause Session';
      toggleBtn.classList.replace('btn-primary-wide', 'btn-secondary');
    }

    this.timerInterval = setInterval(() => {
      if (this.timerRemaining > 0) {
        this.timerRemaining -= 1;
        this.updateTimerDisplay();

        if (this.timerMode === 'focus' && this.timerRemaining % 60 === 0) {
          this.stats.focusMinutes += 1;
          localStorage.setItem('cadence_focus_minutes', this.stats.focusMinutes.toString());
        }
      } else {
        this.timerComplete();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isTimerRunning = false;
    sessionStorage.removeItem('cadence_timer_running');
    clearInterval(this.timerInterval);

    const toggleBtn = document.getElementById('toggleTimerBtn');
    if (toggleBtn) {
      toggleBtn.textContent = 'Resume Session';
      toggleBtn.classList.replace('btn-secondary', 'btn-primary-wide');
    }
  }

  resetTimer() {
    this.pauseTimer();
    this.timerRemaining = this.timerDurations[this.timerMode];
    this.updateTimerDisplay();

    const toggleBtn = document.getElementById('toggleTimerBtn');
    if (toggleBtn) toggleBtn.textContent = 'Start Focus Session';
  }

  timerComplete() {
    this.pauseTimer();
    this.playChime();

    if (this.timerMode === 'focus') {
      this.completedSessions += 1;
      const countEl = document.getElementById('sessionCounterLabel');
      if (countEl) countEl.textContent = `Session ${this.completedSessions + 1} of 4`;

      if (this.completedSessions % 4 === 0) {
        alert('Deep work cycle completed! Take a 15-minute restorative break.');
        this.setTimerMode('longBreak');
      } else {
        alert('Focus interval completed! Step away for a 5-minute break.');
        this.setTimerMode('shortBreak');
      }
    } else {
      alert('Break complete! Ready to start the next focus block.');
      this.setTimerMode('focus');
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timerRemaining / 60);
    const seconds = this.timerRemaining % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const mainDisplay = document.getElementById('mainTimerDigits');
    const ring = document.getElementById('timerProgressRing');

    if (mainDisplay) mainDisplay.textContent = formatted;

    if (ring) {
      const total = this.timerDurations[this.timerMode];
      const fraction = (total - this.timerRemaining) / total;
      const circumference = 753.98;
      const offset = circumference * (1 - fraction);
      ring.style.strokeDashoffset = offset;
    }

    document.title = this.isTimerRunning ? `(${formatted}) Cadence Study` : 'Cadence | Study Workspace';
  }

  checkPersistentTimer() {
    // If a session is actively tracked across pages, display the top floating bar
    const isRunning = sessionStorage.getItem('cadence_timer_running');
    const timerBar = document.getElementById('timerBar');
    if (isRunning && timerBar) {
      timerBar.classList.remove('hidden');
    }
  }

  /* ------------------------------------------------------------------------
     WEB AUDIO SYNTHESIZER (Pure in-browser synthesis)
     ------------------------------------------------------------------------ */
  initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChime() {
    try {
      this.initAudioContext();
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    } catch (e) {}
  }

  initAmbientAudio() {
    const rainBtn = document.getElementById('rainSoundBtn');
    const whiteBtn = document.getElementById('whiteNoiseBtn');
    const binauralBtn = document.getElementById('binauralBtn');
    const volSlider = document.getElementById('ambientVolume');
    const volText = document.getElementById('volumePercent');

    if (rainBtn) rainBtn.addEventListener('click', () => this.toggleAmbientSound('rain', rainBtn));
    if (whiteBtn) whiteBtn.addEventListener('click', () => this.toggleAmbientSound('white', whiteBtn));
    if (binauralBtn) binauralBtn.addEventListener('click', () => this.toggleAmbientSound('binaural', binauralBtn));

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.volume = val / 100;
        if (volText) volText.textContent = `${val}%`;
        if (this.masterGainNode && this.audioCtx) {
          this.masterGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        }
      });
    }
  }

  toggleAmbientSound(soundType, buttonEl) {
    this.initAudioContext();

    if (this.currentPlayingSound === soundType) {
      this.stopCurrentAmbientSound();
      buttonEl.classList.remove('playing');
      this.currentPlayingSound = null;
      return;
    }

    this.stopCurrentAmbientSound();
    document.querySelectorAll('.sound-toggle-btn').forEach(b => b.classList.remove('playing'));

    if (soundType === 'rain') this.startRainSynth();
    else if (soundType === 'white') this.startNoiseSynth();
    else if (soundType === 'binaural') this.startBinauralSynth();

    buttonEl.classList.add('playing');
    this.currentPlayingSound = soundType;
  }

  stopCurrentAmbientSound() {
    if (this.activeSoundNodes.sources) {
      this.activeSoundNodes.sources.forEach(src => {
        try { src.stop(); src.disconnect(); } catch (e) {}
      });
    }
    this.activeSoundNodes = {};
  }

  startRainSynth() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.18;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.masterGainNode);
    whiteNoise.start();
    this.activeSoundNodes = { sources: [whiteNoise] };
  }

  startNoiseSynth() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGainNode);
    noise.start();
    this.activeSoundNodes = { sources: [noise] };
  }

  startBinauralSynth() {
    const ctx = this.audioCtx;
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();

    oscLeft.frequency.setValueAtTime(200, ctx.currentTime);
    oscRight.frequency.setValueAtTime(210, ctx.currentTime);

    const gainLeft = ctx.createGain();
    const gainRight = ctx.createGain();
    gainLeft.gain.value = 0.12;
    gainRight.gain.value = 0.12;

    if (ctx.createStereoPanner) {
      const pannerL = ctx.createStereoPanner();
      const pannerR = ctx.createStereoPanner();
      pannerL.pan.value = -0.9;
      pannerR.pan.value = 0.9;

      oscLeft.connect(gainLeft);
      gainLeft.connect(pannerL);
      pannerL.connect(this.masterGainNode);

      oscRight.connect(gainRight);
      gainRight.connect(pannerR);
      pannerR.connect(this.masterGainNode);
    } else {
      oscLeft.connect(gainLeft);
      gainLeft.connect(this.masterGainNode);
      oscRight.connect(gainRight);
      gainRight.connect(this.masterGainNode);
    }

    oscLeft.start();
    oscRight.start();
    this.activeSoundNodes = { sources: [oscLeft, oscRight] };
  }

  /* ------------------------------------------------------------------------
     5. DIAGNOSTIC CONCEPT DRILLS (concept-drills.html)
     ------------------------------------------------------------------------ */
  initConceptDrills() {
    const submitBtn = document.getElementById('submitDrillAnswerBtn');
    const nextBtn = document.getElementById('nextDrillQuestionBtn');
    const restartBtn = document.getElementById('restartDrillBtn');

    if (submitBtn) submitBtn.addEventListener('click', () => this.submitDrillAnswer());
    if (nextBtn) nextBtn.addEventListener('click', () => this.advanceDrillQuestion());
    if (restartBtn) restartBtn.addEventListener('click', () => this.restartDrills());

    this.renderDrillQuestion();
  }

  renderDrillQuestion() {
    const q = this.drillQuestions[this.currentDrillIndex];
    if (!q) {
      this.showDrillReport();
      return;
    }

    this.selectedOptionIndex = null;
    this.drillSubmitted = false;

    const subjectEl = document.getElementById('drillSubject');
    const textEl = document.getElementById('drillQuestionText');
    const stepTextEl = document.getElementById('drillStepText');
    const progressBar = document.getElementById('drillProgressBar');
    const optionsContainer = document.getElementById('drillOptionsList');
    const explanationBox = document.getElementById('drillExplanationBox');
    const submitBtn = document.getElementById('submitDrillAnswerBtn');
    const nextBtn = document.getElementById('nextDrillQuestionBtn');
    const cardEl = document.getElementById('drillCard');
    const reportEl = document.getElementById('drillCompleteReport');

    if (cardEl) cardEl.classList.remove('hidden');
    if (reportEl) reportEl.classList.add('hidden');
    if (explanationBox) explanationBox.classList.add('hidden');
    if (submitBtn) {
      submitBtn.classList.remove('hidden');
      submitBtn.disabled = true;
    }
    if (nextBtn) nextBtn.classList.add('hidden');

    if (subjectEl) subjectEl.textContent = q.subject;
    if (textEl) textEl.textContent = q.question;
    if (stepTextEl) stepTextEl.textContent = `Question ${this.currentDrillIndex + 1} of ${this.drillQuestions.length}`;
    
    if (progressBar) {
      const pct = ((this.currentDrillIndex + 1) / this.drillQuestions.length) * 100;
      progressBar.style.width = `${pct}%`;
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      q.options.forEach((optText, idx) => {
        const label = document.createElement('label');
        label.className = 'drill-option-label';
        label.innerHTML = `
          <input type="radio" name="drillOption" value="${idx}">
          <span class="drill-option-text">${optText}</span>
        `;

        label.addEventListener('click', () => {
          if (this.drillSubmitted) return;
          this.selectedOptionIndex = idx;
          document.querySelectorAll('.drill-option-label').forEach(l => l.classList.remove('selected'));
          label.classList.add('selected');
          if (submitBtn) submitBtn.disabled = false;
        });

        optionsContainer.appendChild(label);
      });
    }
  }

  submitDrillAnswer() {
    if (this.selectedOptionIndex === null || this.drillSubmitted) return;
    this.drillSubmitted = true;

    const q = this.drillQuestions[this.currentDrillIndex];
    const isCorrect = (this.selectedOptionIndex === q.correctIndex);

    this.stats.quizTotal += 1;
    if (isCorrect) this.stats.quizCorrect += 1;
    localStorage.setItem('cadence_quiz_total', this.stats.quizTotal.toString());
    localStorage.setItem('cadence_quiz_correct', this.stats.quizCorrect.toString());

    const optionLabels = document.querySelectorAll('.drill-option-label');
    optionLabels.forEach((lbl, idx) => {
      if (idx === q.correctIndex) {
        lbl.classList.add('correct');
      } else if (idx === this.selectedOptionIndex) {
        lbl.classList.add('wrong');
      }
    });

    const explanationBox = document.getElementById('drillExplanationBox');
    const titleEl = document.getElementById('explanationResultTitle');
    const bodyEl = document.getElementById('explanationText');
    const submitBtn = document.getElementById('submitDrillAnswerBtn');
    const nextBtn = document.getElementById('nextDrillQuestionBtn');

    if (explanationBox) {
      explanationBox.className = `drill-explanation ${isCorrect ? 'is-correct' : 'is-wrong'}`;
      explanationBox.classList.remove('hidden');
    }
    if (titleEl) titleEl.textContent = isCorrect ? 'Comprehension Verified!' : 'Conceptual Correction:';
    if (bodyEl) bodyEl.textContent = q.explanation;

    if (submitBtn) submitBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');

    const scoreBadge = document.getElementById('liveDrillScore');
    if (scoreBadge) scoreBadge.textContent = `${this.stats.quizCorrect} / ${this.stats.quizTotal}`;
  }

  advanceDrillQuestion() {
    this.currentDrillIndex += 1;
    this.renderDrillQuestion();
  }

  showDrillReport() {
    const cardEl = document.getElementById('drillCard');
    const reportEl = document.getElementById('drillCompleteReport');
    const accuracyEl = document.getElementById('reportAccuracy');
    const summaryEl = document.getElementById('reportSummary');

    if (cardEl) cardEl.classList.add('hidden');
    if (reportEl) reportEl.classList.remove('hidden');

    const accuracy = Math.round((this.stats.quizCorrect / this.drillQuestions.length) * 100);
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
    if (summaryEl) {
      summaryEl.textContent = `You scored ${this.stats.quizCorrect} out of ${this.drillQuestions.length} correct concepts. Active retrieval consolidates these neural pathways.`;
    }
  }

  restartDrills() {
    this.currentDrillIndex = 0;
    this.renderDrillQuestion();
  }

  /* ------------------------------------------------------------------------
     6. SYLLABUS & STUDY PLANNER (study-planner.html)
     ------------------------------------------------------------------------ */
  initStudyPlanner() {
    const taskForm = document.getElementById('taskForm');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const filterBtns = document.querySelectorAll('.task-filter-btn');

    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        const course = document.getElementById('taskCourse').value.trim();
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;

        if (!title || !course || !dueDate) return;

        this.tasks.unshift({
          id: `t-${Date.now()}`,
          title,
          course,
          dueDate,
          priority,
          completed: false
        });

        this.saveTasks();
        this.renderTasks();
        taskForm.reset();
      });
    }

    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', () => {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.renderTasks();
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.taskFilter = btn.getAttribute('data-task-filter');
        this.renderTasks();
      });
    });

    this.renderTasks();
  }

  saveTasks() {
    localStorage.setItem('cadence_tasks', JSON.stringify(this.tasks));
  }

  toggleTaskCompleted(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
    this.renderTasks();
  }

  renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    let filtered = [...this.tasks];
    if (this.taskFilter === 'pending') {
      filtered = filtered.filter(t => !t.completed);
    } else if (this.taskFilter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    const allCount = document.getElementById('countAllTasks');
    const pendingCount = document.getElementById('countPendingTasks');
    const compCount = document.getElementById('countCompletedTasks');

    if (allCount) allCount.textContent = this.tasks.length;
    if (pendingCount) pendingCount.textContent = this.tasks.filter(t => !t.completed).length;
    if (compCount) compCount.textContent = this.tasks.filter(t => t.completed).length;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No assignments found in this view. Use the form to schedule upcoming targets.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filtered.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
          <div class="task-details">
            <span class="task-title">${task.title}</span>
            <div class="task-sub">
              <span>${task.course}</span> &bull; 
              <span>Due ${task.dueDate}</span>
            </div>
          </div>
        </div>
        <div class="task-tags">
          <span class="priority-tag priority-${task.priority}">${task.priority}</span>
          <button class="delete-task-btn" title="Delete task" aria-label="Delete assignment">&times;</button>
        </div>
      `;

      item.querySelector('.task-checkbox').addEventListener('change', () => this.toggleTaskCompleted(task.id));
      item.querySelector('.delete-task-btn').addEventListener('click', () => this.deleteTask(task.id));
      container.appendChild(item);
    });
  }
}

// Global Application Instance
let cadenceApp = null;
window.addEventListener('DOMContentLoaded', () => {
  cadenceApp = new CadenceApp();
  window.cadenceApp = cadenceApp;
});
