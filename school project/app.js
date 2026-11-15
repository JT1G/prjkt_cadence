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

    // Shared Flashcards
    this.flashcards = [
      {
        id: 1,
        subject: 'Biology',
        question: 'How does ATP synthase generate ATP during oxidative phosphorylation?',
        answer: 'Protons move down their electrochemical gradient from the intermembrane space into the mitochondrial matrix through the F0 subunit of ATP synthase, causing it to rotate. This rotational mechanical energy drives the catalytic F1 subunit to phosphorylate ADP with inorganic phosphate into ATP.',
        hint: 'Think of proton gradients and mechanical rotary action.',
        connection: 'Chemiosmosis & Cellular Respiration'
      },
      {
        id: 2,
        subject: 'Physics',
        question: 'Why is the magnetic field inside a long ideal solenoid uniform and independent of diameter?',
        answer: 'By Ampère’s law (∮ B · dl = μ₀ I_enc), the field lines outside cancel out due to symmetry, while inside the turns, the contributions from each ring add constructively along the axis, resulting in B = μ₀ n I, which depends solely on turn density n and current I.',
        hint: 'Consider Ampère’s law and symmetry outside the coil.',
        connection: 'Electromagnetism & Ampère\'s Circuital Law'
      },
      {
        id: 3,
        subject: 'History',
        question: 'What institutional mechanism was the Roman Senate\'s "Senatus Consultum Ultimum"?',
        answer: 'It was an emergency decree passed by the Roman Senate in late republican crises that advised the consuls to take whatever measures necessary to defend the Republic, effectively suspending citizens\' legal rights to appeal capital punishment.',
        hint: 'An emergency power invoked in times of civil unrest.',
        connection: 'Late Roman Republican Constitutional Crises'
      },
      {
        id: 4,
        subject: 'Computer Science',
        question: 'Explain why Quicksort has an average time complexity of O(n log n) but a worst case of O(n²).',
        answer: 'On average, pivots partition arrays into balanced subproblems of roughly n/2 elements, leading to log n recursion depth. In the worst case (e.g. already sorted array with naive pivot selection), each partition produces an empty subarray and an n-1 subarray, yielding n levels of recursion and O(n²) operations.',
        hint: 'Examine recursion tree depth under balanced vs degenerate splits.',
        connection: 'Divide-and-Conquer Algorithm Analysis'
      },
      {
        id: 5,
        subject: 'Biology',
        question: 'What is the role of DNA ligase in lagging strand replication?',
        answer: 'DNA polymerase I removes RNA primers and synthesizes replacement DNA, but cannot form the final phosphodiester bond between the 3\'-OH of the new fragment and the 5\'-phosphate of the adjacent fragment. DNA ligase seals these nicks between Okazaki fragments.',
        hint: 'Think about Okazaki fragments and phosphodiester nicks.',
        connection: 'Molecular Genetics & DNA Replication Mechanics'
      },
      {
        id: 6,
        subject: 'Physics',
        question: 'What physical consequence follows from the Heisenberg Uncertainty Principle (Δx · Δp ≥ ℏ/2)?',
        answer: 'It means an entity\'s position and conjugate momentum cannot both be simultaneously determined with arbitrary precision. Fundamentally, particles behave as wave packets whose localization in space requires a broader superposition of momentum wavelengths.',
        hint: 'Wave-particle duality and Fourier transform spreads.',
        connection: 'Quantum Mechanics & Wave Mechanics'
      },
      {
        id: 7,
        subject: 'Computer Science',
        question: 'What problem does consistent hashing solve in distributed caching architectures?',
        answer: 'In traditional modular hashing (key % N), adding or removing a cache node invalidates almost 100% of cached keys. Consistent hashing maps keys and servers onto a circular ring, so that adding/removing a server only reassigns K/N keys without disturbing the rest.',
        hint: 'Think about what happens to key % N when the node count changes.',
        connection: 'Distributed Systems & Scalable Partitioning'
      },
      {
        id: 8,
        subject: 'History',
        question: 'How did the Columbian Exchange fundamentally alter Old World demography?',
        answer: 'The introduction of high-yield American staple crops (especially potatoes, maize, and cassava) provided calorically dense, drought-resilient nutrition that drastically reduced famine mortality across Europe, Africa, and Asia, spurring long-term demographic expansion.',
        hint: 'Focus on caloric density and agricultural resilience.',
        connection: 'Early Modern Global Trade & Agricultural Diffusion'
      }
    ];

    // Card state
    this.activeFilter = 'all';
    this.filteredCards = [...this.flashcards];
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
     3. ACTIVE RECALL FLASHCARDS (recall-deck.html)
     ------------------------------------------------------------------------ */
  initFlashcards() {
    const cardWrap = document.getElementById('flashcardWrap');
    const flipBtn = document.getElementById('flipCardBtn');
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    const addCardModalBtn = document.getElementById('addCardModalBtn');
    const closeCardModalBtn = document.getElementById('closeCardModalBtn');
    const cancelCardModalBtn = document.getElementById('cancelCardModalBtn');
    const newCardForm = document.getElementById('newCardForm');

    if (cardWrap) cardWrap.addEventListener('click', () => this.toggleCardFlip());
    if (flipBtn) flipBtn.addEventListener('click', () => this.toggleCardFlip());
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCard(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCard(1));

    // Subject Filters
    const filterPills = document.querySelectorAll('.pill-filter');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterCards(pill.getAttribute('data-filter'));
      });
    });

    // Modal
    const modal = document.getElementById('addCardModal');
    if (addCardModalBtn && modal) addCardModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    if (closeCardModalBtn && modal) closeCardModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelCardModalBtn && modal) cancelCardModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

    if (newCardForm) {
      newCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = document.getElementById('newCardSubject').value;
        const question = document.getElementById('newCardQuestion').value.trim();
        const answer = document.getElementById('newCardAnswer').value.trim();
        const hint = document.getElementById('newCardHint').value.trim() || 'Active breakdown required.';

        if (!question || !answer) return;

        this.flashcards.push({
          id: Date.now(),
          subject,
          question,
          answer,
          hint,
          connection: `${subject} Fundamentals`
        });

        this.filterCards(this.activeFilter);
        this.currentCardIndex = this.filteredCards.length - 1;
        this.renderCard();

        newCardForm.reset();
        modal.classList.add('hidden');
      });
    }

    // Keyboard Shortcuts
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
      }
    });

    this.renderCard();
  }

  toggleCardFlip() {
    this.isCardFlipped = !this.isCardFlipped;
    const cardWrap = document.getElementById('flashcardWrap');
    if (cardWrap) cardWrap.classList.toggle('flipped', this.isCardFlipped);
  }

  filterCards(category) {
    this.activeFilter = category;
    if (category === 'all') {
      this.filteredCards = [...this.flashcards];
    } else {
      this.filteredCards = this.flashcards.filter(c => c.subject.toLowerCase() === category.toLowerCase());
    }
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    const cardWrap = document.getElementById('flashcardWrap');
    if (cardWrap) cardWrap.classList.remove('flipped');
    this.renderCard();
  }

  navigateCard(direction) {
    if (this.filteredCards.length === 0) return;
    this.currentCardIndex = (this.currentCardIndex + direction + this.filteredCards.length) % this.filteredCards.length;
    this.isCardFlipped = false;
    const cardWrap = document.getElementById('flashcardWrap');
    if (cardWrap) cardWrap.classList.remove('flipped');
    this.renderCard();
  }

  renderCard() {
    const card = this.filteredCards[this.currentCardIndex];
    if (!card) return;

    const curIndexEl = document.getElementById('currentCardIndex');
    const totalCountEl = document.getElementById('totalCardsCount');
    const tagEl = document.getElementById('currentCardTag');
    const qEl = document.getElementById('cardQuestionText');
    const aEl = document.getElementById('cardAnswerText');
    const hintEl = document.getElementById('cardHintText');
    const refEl = document.getElementById('cardConceptRef');

    if (curIndexEl) curIndexEl.textContent = this.currentCardIndex + 1;
    if (totalCountEl) totalCountEl.textContent = this.filteredCards.length;
    if (tagEl) tagEl.textContent = card.subject;
    if (qEl) qEl.textContent = card.question;
    if (aEl) aEl.textContent = card.answer;
    if (hintEl) hintEl.textContent = `Hint: ${card.hint}`;
    if (refEl) refEl.textContent = `Core concept: ${card.connection}`;
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
