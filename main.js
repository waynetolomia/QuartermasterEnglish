import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWywUF8uuF_JDKj1HAlfXKZKbYzIFnB9I",
  authDomain: "quartermasterenglish.firebaseapp.com",
  projectId: "quartermasterenglish",
  storageBucket: "quartermasterenglish.firebasestorage.app",
  messagingSenderId: "1009051404430",
  appId: "1:1009051404430:web:5650cb1818bb66b1d061df",
  measurementId: "G-9ZYMWRD5YX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loginStudentIdInput = document.getElementById("login-student-id");
const loginPasswordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const authMessage = document.getElementById("auth-message");
const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const userNameSpan = document.getElementById("user-name");
const userRoleSpan = document.getElementById("user-role");

const loginView = document.getElementById("login-view");
const registerView = document.getElementById("register-view");
const showRegisterBtn = document.getElementById("show-register-btn");
const showLoginBtn = document.getElementById("show-login-btn");

const regNameInput = document.getElementById("reg-name");
const regStudentIdInput = document.getElementById("reg-student-id");
const regEmailInput = document.getElementById("reg-email");
const regPasswordInput = document.getElementById("reg-password");
const regConfirmPasswordInput = document.getElementById("reg-confirm-password");
const regDepartmentSelect = document.getElementById("reg-department");

const startDailyBtn = document.getElementById("start-daily-btn");
const dailyDropSection = document.getElementById("daily-drop-section");
const dailyVocabSection = document.getElementById("daily-vocab-section");
const gameSection = document.getElementById("game-section");

const adminDashboardSection = document.getElementById("admin-dashboard-section");
const adminStudentsTable = document.querySelector("#admin-students-table tbody");
const adminVocabTable = document.querySelector("#admin-vocab-table tbody");
const adminLogoutBtn = document.getElementById("admin-logout-btn");

const adminModeSelect = document.getElementById("admin-mode-select");
const adminSaveSettingsBtn = document.getElementById("admin-save-settings-btn");
const adminSettingsMsg = document.getElementById("admin-settings-msg");
const adminFilterDepartment = document.getElementById("admin-filter-department");
const adminFilterCategory = document.getElementById("admin-filter-category");
const adminFilterLevel = document.getElementById("admin-filter-level");

const adminEditModal = document.getElementById("admin-edit-modal");
const saveStudentBtn = document.getElementById("save-student-btn");
const cancelStudentBtn = document.getElementById("cancel-student-btn");

let currentUserData = null;
let dailyWords = [];
let allVocabsList = [];
let currentCardIndex = 0;
let currentQuizIndex = 0;
let quizScore = 0;
let currentAdminStudents = [];
let adminVocabs = [];
let adminSelectedWords = [];
let adminChartInstance = null;

// Department Mapping Definitions
const deptCategories = {
  DECK: ["Navigation", "Deck Operations", "Deck Machinery", "Maneuvering", "Ship Dynamics", "Stability", "Weather", "Directions", "Communication", "Safety"],
  ENGINE: ["Engine Room", "Ship Structure", "Stability"],
  LOGISTICS: ["Cargo Operations", "Operations", "Ship Spaces"]
};

// Calculate word XP value based on Level
function getWordXp(level) {
  if (level === "Master Level") return 30;
  if (level === "Officer Level") return 20;
  return 10; // Cadet Level defaults to 10 XP
}

// Calculate Maritime Rank based on total accumulated XP
function getStudentRank(xp, dept) {
  const isEngine = dept === "ENGINE";
  const isLogistics = dept === "LOGISTICS";
  
  if (xp < 300) return "Cadet";
  if (xp < 800) return isEngine ? "Wiper" : isLogistics ? "Tally Clerk" : "Ordinary Seaman";
  if (xp < 1500) return isEngine ? "Oiler" : isLogistics ? "Cargo Clerk" : "Able Seaman";
  if (xp < 2500) return isEngine ? "Motorman" : isLogistics ? "Cargo Supervisor" : "Bosun";
  if (xp < 4000) return isEngine ? "Third Engineer" : isLogistics ? "Assistant Purser" : "Third Officer";
  if (xp < 6000) return isEngine ? "Second Engineer" : isLogistics ? "Purser" : "Second Officer";
  if (xp < 10000) return isEngine ? "First Engineer" : isLogistics ? "Chief Purser" : "Chief Officer";
  return isEngine ? "Chief Engineer" : isLogistics ? "Supercargo" : "Master";
}

// Calculate specific font color based on Rank
function getRankColor(rank) {
  const colors = {
    "Cadet": "#94a3b8",          // Slate
    "Ordinary Seaman": "#3b82f6",// Blue
    "Wiper": "#3b82f6",
    "Tally Clerk": "#3b82f6",
    "Able Seaman": "#10b981",    // Green
    "Oiler": "#10b981",
    "Cargo Clerk": "#10b981",
    "Bosun": "#f59e0b",          // Amber
    "Motorman": "#f59e0b",
    "Cargo Supervisor": "#f59e0b",
    "Third Officer": "#8b5cf6",  // Purple
    "Third Engineer": "#8b5cf6",
    "Assistant Purser": "#8b5cf6",
    "Second Officer": "#ec4899", // Pink
    "Second Engineer": "#ec4899",
    "Purser": "#ec4899",
    "Chief Officer": "#ef4444",  // Red
    "First Engineer": "#ef4444",
    "Chief Purser": "#ef4444",
    "Master": "#eab308",         // Gold
    "Chief Engineer": "#eab308",
    "Supercargo": "#eab308"
  };
  return colors[rank] || "#cbd5e1";
}

showRegisterBtn.addEventListener("click", () => {
  loginView.classList.add("hidden");
  registerView.classList.remove("hidden");
  authMessage.textContent = "";
});

showLoginBtn.addEventListener("click", () => {
  registerView.classList.add("hidden");
  loginView.classList.remove("hidden");
  authMessage.textContent = "";
});

