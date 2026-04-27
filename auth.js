import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
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
const regDepartmentSelect = document.getElementById("reg-department");

const startDailyBtn = document.getElementById("start-daily-btn");
const dailyDropSection = document.getElementById("daily-drop-section");
const dailyVocabSection = document.getElementById("daily-vocab-section");

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
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, regEmailInput.value, regPasswordInput.value);
    const user = userCredential.user;
    
    // Create a user profile in Firestore with a default 'student' role
    await setDoc(doc(db, "users", user.uid), {
      email: regEmailInput.value,
      name: regNameInput.value,
      studentId: regStudentIdInput.value,
      department: regDepartmentSelect.value,
      role: "student",
      rank: "Deckhand",
      xp: 0,
      streak: 0,
      createdAt: new Date()
    });
    
    authMessage.textContent = "Registration successful!";
    registerView.classList.add("hidden");
    loginView.classList.remove("hidden");
    emailInput.value = regEmailInput.value;
    passwordInput.value = "";
  } catch (error) {
    authMessage.textContent = `Error: ${error.message}`;
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    let loginEmail = emailInput.value.trim();
    
    // Admin Test Account Interceptor
    if (loginEmail.toLowerCase() === "admin" && passwordInput.value === "admin0701") {
      loginEmail = "admin@quartermaster.com";
      
      // Auto-provision the test admin account in Firestore if it doesn't exist yet
      try {
        const userCred = await createUserWithEmailAndPassword(auth, loginEmail, passwordInput.value);
        await setDoc(doc(db, "users", userCred.user.uid), {
          email: loginEmail,
          name: "Admin Tester",
          studentId: "ADMIN-001",
          department: "COMMAND",
          role: "admin",
          rank: "Quartermaster",
          xp: 9999,
          streak: 365,
          createdAt: new Date()
        });
      } catch (e) {
        // Ignore creation error if the admin account is already set up
      }
    }

    await signInWithEmailAndPassword(auth, loginEmail, passwordInput.value);
    authMessage.textContent = "";
  } catch (error) {
    authMessage.textContent = `Error: ${error.message}`;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

startDailyBtn.addEventListener("click", async () => {
  startDailyBtn.textContent = "Loading...";
  startDailyBtn.disabled = true;

  try {
    const vocabRef = collection(db, "vocabulary_master");
    const snapshot = await getDocs(vocabRef);
    const allVocabs = [];
    snapshot.forEach(doc => allVocabs.push(doc.data()));

    // Shuffle and pick 3 random words
    const shuffled = allVocabs.sort(() => 0.5 - Math.random());
    const daily3 = shuffled.slice(0, 3);

    dailyVocabSection.innerHTML = ""; // Clear any previous content
    
    daily3.forEach(vocab => {
      const card = document.createElement("div");
      card.className = "vocab-card";
      card.innerHTML = `
        <div class="vocab-category">${vocab.category || 'General'}</div>
        <h4 class="vocab-term">${vocab.term}</h4>
        <p class="vocab-def">${vocab.definition}</p>
        <p class="vocab-example">"${vocab.example}"</p>
      `;
      dailyVocabSection.appendChild(card);
    });

    dailyDropSection.classList.add("hidden");
    dailyVocabSection.classList.remove("hidden");
  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    startDailyBtn.textContent = "Error. Try Again.";
    startDailyBtn.disabled = false;
  }
});

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is logged in
    authSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    
    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userNameSpan.textContent = userData.name || user.email;
      userRoleSpan.textContent = userData.role;

      document.getElementById("user-department").textContent = userData.department || "DECK";
      document.getElementById("user-rank").textContent = userData.rank || "Deckhand";
      document.getElementById("user-streak").textContent = `${userData.streak || 0} Days`;
      document.getElementById("user-xp").textContent = userData.xp || 0;
      
      // Reset Daily UI states
      dailyDropSection.classList.remove("hidden");
      dailyVocabSection.classList.add("hidden");
      startDailyBtn.textContent = "Start Daily 3";
      startDailyBtn.disabled = false;

      if (userData.role === "admin") {
        // Future implementation: Reveal admin tools/UI here
        console.log("Admin account detected.");
      }
    } else {
      userNameSpan.textContent = user.email;
    }
  } else {
    // User is logged out
    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    emailInput.value = "";
    passwordInput.value = "";
    loginView.classList.remove("hidden");
    registerView.classList.add("hidden");
  }
});