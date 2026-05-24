const firebaseConfig = {
  apiKey: "AIzaSyDdOLW6RiKyrCWhk7hEvpNp0nVc9kIWYbM",
  authDomain: "l-m-chat.firebaseapp.com",
  projectId: "l-m-chat",
  storageBucket: "l-m-chat.firebasestorage.app",
  messagingSenderId: "918311571830",
  appId: "1:918311571830:web:19597d4bb5cb6e5794aa57"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const googleLoginBtn = document.getElementById('google-login-btn');
const authSection = document.getElementById('auth-section');
const usernameSection = document.getElementById('username-section');
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username-btn');
const errorMsg = document.getElementById('error-msg');

let currentUser = null;

googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        currentUser = result.user;
        checkUserInDatabase(currentUser);
    }).catch((err) => console.error(err));
});

function checkUserInDatabase(user) {
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            window.location.href = 'chat.html'; 
        } else {
            authSection.classList.add('hidden');
            usernameSection.classList.remove('hidden');
        }
    });
}

saveUsernameBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim().toLowerCase();
    if (username === "") { errorMsg.innerText = "නමක් ඇතුළත් කරන්න!"; return; }

    db.collection('users').where('username', '==', username).get().then((res) => {
        if (!res.empty) {
            errorMsg.innerText = "❌ මේ Username එක වෙන කෙනෙක් අරන්!";
        } else {
            db.collection('users').doc(currentUser.uid).set({
                uid: currentUser.uid,
                name: currentUser.displayName,
                email: currentUser.email,
                username: username,
                photoURL: currentUser.photoURL || 'https://via.placeholder.com/150'
            }).then(() => {
                window.location.href = 'chat.html';
            });
        }
    });
});