registerBtn.addEventListener("click", async () => {
  const studentId = regStudentIdInput.value.trim().toUpperCase();
  const name = regNameInput.value.trim();
  const email = regEmailInput.value.trim();
  const password = regPasswordInput.value;
  const confirmPassword = regConfirmPasswordInput.value;
  const department = regDepartmentSelect.value;

  if (!studentId || !name || !email || !password || !confirmPassword || !department) {
    authMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (password !== confirmPassword) {
    authMessage.textContent = "Passwords do not match.";
    return;
  }

  try {
    // Check if student ID already exists
    const userDoc = await getDoc(doc(db, "users", studentId));
    if (userDoc.exists()) {
      authMessage.textContent = "Student ID already registered. Please login.";
      return;
    }
    
    // Create profile in Firestore
    await setDoc(doc(db, "users", studentId), {
      name: name,
      email: email,
      password: password,
      studentId: studentId,
      department: department,
      role: "student",
      rank: "Cadet",
      streak: 0,
      weekId: 0,
      weeklySetsCompleted: 0,
      weeklyWords: [],
      lastPlayed: "",
      createdAt: new Date().toISOString()
    });
    
    authMessage.textContent = "Registration successful!";
    registerView.classList.add("hidden");
    loginView.classList.remove("hidden");
    loginStudentIdInput.value = studentId;
    loginPasswordInput.value = "";
  } catch (error) {
    authMessage.textContent = `Error: ${error.message}`;
  }
});

loginBtn.addEventListener("click", async () => {
  let studentId = loginStudentIdInput.value.trim().toUpperCase();
  let password = loginPasswordInput.value;

  if (!studentId || !password) {
    authMessage.textContent = "Please enter credentials.";
    return;
  }

  try {
    // Admin Test Account Interceptor
    if (studentId === "ADMIN") {
      if (password === "admin0701") {
        localStorage.setItem("quartermaster_user", "ADMIN");
        authMessage.textContent = "";
        loginPasswordInput.value = "";
        loadAdminDashboard();
      } else {
        authMessage.textContent = "Incorrect admin password.";
      }
      return;
    }

    // Quartermaster Test Account Interceptor (Student View)
    if (studentId === "QUARTERMASTER") {
      if (password === "admin0701") {
        let qmData = {
          name: "QM Tester",
          email: "qm@quartermaster.com",
          password: password,
          studentId: studentId,
          department: "DECK", // Sets them up to test the Deck vocab
          role: "student",
          rank: "Quartermaster",
          xp: 500,
          streak: 10,
          weekId: 0,
          weeklySetsCompleted: 0,
          weeklyWords: [],
          lastPlayed: "",
          createdAt: new Date().toISOString()
        };
        
        const qmDoc = await getDoc(doc(db, "users", studentId));
        if (!qmDoc.exists()) {
          await setDoc(doc(db, "users", studentId), qmData);
        } else {
          qmData = qmDoc.data();
        }
        
        localStorage.setItem("quartermaster_user", studentId);
        authMessage.textContent = "";
        loginPasswordInput.value = "";
        loadDashboard(qmData);
      } else {
        authMessage.textContent = "Incorrect quartermaster password.";
      }
      return;
    }

    const userDoc = await getDoc(doc(db, "users", studentId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.password === password) {
        localStorage.setItem("quartermaster_user", studentId);
        authMessage.textContent = "";
        loginPasswordInput.value = "";
        loadDashboard(userData);
      } else {
        authMessage.textContent = "Incorrect password.";
      }
    } else {
      authMessage.textContent = "Student ID not found.";
    }
  } catch (error) {
    authMessage.textContent = `Error: ${error.message}`;
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("quartermaster_user");
  window.location.reload();
});

adminLogoutBtn.addEventListener("click", () => {
  localStorage.removeItem("quartermaster_user");
  window.location.reload();
});

startDailyBtn.addEventListener("click", async () => {
  startDailyBtn.textContent = "Loading Challenge...";
  startDailyBtn.disabled = true;

  try {
    // 1. Fetch all vocabs if not already in memory
    if (allVocabsList.length === 0) {
      try {
        const response = await fetch('./maritime_vocab.json');
        if (!response.ok) throw new Error("Network response was not ok");
        allVocabsList = await response.json();
      } catch (err) {
        // Emergency fallback in case the local JSON file is missing or fails to load
        console.warn("⚠️ FAILED TO LOAD JSON! Using emergency fallback.", err);
        allVocabsList = [
          { term: "Starboard", definition: "The right-hand side of a vessel when facing forward.", category: "Navigation", example: "The buoy was on the starboard side.", thai_translation: "กราบขวา", thai_meaning: "ด้านขวาของเรือเมื่อหันหน้าไปทางหัวเรือ", level: "Cadet Level" },
          { term: "Port", definition: "The left-hand side of a vessel when facing forward.", category: "Navigation", example: "We will berth on the port side.", thai_translation: "กราบซ้าย", thai_meaning: "ด้านซ้ายของเรือเมื่อหันหน้าไปทางหัวเรือ", level: "Cadet Level" },
          { term: "Bow", definition: "The forward part of the hull of a ship.", category: "Ship Structure", example: "Waves crashed against the bow.", thai_translation: "หัวเรือ", thai_meaning: "ส่วนหน้าสุดของโครงสร้างเรือ", level: "Cadet Level" },
          { term: "Stern", definition: "The rear or aft-most part of a ship.", category: "Ship Structure", example: "The wake trailed behind the stern.", thai_translation: "ท้ายเรือ", thai_meaning: "ส่วนหลังสุดของเรือ", level: "Cadet Level" },
          { term: "Draft", definition: "The vertical distance between the waterline and the bottom of the hull.", category: "Stability", example: "The vessel's draft is deep.", thai_translation: "อัตรากินน้ำลึก", thai_meaning: "ระยะทางจากระดับน้ำถึงท้องเรือ", level: "Officer Level" },
          { term: "Main Engine", definition: "The primary propulsive machinery of the ship.", category: "Engine Room", example: "The main engine was started.", thai_translation: "เครื่องจักรใหญ่", thai_meaning: "เครื่องยนต์หลักขับเคลื่อนเรือ", level: "Cadet Level" },
          { term: "Purifier", definition: "A centrifuge used to remove water and impurities from oil.", category: "Engine Room", example: "Clean the heavy fuel oil purifier.", thai_translation: "เครื่องแยกสิ่งเจือปน", thai_meaning: "เครื่องปั่นแยกน้ำและสิ่งสกปรกออกจากน้ำมัน", level: "Officer Level" },
          { term: "Generator", definition: "A machine that converts mechanical energy into electricity.", category: "Engine Room", example: "Start the emergency generator.", thai_translation: "เครื่องกำเนิดไฟฟ้า", thai_meaning: "เครื่องยนต์สร้างกระแสไฟฟ้าในเรือ", level: "Cadet Level" },
          { term: "Boiler", definition: "A closed vessel in which water is heated to generate steam.", category: "Engine Room", example: "The boiler provides steam.", thai_translation: "หม้อต้มไอน้ำ", thai_meaning: "อุปกรณ์ผลิตไอน้ำใช้งานในเรือ", level: "Cadet Level" },
          { term: "Pump", definition: "A mechanical device used to move fluids.", category: "Engine Room", example: "Start the ballast pump.", thai_translation: "เครื่องสูบน้ำ", thai_meaning: "เครื่องจักรกลที่ใช้ดูดและส่งถ่ายของเหลว", level: "Cadet Level" },
          { term: "Cargo Hold", definition: "The space in a ship for storing cargo.", category: "Cargo Operations", example: "Grain was loaded into the cargo hold.", thai_translation: "ระวางสินค้า", thai_meaning: "พื้นที่บรรทุกสินค้าของเรือ", level: "Cadet Level" },
          { term: "Hatch", definition: "An opening in a ship's deck for access to a cargo hold.", category: "Cargo Operations", example: "Secure the hatch covers.", thai_translation: "ฝาระวาง", thai_meaning: "ช่องเปิดบนดาดฟ้าเรือ", level: "Cadet Level" },
          { term: "Stevedore", definition: "A person employed at a dock to load and unload ships.", category: "Cargo Operations", example: "The stevedores worked all night.", thai_translation: "คนงานขนถ่ายสินค้า", thai_meaning: "พนักงานท่าเรือขนถ่ายสินค้า", level: "Cadet Level" },
          { term: "Dunnage", definition: "Pieces of wood used to keep cargo securely in place.", category: "Cargo Operations", example: "Lay down proper dunnage.", thai_translation: "ไม้รองสินค้า", thai_meaning: "วัสดุรองกันกระแทกสินค้า", level: "Officer Level" },
          { term: "Lashing", definition: "Ropes, chains, or straps used to secure cargo.", category: "Cargo Operations", example: "Check the container lashings.", thai_translation: "การรัดสินค้า", thai_meaning: "การผูกรัดสินค้าให้แน่นหนา", level: "Officer Level" }
        ];
      }
    }

    // 2. Filter vocabs based on the current user's department
    const userDept = currentUserData.department ? currentUserData.department.toUpperCase() : "DECK";
    const categories = deptCategories[userDept] || deptCategories.DECK; // Default to DECK
    let filtered = allVocabsList.filter(w => categories.includes(w.category));
    
    if (filtered.length < 15) {
      filtered = [...allVocabsList]; // Removes strict restriction if department doesn't have enough words
    }

    // 2.5 Fetch global settings to check if admin assigned specific words
    const settingsDoc = await getDoc(doc(db, "settings", "training"));
    const settings = settingsDoc.exists() ? settingsDoc.data() : { mode: "random", selectedWords: [] };

    // 3. Get 3 random non-repeating words for the current set
    let weeklyWords = currentUserData.weeklyWords || [];
    
    // Check for broken repetition loops (if they only had 3 words generated previously)
    const uniqueWordsCheck = new Set(weeklyWords);
    
    // Generate 15 unique words if array is empty or got stuck with repeating data
    if (weeklyWords.length === 0 || uniqueWordsCheck.size < 15) {
      if (settings.mode === "specific" && settings.selectedWords && settings.selectedWords.length > 0) {
        // Use specific words chosen by the admin
        let pool = [...settings.selectedWords];
        while (pool.length < 15) {
          pool = pool.concat(settings.selectedWords);
        }
        weeklyWords = pool.slice(0, 15);
      } else {
        // Random mode - Shuffle the department pool and grab 15 words to cover the 5 weekly sets
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        let pool = [];
        while (pool.length < 15) {
          pool = pool.concat([...filtered].sort(() => 0.5 - Math.random()));
        }
        weeklyWords = pool.slice(0, 15).map(w => w.term);
      }
      
      // Save the generated sequence to Firestore to ensure no repeats for this week
      currentUserData.weeklyWords = weeklyWords;
      await updateDoc(doc(db, "users", currentUserData.studentId), { weeklyWords: weeklyWords });
    }

    const setsCompleted = currentUserData.weeklySetsCompleted || 0;
    const setStartIdx = setsCompleted * 3;
    
    // Map the terms from the weekly pool back to full vocabulary objects
    const currentSetTerms = weeklyWords.slice(setStartIdx, setStartIdx + 3);
    dailyWords = currentSetTerms.map(term => allVocabsList.find(w => w.term === term) || allVocabsList[0]);

    // 4. Render the new vocabulary challenge UI
    renderVocabChallenge();

  } catch (error) {
    console.error("Error starting vocabulary challenge:", error);
    startDailyBtn.textContent = "Error. Try Again.";
    startDailyBtn.disabled = false;
  }
});

function renderVocabChallenge() {
  dailyDropSection.classList.add("hidden");
  dailyVocabSection.classList.remove("hidden");
  gameSection.classList.add("hidden");
  const leaderboardSection = document.getElementById("student-leaderboard-section");
  if (leaderboardSection) leaderboardSection.classList.add("hidden");
  
  // Expand container to fit the game
  const container = document.querySelector('.container');
  container.style.maxWidth = '1200px';
  container.style.padding = window.innerWidth <= 480 ? '20px 10px' : '40px 20px';
  container.style.background = 'transparent';
  container.style.border = 'none';
  container.style.backdropFilter = 'none';
  container.style.boxShadow = 'none';
  
  const themeConfig = {
    DECK: { hex: '#00c6ff', shadow: 'rgba(0, 198, 255, 0.4)' },
    ENGINE: { hex: '#f97316', shadow: 'rgba(249, 115, 22, 0.4)' },
    LOGISTICS: { hex: '#14b8a6', shadow: 'rgba(20, 184, 166, 0.4)' }
  };
  const userDept = currentUserData.department ? currentUserData.department.toUpperCase() : "DECK";
  const theme = themeConfig[userDept] || themeConfig.DECK;

  const cardsHtml = dailyWords.map((word, index) => {
    const wordLevel = word.level || 'Cadet Level';
    const wordXp = getWordXp(wordLevel);
    const zIndex = dailyWords.length - index;
    
    // Using loremflickr for dynamic, keyword-based images as a reliable alternative. Adding a lock to get a consistent image.
    const imageUrl = `https://loremflickr.com/600/400/maritime,ship,${encodeURIComponent(word.term)}?lock=${index}`;

    return `
      <div class="swipe-card" data-index="${index}" style="z-index: ${zIndex}; border-color: ${theme.hex}; box-shadow: 0 0 20px ${theme.shadow};">
        <div class="swipe-indicators">
          <div class="swipe-left-indicator">REVIEW</div>
          <div class="swipe-right-indicator">GOT IT</div>
        </div>
        
        <div class="vocab-image-container" style="border-color: ${theme.hex};">
          <img src="${imageUrl}" alt="${word.term}" class="vocab-image" draggable="false"/>
        </div>
        
        <div class="card-content-wrapper">
          <div class="term-and-category">
            <h2 class="vocab-term">${word.term}</h2>
            <span class="vocab-category" style="color: ${theme.hex}; border-color: ${theme.hex};">${word.category}</span>
          </div>
          
          <div class="xp-and-audio">
            <div class="xp-badge">${wordLevel} • ${wordXp} XP</div>
            <button class="play-audio-btn secondary-btn" data-term="${word.term}" style="border-color: ${theme.hex}; color: ${theme.hex};">🔊</button>
          </div>

          <div class="vocab-def-container">
            <p class="vocab-def">${word.definition}</p>
            <p class="vocab-example">"${word.example}"</p>
            <div class="thai-translation-container">
              <p class="thai-translation">${word.thai_translation || ''}</p>
              <p class="thai-meaning">${word.thai_meaning || ''}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  dailyVocabSection.innerHTML = `
    <h3 style="text-align: center; color: #f8fafc; margin-bottom: 5px; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 15px ${theme.shadow};">
      Vocab Swipe
    </h3>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">
      Swipe Right if known • Left to Review
    </p>
    
    <div class="swipe-container">
      ${cardsHtml}
    </div>
    
    <div id="quiz-ready-container" class="hidden" style="text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 20px;">
      <h4 style="color: #34d399; font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Deck Mastered!</h4>
      <button id="next-card-btn" style="width: 100%; max-width: 350px; font-size: 16px; padding: 18px 30px; border-radius: 12px; text-transform: uppercase; letter-spacing: 2px; background: linear-gradient(135deg, ${theme.hex} 0%, #0072ff 100%); box-shadow: 0 4px 15px ${theme.shadow}; border: 1px solid ${theme.hex};">
        I'm Ready For Quiz
      </button>
    </div>

    <div style="text-align: center; width: 100%; display: flex; justify-content: center; margin-top: 20px;">
      <button id="back-to-profile-btn-vocab" class="secondary-btn" style="max-width: 200px; font-size: 14px; padding: 18px 30px; border-radius: 12px; border-color: #64748b; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">
        Back to Profile
      </button>
    </div>
  `;

  // Attach Audio Listener
  document.querySelectorAll('.play-audio-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop swipe from interfering
      const term = e.currentTarget.getAttribute('data-term');
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(term)}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.warn('Internet audio blocked or failed, falling back to local speech synthesis', err);
        const utterance = new SpeechSynthesisUtterance(term);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      });
    });
  });
  
  document.getElementById("back-to-profile-btn-vocab").addEventListener("click", () => {
    const container = document.querySelector('.container');
    container.style.maxWidth = '';
    container.style.padding = '';
    container.style.background = '';
    container.style.border = '';
    container.style.backdropFilter = '';
    container.style.boxShadow = '';
    loadDashboard(currentUserData);
  });

  const nextCardBtn = document.getElementById("next-card-btn");
  if(nextCardBtn) {
    nextCardBtn.addEventListener("click", () => {
      startQuizPhase();
    });
  }

  initSwipeLogic();
}

function initSwipeLogic() {
  const container = document.querySelector('.swipe-container');
  const quizReadyContainer = document.getElementById('quiz-ready-container');
  
  let activeCards = Array.from(document.querySelectorAll('.swipe-card'));
  
  function updateZIndices() {
    activeCards.forEach((card, i) => {
      card.style.zIndex = activeCards.length - i;
    });
  }
  
  updateZIndices();

  activeCards.forEach((card) => {
    let startX = 0, startY = 0, currentX = 0, currentY = 0;
    let isDragging = false;
    
    const leftIndicator = card.querySelector('.swipe-left-indicator');
    const rightIndicator = card.querySelector('.swipe-right-indicator');

    function dragStart(e) {
      if (activeCards[0] !== card) return; // Only allow dragging the front card
      if (e.target.tagName.toLowerCase() === 'button') return; // Exclude Audio button
      
      isDragging = true;
      startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
      card.style.transition = 'none';
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('mouseup', dragEnd);
      document.addEventListener('touchend', dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault(); 
      
      const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      const y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
      
      currentX = x - startX;
      currentY = y - startY;
      
      const rotate = currentX * 0.05;
      card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

      if (currentX > 0) {
        rightIndicator.style.opacity = Math.min(currentX / 100, 1);
        leftIndicator.style.opacity = 0;
      } else {
        leftIndicator.style.opacity = Math.min(Math.abs(currentX) / 100, 1);
        rightIndicator.style.opacity = 0;
      }
    }

    function dragEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('touchend', dragEnd);
      
      const threshold = window.innerWidth * 0.25;
      card.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
      
      if (currentX > threshold) {
        card.style.transform = `translate(${window.innerWidth}px, ${currentY}px) rotate(${currentX * 0.05}deg)`;
        card.style.opacity = '0';
        setTimeout(() => {
          card.style.display = 'none';
          activeCards.shift();
          if (activeCards.length === 0) {
            container.style.display = 'none';
            quizReadyContainer.classList.remove('hidden');
          }
        }, 400);
      } else if (currentX < -threshold) {
        card.style.transform = `translate(-${window.innerWidth}px, ${currentY}px) rotate(${currentX * 0.05}deg)`;
        card.style.opacity = '0';
        setTimeout(() => {
          card.style.transition = 'none';
          card.style.transform = 'translate(0px, 0px) rotate(0deg)';
          card.style.opacity = '1';
          leftIndicator.style.opacity = 0;
          rightIndicator.style.opacity = 0;
          
          activeCards.shift();
          activeCards.push(card);
          updateZIndices();
        }, 400);
      } else {
        card.style.transform = 'translate(0px, 0px) rotate(0deg)';
        leftIndicator.style.opacity = 0;
        rightIndicator.style.opacity = 0;
      }
    }

    card.addEventListener('mousedown', dragStart);
    card.addEventListener('touchstart', dragStart, { passive: false });
  });
}

function startQuizPhase() {
  dailyVocabSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  const leaderboardSection = document.getElementById("student-leaderboard-section");
  if (leaderboardSection) leaderboardSection.classList.add("hidden");

  // Keep container expanded for the match phase
  const container = document.querySelector('.container');
  container.style.maxWidth = '1000px';
  container.style.padding = window.innerWidth <= 480 ? '20px 10px' : '40px 20px';
  container.style.background = 'transparent';
  container.style.border = 'none';
  container.style.backdropFilter = 'none';
  container.style.boxShadow = 'none';

  const themeConfig = {
    DECK: { hex: '#00c6ff', shadow: 'rgba(0, 198, 255, 0.4)' },
    ENGINE: { hex: '#f97316', shadow: 'rgba(249, 115, 22, 0.4)' },
    LOGISTICS: { hex: '#14b8a6', shadow: 'rgba(20, 184, 166, 0.4)' }
  };
  const userDept = currentUserData.department ? currentUserData.department.toUpperCase() : "DECK";
  const theme = themeConfig[userDept] || themeConfig.DECK;

  let selectedTerm = null;
  let matchedCount = 0;
  
  const terms = [...dailyWords].sort(() => 0.5 - Math.random());
  const defs = [...dailyWords].sort(() => 0.5 - Math.random());
  let potentialXp = dailyWords.reduce((sum, word) => sum + getWordXp(word.level || "Cadet Level"), 0);

  gameSection.innerHTML = `
    <h3 style="text-align: center; color: #f8fafc; margin-bottom: 10px; font-size: 32px; text-transform: uppercase; letter-spacing: 3px; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 15px ${theme.shadow};">
      Knowledge Check
    </h3>
    <p style="text-align: center; color: #94a3b8; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; font-size: 13px;">
      Tap or drag the correct term into its sentence
    </p>

    <!-- Draggable Terms -->
    <div id="terms-container" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 40px;">
      ${terms.map(w => `
        <div data-term="${w.term}" draggable="true" class="term-card" style="padding: 12px 24px; border-radius: 12px; border: 2px solid #334155; background: #0f172a; color: #e2e8f0; font-weight: bold; cursor: grab; user-select: none; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px;">
          ${w.term}
        </div>
      `).join('')}
    </div>

    <!-- Drop Zones -->
    <div id="defs-container" style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 800px; margin: 0 auto;">
      ${defs.map(w => {
        const safeTerm = w.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const blankedExample = w.example ? w.example.replace(new RegExp(safeTerm, 'gi'), '_____') : '_____';
        return `
          <div data-match="${w.term}" class="def-card" style="background: rgba(15, 23, 42, 0.6); border: 2px dashed #334155; border-radius: 16px; padding: 20px; transition: all 0.3s; cursor: pointer;">
            <div style="background: #0b1121; padding: 20px; border-radius: 8px; border: 1px solid #1e293b; text-align: center;">
              <p class="sentence-text" style="color: #cbd5e1; font-style: italic; margin: 0; font-size: 16px; line-height: 1.6;">"${blankedExample}"</p>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Return Actions -->
    <div id="quiz-actions" style="text-align: center; margin-top: 40px;">
      <button id="back-to-profile-btn-quiz" class="secondary-btn" style="max-width: 250px; font-size: 14px; padding: 14px 24px; border-radius: 12px; border-color: #64748b; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">
        Back to Profile
      </button>
    </div>

    <!-- Completion Footer -->
    <div id="match-complete-footer" class="hidden" style="text-align: center; margin-top: 40px; animation: fadeIn 0.5s;">
       <div style="font-size: 48px; margin-bottom: 15px;">⭐⭐⭐</div>
       <div class="xp-earned-text" style="color: #34d399; font-weight: 900; font-size: 24px; letter-spacing: 2px; text-shadow: 0 0 15px rgba(52,211,153,0.8); margin-bottom: 25px;">+0 XP EARNED</div>
       <button id="return-to-dash-btn" style="max-width: 300px; margin: 0 auto; background: linear-gradient(135deg, ${theme.hex} 0%, #0072ff 100%);">Return to Dashboard</button>
    </div>
  `;

  // Event Listeners
  const termCards = document.querySelectorAll('.term-card');
  const defCards = document.querySelectorAll('.def-card');

  async function handleMatch(card, term) {
    if (card.classList.contains('matched')) return;
    const targetTerm = card.getAttribute('data-match');
    
    if (term === targetTerm) {
      // Correct Match
      card.classList.add('matched');
      card.style.borderStyle = 'solid';
      card.style.borderColor = theme.hex;
      card.style.boxShadow = `0 0 15px ${theme.shadow}`;
      card.style.background = 'rgba(15, 23, 42, 0.9)';
      
      const sentenceEl = card.querySelector('.sentence-text');
      sentenceEl.innerHTML = sentenceEl.innerHTML.replace('_____', `<span style="color: ${theme.hex}; font-weight: bold; text-decoration: underline;">${term}</span>`);

      const tCard = document.querySelector(`.term-card[data-term="${term}"]`);
      if (tCard) {
        tCard.style.opacity = '0';
        tCard.style.pointerEvents = 'none';
        tCard.style.transform = 'scale(0.8)';
      }
      
      selectedTerm = null;
      matchedCount++;

      if (matchedCount === 3) {
        document.getElementById('quiz-actions').classList.add('hidden');
        const footer = document.getElementById('match-complete-footer');
        footer.querySelector('.xp-earned-text').textContent = `+${potentialXp} XP EARNED`;
        footer.classList.remove('hidden');
        
        currentUserData.weeklySetsCompleted = (currentUserData.weeklySetsCompleted || 0) + 1;
        currentUserData.xp = (currentUserData.xp || 0) + potentialXp;
        
        try {
          const userRef = doc(db, "users", currentUserData.studentId);
          await updateDoc(userRef, { 
            xp: increment(potentialXp),
            weeklySetsCompleted: currentUserData.weeklySetsCompleted
          });
        } catch (error) {
          console.error("Error updating XP:", error);
        }
        
        document.getElementById('return-to-dash-btn').addEventListener('click', () => {
          container.style.maxWidth = '';
          container.style.padding = '';
          container.style.background = '';
          container.style.border = '';
          container.style.backdropFilter = '';
          container.style.boxShadow = '';
          
          loadDashboard(currentUserData);
        });
      }
    } else {
      // Wrong Match Penalty
      potentialXp = Math.max(0, potentialXp - 5);
      
      card.style.borderColor = '#ef4444';
      card.style.background = 'rgba(239, 68, 68, 0.1)';
      card.style.transform = 'translateX(10px)';
      setTimeout(() => {
        card.style.transform = 'translateX(-10px)';
        setTimeout(() => {
          card.style.transform = 'translateX(0)';
          card.style.borderColor = '#334155';
          card.style.background = 'rgba(15, 23, 42, 0.6)';
        }, 150);
      }, 150);
    }
  }

  termCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.style.opacity === '0') return; 
      termCards.forEach(c => {
        c.style.borderColor = '#334155';
        c.style.background = '#0f172a';
      });
      card.style.borderColor = theme.hex;
      card.style.background = 'rgba(0, 198, 255, 0.1)';
      selectedTerm = card.getAttribute('data-term');
    });
    
    card.addEventListener('dragstart', (e) => {
      if (card.style.opacity === '0') return e.preventDefault();
      e.dataTransfer.setData('text/plain', card.getAttribute('data-term'));
      card.style.opacity = '0.5';
      selectedTerm = card.getAttribute('data-term');
    });
    
    card.addEventListener('dragend', () => {
      if (card.style.opacity !== '0') card.style.opacity = '1';
    });
  });

  defCards.forEach(card => {
    card.addEventListener('click', () => {
      if (selectedTerm) handleMatch(card, selectedTerm);
    });
    
    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (!card.classList.contains('matched')) {
        card.style.background = 'rgba(255, 255, 255, 0.05)';
      }
    });
    card.addEventListener('dragleave', () => {
      if (!card.classList.contains('matched')) {
        card.style.background = 'rgba(15, 23, 42, 0.6)';
      }
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      if (!card.classList.contains('matched')) {
         card.style.background = 'rgba(15, 23, 42, 0.6)';
      }
      const draggedTerm = e.dataTransfer.getData('text/plain');
      if (draggedTerm) handleMatch(card, draggedTerm);
    });
  });

  document.getElementById("back-to-profile-btn-quiz").addEventListener("click", () => {
    const container = document.querySelector('.container');
    container.style.maxWidth = '';
    container.style.padding = '';
    container.style.background = '';
    container.style.border = '';
    container.style.backdropFilter = '';
    container.style.boxShadow = '';
    loadDashboard(currentUserData);
  });
}

