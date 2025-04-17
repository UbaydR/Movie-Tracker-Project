import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import firebaseConfig from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default app;

// Function to display messages to the user
function showMessage(message, elementId) {
    // Create message element if it doesn't exist
    let messageElement = document.getElementById(elementId);
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = elementId;
        messageElement.style.padding = '10px';
        messageElement.style.marginTop = '10px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.textAlign = 'center';
        
        // Insert after the login form
        const loginForm = document.querySelector('form');
        if (loginForm) {
            loginForm.parentNode.insertBefore(messageElement, loginForm.nextSibling);
        }
    }
    
    // Set message content and style
    messageElement.textContent = message;
    messageElement.style.backgroundColor = message.includes('error') ? '#ffdddd' : '#ddffdd';
    messageElement.style.color = message.includes('error') ? '#990000' : '#006600';
}
