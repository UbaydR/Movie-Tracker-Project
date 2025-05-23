 // Import the functions you need from the SDKs you need
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

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Get form values
            const emailInput = document.getElementById('username') || document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (!emailInput || !passwordInput) {
                console.error('Email or password input not found');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Validate inputs
            if (!email || !password) {
                showMessage('Please enter both email and password', 'authMessage');
                return;
            }
            
            // Hardcoded credentials check for "bob" / "bobpass"
            if (email === "bob" && password === "bobpass") {
                // Special hardcoded login success!
                showMessage('Login successful!', 'authMessage');
                
                // Set a special user ID for bob
                const bobUserId = "hardcoded_bob_user";
                localStorage.setItem('loggedInUserId', bobUserId);
                localStorage.setItem('username', 'bob');
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
                return; // Skip the regular authentication flow
            }
            
            // Always create a new user with the entered credentials
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Account created successfully
                    const user = userCredential.user;
                    
                    // Store user data in Firestore with unique document ID
                    const userData = {
                        email: email,
                        timestamp: new Date().getTime(),
                        movies: {
                            liked: [],
                            watchlist: [],
                            watched: []
                        }
                    };
                    
                    // Use the user's UID as the document ID to ensure consistency
                    setDoc(doc(db, "users", user.uid), userData)
                        .then(() => {
                            showMessage('Account created and logged in successfully!', 'authMessage');
                            localStorage.setItem('loggedInUserId', user.uid);
                            localStorage.setItem('userEmail', email);
                            
                            // Redirect after a short delay
                            setTimeout(() => {
                                window.location.href = 'index.html';
                            }, 1000);
                        })
                        .catch((error) => {
                            console.error("Error writing document:", error);
                            showMessage('Account created but failed to save user data', 'authMessage');
                        });
                })
                .catch((error) => {
                    // If user already exists, try to sign in
                    if (error.code === 'auth/email-already-in-use') {
                        signInWithEmailAndPassword(auth, email, password)
                            .then((userCredential) => {
                                // Signed in successfully
                                const user = userCredential.user;
                                showMessage('Login successful!', 'authMessage');
                                localStorage.setItem('loggedInUserId', user.uid);
                                localStorage.setItem('userEmail', email);
                                
                                // Redirect after a short delay
                                setTimeout(() => {
                                    window.location.href = 'index.html';
                                }, 1000);
                            })
                            .catch((signInError) => {
                                console.error("Error signing in:", signInError);
                                showMessage(`Login error: ${signInError.message}`, 'authMessage');
                            });
                    } else {
                        // Handle other account creation errors
                        console.error("Error creating user:", error);
                        showMessage(`Error creating account: ${error.message}`, 'authMessage');
                    }
                });
        });
    } else {
        console.error('Login button not found');
    }
});