function getVocabDepartments(category) {
  const depts = [];
  if (deptCategories.DECK.includes(category)) depts.push("DECK");
  if (deptCategories.ENGINE.includes(category)) depts.push("ENGINE");
  if (deptCategories.LOGISTICS.includes(category)) depts.push("LOGISTICS");
  return depts.length ? depts.join(", ") : "ALL";
}

function renderAdminVocabTable() {
  if (!adminVocabTable) return;
  
  const deptFilter = adminFilterDepartment.value;
  const catFilter = adminFilterCategory.value;
  const lvlFilter = adminFilterLevel.value;
  
  const filtered = adminVocabs.filter(v => {
    const matchCat = catFilter === "ALL" || v.category === catFilter;
    const matchLvl = lvlFilter === "ALL" || v.level === lvlFilter;
    
    let matchDept = true;
    if (deptFilter !== "ALL") {
      const allowedCategories = deptCategories[deptFilter] || [];
      matchDept = allowedCategories.includes(v.category);
    }
    
    return matchCat && matchLvl && matchDept;
  });

  adminVocabTable.innerHTML = "";
  
  if (filtered.length === 0) {
    adminVocabTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">No vocabulary found. Adjust filters or populate the database.</td></tr>`;
    return;
  }

  filtered.forEach(v => {
    const isChecked = adminSelectedWords.includes(v.term);
    const depts = getVocabDepartments(v.category);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="vocab-checkbox" data-term="${v.term}" ${isChecked ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer; accent-color: #00c6ff;">
      </td>
      <td><strong>${v.term}</strong></td>
      <td><span style="font-size: 10px; color: #00c6ff; font-weight: bold; letter-spacing: 1px;">${depts}</span></td>
      <td><span class="vocab-category">${v.category || 'N/A'}</span></td>
      <td><span style="color: #f59e0b; font-size: 11px; text-transform: uppercase; font-weight: bold;">${v.level || 'Cadet Level'}</span></td>
      <td style="white-space: normal; min-width: 250px;">
        ${v.definition}
        <div class="text-amber-400 font-bold mt-1">${v.thai_translation || ''}</div>
        <div class="text-gray-400 text-xs">${v.thai_meaning || ''}</div>
      </td>
    `;
    adminVocabTable.appendChild(tr);
  });

  // Add event listeners to newly rendered checkboxes
  document.querySelectorAll(".vocab-checkbox").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const term = e.target.getAttribute("data-term");
      if (e.target.checked) {
        if (!adminSelectedWords.includes(term)) adminSelectedWords.push(term);
      } else {
        adminSelectedWords = adminSelectedWords.filter(t => t !== term);
      }
    });
  });
}

if (adminSaveSettingsBtn) {
  adminSaveSettingsBtn.addEventListener("click", async () => {
    adminSaveSettingsBtn.textContent = "Saving...";
    try {
      await setDoc(doc(db, "settings", "training"), {
        mode: adminModeSelect.value,
        selectedWords: adminSelectedWords
      });
      adminSettingsMsg.textContent = "Settings saved successfully!";
      adminSettingsMsg.style.color = "#10b981";
      setTimeout(() => adminSettingsMsg.textContent = "", 3000);
    } catch (e) {
      adminSettingsMsg.textContent = "Error saving settings: " + e.message;
      adminSettingsMsg.style.color = "#ef4444";
    }
    adminSaveSettingsBtn.textContent = "Save Settings";
  });
}

if (adminFilterDepartment) adminFilterDepartment.addEventListener("change", renderAdminVocabTable);
if (adminFilterCategory) adminFilterCategory.addEventListener("change", renderAdminVocabTable);
if (adminFilterLevel) adminFilterLevel.addEventListener("change", renderAdminVocabTable);

function renderAdminStudentsTable() {
  currentAdminStudents.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  adminStudentsTable.innerHTML = "";
  
  currentAdminStudents.forEach((s, index) => {
    const tr = document.createElement("tr");
    const rankStr = getStudentRank(s.xp || 0, s.department);
    const rankColor = getRankColor(rankStr);
    tr.innerHTML = `
      <td>#${index + 1}</td>
      <td>${s.name}</td>
      <td>${s.studentId}</td>
      <td><span style="color: ${rankColor}; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${rankStr}</span></td>
      <td>${s.department}</td>
      <td>${s.xp || 0} XP</td>
      <td>
        <button class="edit-student-btn" data-id="${s.studentId}" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0 5px 0 0; background: #f59e0b; box-shadow: none;">Edit</button>
        <button class="delete-student-btn" data-id="${s.studentId}" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #ef4444; box-shadow: none;">Del</button>
      </td>
    `;
    adminStudentsTable.appendChild(tr);
  });

  document.querySelectorAll('.edit-student-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const studentId = e.target.getAttribute('data-id');
      const student = currentAdminStudents.find(s => s.studentId === studentId);
      if (!student) return;
      
      document.getElementById("edit-student-id-hidden").value = student.studentId;
      document.getElementById("edit-student-name").value = student.name;
      document.getElementById("edit-student-dept").value = student.department;
      document.getElementById("edit-student-xp").value = student.xp || 0;
      
      adminEditModal.classList.remove("hidden");
    });
  });

  document.querySelectorAll('.delete-student-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const studentId = e.target.getAttribute('data-id');
      if (confirm(`Are you sure you want to permanently delete student ${studentId}?`)) {
        try {
          await deleteDoc(doc(db, "users", studentId));
          currentAdminStudents = currentAdminStudents.filter(s => s.studentId !== studentId);
          renderAdminStudentsTable();
          renderAdminWeeklyTable();
        } catch(err) {
          alert("Error deleting student: " + err.message);
        }
      }
    });
  });
}

if (cancelStudentBtn) {
  cancelStudentBtn.addEventListener("click", () => {
    adminEditModal.classList.add("hidden");
  });
}

if (saveStudentBtn) {
  saveStudentBtn.addEventListener("click", async () => {
    const studentId = document.getElementById("edit-student-id-hidden").value;
    const newName = document.getElementById("edit-student-name").value.trim();
    const newDept = document.getElementById("edit-student-dept").value;
    const newXp = parseInt(document.getElementById("edit-student-xp").value, 10) || 0;
    
    try {
      saveStudentBtn.textContent = "Saving...";
      await updateDoc(doc(db, "users", studentId), {
        name: newName,
        department: newDept,
        xp: newXp
      });
      
      const studentIndex = currentAdminStudents.findIndex(s => s.studentId === studentId);
      if (studentIndex > -1) {
        currentAdminStudents[studentIndex].name = newName;
        currentAdminStudents[studentIndex].department = newDept;
        currentAdminStudents[studentIndex].xp = newXp;
      }
      
      renderAdminStudentsTable();
      adminEditModal.classList.add("hidden");
    } catch(err) {
      alert("Error updating student: " + err.message);
    } finally {
      saveStudentBtn.textContent = "Save Changes";
    }
  });
}

function renderAdminWeeklyTable() {
  const weeklyCounts = {};
  currentAdminStudents.forEach(s => {
    if (s.weeklyWords && Array.isArray(s.weeklyWords)) {
      s.weeklyWords.forEach(term => {
        weeklyCounts[term] = (weeklyCounts[term] || 0) + 1;
      });
    }
  });

  const adminWeeklyTable = document.querySelector("#admin-weekly-table tbody");
  if (!adminWeeklyTable) return;
  
  adminWeeklyTable.innerHTML = "";
  const sortedWeeklyWords = Object.keys(weeklyCounts).sort((a, b) => weeklyCounts[b] - weeklyCounts[a]);
  
  if (sortedWeeklyWords.length === 0) {
    adminWeeklyTable.innerHTML = "<tr><td colspan='3' style='text-align:center;'>No weekly sets assigned yet.</td></tr>";
  } else {
    sortedWeeklyWords.forEach(term => {
      const vocabObj = adminVocabs.find(v => v.term === term) || { category: "Unknown" };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${term}</strong></td>
        <td><span class="vocab-category">${vocabObj.category}</span></td>
        <td><span class="text-amber-400 font-bold">${weeklyCounts[term]} Students</span></td>
      `;
      adminWeeklyTable.appendChild(tr);
    });
  }
}

