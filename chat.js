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

const myAvatar = document.getElementById('my-avatar');
const myUsernameData = document.getElementById('my-username');
const searchUsernameInput = document.getElementById('search-username');
const searchBtn = document.getElementById('search-btn');
const chatList = document.getElementById('chat-list');
const chatHeader = document.getElementById('chat-header');
const activeUserName = document.getElementById('active-user-name');
const activeUserAvatar = document.getElementById('active-user-avatar');
const messageDisplay = document.getElementById('message-display');
const inputArea = document.getElementById('input-area');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let currentUser = null;
let activeChatUserId = null;
let currentChatRoomId = null;

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                myAvatar.src = doc.data().photoURL;
                myUsernameData.innerText = `@${doc.data().username}`;
            }
        });
    } else { window.location.href = 'index.html'; }
});

searchBtn.addEventListener('click', () => {
    const searchName = searchUsernameInput.value.trim().toLowerCase();
    if (searchName === "") return;

    db.collection('users').where('username', '==', searchName).get().then((snapshot) => {
        chatList.innerHTML = "";
        if (snapshot.empty) { chatList.innerHTML = `<p class="error">නැත!</p>`; }
        else {
            snapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.uid === currentUser.uid) return;
                const userDiv = document.createElement('div');
                userDiv.className = 'chat-item';
                userDiv.innerHTML = `<img src="${userData.photoURL}" class="user-avatar"><div><h4>${userData.name}</h4><p>@${userData.username}</p></div>`;
                userDiv.addEventListener('click', () => startChat(userData));
                chatList.appendChild(userDiv);
            });
        }
    });
});

function startChat(targetUser) {
    activeChatUserId = targetUser.uid;
    activeUserName.innerText = targetUser.name;
    activeUserAvatar.src = targetUser.photoURL;
    chatHeader.classList.remove('hidden');
    inputArea.classList.remove('hidden');

    currentChatRoomId = currentUser.uid < targetUser.uid ? `${currentUser.uid}_${targetUser.uid}` : `${targetUser.uid}_${currentUser.uid}`;

    db.collection('chats').doc(currentChatRoomId).collection('messages').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
        messageDisplay.innerHTML = "";
        snapshot.forEach((doc) => {
            const msg = doc.data();
            const msgId = doc.id;
            const isMe = msg.senderId === currentUser.uid;
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isMe ? 'my-message' : 'other-message'}`;
            
            let msgText = msg.isDeleted ? `<i>🚫 Deleted</i>` : msg.text;
            if (msg.isEdited && !msg.isDeleted) msgText += ` <span class="edited-tag">(edited)</span>`;

            msgDiv.innerHTML = `<p>${msgText}</p>${isMe && !msg.isDeleted ? `<div class="msg-actions"><span onclick="editMessage('${msgId}', '${msg.text}')">✏️</span><span onclick="deleteMessage('${msgId}')">🗑️</span></div>` : ''}`;
            messageDisplay.appendChild(msgDiv);
        });
        messageDisplay.scrollTop = messageDisplay.scrollHeight;
    });
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text === "" || !currentChatRoomId) return;
    db.collection('chats').doc(currentChatRoomId).collection('messages').add({
        senderId: currentUser.uid, text: text, timestamp: firebase.firestore.FieldValue.serverTimestamp(), isDeleted: false, isEdited: false
    });
    messageInput.value = "";
}
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

window.deleteMessage = function(id) { if (confirm("Delete?")) db.collection('chats').doc(currentChatRoomId).collection('messages').doc(id).update({ isDeleted: true }); };
window.editMessage = function(id, old) { const txt = prompt("Edit:", old); if (txt) db.collection('chats').doc(currentChatRoomId).collection('messages').doc(id).update({ text: txt.trim(), isEdited: true }); };