async function loadAdminDashboard() {
  authSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  adminDashboardSection.classList.remove("hidden");
  document.querySelector(".container").classList.add("admin-mode");
  
  // 1. Fetch Students
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let students = [];
    usersSnap.forEach(doc => {
      if (doc.data().role === "student") students.push(doc.data());
    });
    currentAdminStudents = students;
    renderAdminStudentsTable();
  } catch (err) { console.error("Error fetching students:", err); }

  // 2. Fetch Settings
  try {
    const settingsDoc = await getDoc(doc(db, "settings", "training"));
    const settings = settingsDoc.exists() ? settingsDoc.data() : { mode: "random", selectedWords: [] };
    adminModeSelect.value = settings.mode || "random";
    adminSelectedWords = settings.selectedWords || [];
  } catch (err) { console.error("Error fetching settings:", err); }

  // 3. Fetch Vocabularies
  try {
    const response = await fetch('./maritime_vocab.json');
    if (!response.ok) throw new Error("Failed to load local JSON");
    adminVocabs = await response.json();
    
    // Populate Categories Dropdown dynamically
    const categories = [...new Set(adminVocabs.map(v => v.category).filter(Boolean))].sort();
    adminFilterCategory.innerHTML = '<option value="ALL">All Categories</option>';
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      adminFilterCategory.appendChild(opt);
    });
    
    renderAdminVocabTable();
  } catch (err) { console.error("Error fetching vocabs:", err); }

  // 4. Render Weekly Statistics
  try {
    renderAdminWeeklyTable();
  } catch (err) { console.error("Error rendering weekly table:", err); }

  // 5. Render Chart
  try {
    const filterEl = document.getElementById("admin-chart-filter");
    if (filterEl) {
      renderAdminChart(filterEl.value);
      filterEl.onchange = (e) => renderAdminChart(e.target.value);
    }
  } catch (err) { console.error("Error rendering chart:", err); }
}

function renderAdminChart(filterType) {
  const ctx = document.getElementById("adminPieChart");
  if (!ctx) return;
  
  if (adminChartInstance) {
    adminChartInstance.destroy();
  }
  
  const counts = {};
  currentAdminStudents.forEach(s => {
    const key = s[filterType] || "Unassigned";
    counts[key] = (counts[key] || 0) + 1;
  });
  
  adminChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#00c6ff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'],
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverOffset: 5
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { family: "'Poppins', sans-serif" } } } } }
  });
}

async function loadStudentLeaderboard() {
  const leaderboardTable = document.querySelector("#student-leaderboard-table tbody");
  if (!leaderboardTable) return;
  
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let students = [];
    usersSnap.forEach(doc => {
      if (doc.data().role === "student") students.push(doc.data());
    });
    
    // Sort by XP descending
    students.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    leaderboardTable.innerHTML = "";
    students.forEach((s, index) => {
      const tr = document.createElement("tr");
      // Highlight the current user in the leaderboard
      if (currentUserData && s.studentId === currentUserData.studentId) {
        tr.style.backgroundColor = "rgba(0, 198, 255, 0.15)";
      }
      const studentRank = getStudentRank(s.xp || 0, s.department);
      const rankColor = getRankColor(studentRank);
      tr.innerHTML = `
        <td>#${index + 1}</td>
        <td>${s.name} ${currentUserData && s.studentId === currentUserData.studentId ? "(You)" : ""}</td>
        <td><span style="color: ${rankColor}; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${studentRank}</span></td>
        <td><span style="font-size: 10px; color: #00c6ff; font-weight: bold; letter-spacing: 1px;">${s.department || "N/A"}</span></td>
        <td><span style="color: #f59e0b; font-weight: bold;">${s.xp || 0} XP</span></td>
      `;
      leaderboardTable.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    leaderboardTable.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Failed to load leaderboard.</td></tr>`;
  }
}

function loadDashboard(userData) {
  // Get a unique Week ID based on the most recent Monday UTC
  const currentWeekId = Math.floor((Math.floor(Date.now() / 86400000) - 4) / 7);
  
  // Weekly reset check
  if (userData.weekId !== currentWeekId) {
    userData.weekId = currentWeekId;
    userData.weeklySetsCompleted = 0;
    userData.weeklyWords = []; // Clear last week's words
    updateDoc(doc(db, "users", userData.studentId), {
      weekId: currentWeekId,
      weeklySetsCompleted: 0,
      weeklyWords: []
    }).catch(e => console.error("Error resetting week:", e));
  }
  
  // Check and promote rank based on accumulated XP
  const calculatedRank = getStudentRank(userData.xp || 0, userData.department);
  if (userData.rank !== calculatedRank) {
    userData.rank = calculatedRank;
    // Background update to sync the promotion back to the database
    updateDoc(doc(db, "users", userData.studentId), { rank: calculatedRank }).catch(e => console.error(e));
  }

  currentUserData = userData;
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  document.querySelector(".container").classList.remove("admin-mode");
  
  userNameSpan.textContent = userData.name;
  userRoleSpan.textContent = userData.role;

  document.getElementById("user-department").textContent = userData.department || "DECK";
  document.getElementById("user-rank").textContent = userData.rank || "Deckhand";
  document.getElementById("user-streak").textContent = `${userData.streak || 0} Days`;
  document.getElementById("user-xp").textContent = userData.xp || 0;
  
  dailyDropSection.classList.remove("hidden");
  dailyVocabSection.classList.add("hidden");
  gameSection.classList.add("hidden");
  const leaderboardSection = document.getElementById("student-leaderboard-section");
  if (leaderboardSection) leaderboardSection.classList.remove("hidden");

  if (userData.weeklySetsCompleted >= 5) {
    startDailyBtn.textContent = "Weekly Training Complete";
    startDailyBtn.disabled = true;
    startDailyBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    startDailyBtn.textContent = `Start Set ${userData.weeklySetsCompleted + 1} of 5`;
    startDailyBtn.disabled = false;
    startDailyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  if (userData.role === "admin") {
    console.log("Admin account detected.");
  }
  
  loadStudentLeaderboard();
}

// Check if user is already logged in on page load
window.addEventListener("DOMContentLoaded", async () => {
  const savedStudentId = localStorage.getItem("quartermaster_user");
  if (savedStudentId) {
    if (savedStudentId === "ADMIN") {
      loadAdminDashboard();
    } else {
      try {
        const userDoc = await getDoc(doc(db, "users", savedStudentId));
        if (userDoc.exists()) {
          loadDashboard(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data on load:", error);
      }
    }
  }
});