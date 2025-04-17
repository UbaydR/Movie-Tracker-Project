//import api data from config.js
import APIconfig from './config.js';

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import firebaseConfig from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in using Firebase Auth
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log("User is signed in on profile page:", user.uid);
            localStorage.setItem('loggedInUserId', user.uid);
            
            // Display user email
            displayUserEmail(user.uid);
            
            // Display liked, watchlist and watched movies
            displayLikedMovies();
            displayWatchlistMovies();
            displayWatchedMovies();
            
            // Add logout functionality
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
        } else {
            // Check if we have a userId in localStorage as fallback
            const userId = localStorage.getItem('loggedInUserId');
            if (userId) {
                console.log("Using userId from localStorage:", userId);
                // Display user data using localStorage userId
                displayUserEmail(userId);
                displayLikedMovies();
                displayWatchlistMovies();
                displayWatchedMovies();
                
                // Add logout functionality
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', handleLogout);
                }
            } else {
                // No user is signed in and no userId in localStorage
                console.log("User is not logged in, redirecting to login page");
                window.location.href = 'login.html';
            }
        }
    });
});


// Function to display user email
async function displayUserEmail(userId) {
    try {
        // Check if this is the hardcoded bob user
        if (userId === "hardcoded_bob_user" && localStorage.getItem('username') === "bob") {
            document.getElementById('user-email').textContent = "bob";
            return;
        }
        
        // First try to get email from auth object
        const user = auth.currentUser;
        if (user && user.email) {
            document.getElementById('user-email').textContent = user.email;
            localStorage.setItem('userEmail', user.email);
            return;
        }
        
        // If not available from auth, try localStorage
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            document.getElementById('user-email').textContent = userEmail;
            return;
        }
        
        // If still not available, try to get it from Firestore
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().email) {
            const email = userDoc.data().email;
            document.getElementById('user-email').textContent = email;
            localStorage.setItem('userEmail', email);
        } else {
            document.getElementById('user-email').textContent = "User";
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        document.getElementById('user-email').textContent = "User";
    }
}

// Function to display liked movies
async function displayLikedMovies() {
    const likedMoviesContainer = document.getElementById('liked-movies');
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) return;

    // Check if this is bob user
    let likedMovies = [];
    if (userId === "hardcoded_bob_user" && localStorage.getItem('username') === "bob") {
        // For bob, get data from sessionStorage
        const likedMoviesString = sessionStorage.getItem('likedMovies');
        if (likedMoviesString && likedMoviesString !== '') {
            likedMovies = likedMoviesString.split(',');
        }
    } else {
        // For regular users, get data from Firestore
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            likedMovies = userDoc.data().movies?.liked || [];
        }
    }

    likedMoviesContainer.innerHTML = '';
    if (likedMovies.length === 0) {
        likedMoviesContainer.innerHTML = '<p class="no-movies">No liked movies yet.</p>';
        return;
    }

    likedMovies.forEach(id => {
        fetchAndDisplayMovie(id, likedMoviesContainer);
    });
}

// Function to display watchlist movies
async function displayWatchlistMovies() {
    const watchlistMoviesContainer = document.getElementById('watchlist-movies');
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) return;

    // Check if this is bob user
    let watchlistMovies = [];
    if (userId === "hardcoded_bob_user" && localStorage.getItem('username') === "bob") {
        // For bob, get data from sessionStorage
        const watchlistMoviesString = sessionStorage.getItem('watchlistMovies');
        if (watchlistMoviesString && watchlistMoviesString !== '') {
            watchlistMovies = watchlistMoviesString.split(',');
        }
    } else {
        // For regular users, get data from Firestore
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            watchlistMovies = userDoc.data().movies?.watchlist || [];
        }
    }

    watchlistMoviesContainer.innerHTML = '';
    if (watchlistMovies.length === 0) {
        watchlistMoviesContainer.innerHTML = '<p class="no-movies">No movies in watchlist yet.</p>';
        return;
    }

    watchlistMovies.forEach(id => {
        fetchAndDisplayMovie(id, watchlistMoviesContainer);
    });
}

// Function to display watched movies
async function displayWatchedMovies() {
    const watchedMoviesContainer = document.getElementById('watched-movies');
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) return;

    // Check if this is bob user
    let watchedMovies = [];
    if (userId === "hardcoded_bob_user" && localStorage.getItem('username') === "bob") {
        // For bob, get data from sessionStorage
        const watchedMoviesString = sessionStorage.getItem('watchedMovies');
        if (watchedMoviesString && watchedMoviesString !== '') {
            watchedMovies = watchedMoviesString.split(',');
        }
    } else {
        // For regular users, get data from Firestore
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            watchedMovies = userDoc.data().movies?.watched || [];
        }
    }

    watchedMoviesContainer.innerHTML = '';
    if (watchedMovies.length === 0) {
        watchedMoviesContainer.innerHTML = '<p class="no-movies">No movies watched yet.</p>';
        return;
    }

    watchedMovies.forEach(id => {
        fetchAndDisplayMovie(id, watchedMoviesContainer);
    });
}

// Function to fetch movie data and create a movie card
async function fetchAndDisplayMovie(movieId, container) {
    try {
        // Fetch movie data from the api config
        const url = APIconfig.rapidApi.url;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': APIconfig.rapidApi.key,
                'x-rapidapi-host': APIconfig.rapidApi.host
            }
        };

        // First try to find the movie in the state array from script.js
        let movieData = null;
        
        // If we couldn't find it in state, fetch it from the api
        if (!movieData) {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (result && Array.isArray(result)) {
                // Find the movie by ID
                movieData = result.find(movie => movie.id === movieId);
            }
        }
        
        // If we still don't have movie data, use placeholder values
        const title = movieData ? movieData.primaryTitle : 'Movie ' + movieId;
        const imageUrl = movieData ? movieData.primaryImage : 'https://via.placeholder.com/300x450?text=Movie+' + movieId;
        const genre = movieData ? (movieData.genres && movieData.genres[0] ? movieData.genres[0] : 'Unknown') : 'Unknown';
        
        // Create movie card HTML
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.setAttribute('data-id', movieId);
        
        movieCard.innerHTML = `
            <img class="movie-pic" src="${imageUrl}" alt="${title}">
            <div class="movie-info-box">
                <div class="movie-info">
                    <h3>${title}</h3>
                    <p>${genre}</p>
                </div>
            </div>
        `;
        
        // Add click event to navigate to movie details
        movieCard.addEventListener('click', () => {
            // Store the movie data in sessionStorage before navigating
            if (movieData) {
                sessionStorage.setItem('movie_title', movieData.primaryTitle);
                sessionStorage.setItem('movie_image', movieData.primaryImage);
                sessionStorage.setItem('movie_genre', movieData.genres && movieData.genres[0] ? movieData.genres[0] : 'Unknown');
                sessionStorage.setItem('movie_releaseDate', movieData.releaseDate || '');
                sessionStorage.setItem('movie_description', movieData.description || 'No description available for this movie.');
            } else {
                // If no movie data, store placeholder values
                sessionStorage.setItem('movie_title', title);
                sessionStorage.setItem('movie_image', imageUrl);
                sessionStorage.setItem('movie_genre', genre);
                sessionStorage.setItem('movie_releaseDate', '');
                sessionStorage.setItem('movie_description', 'No description available for this movie.');
            }
            
            // Navigate to the details page
            window.location.href = `movie-details.html?id=${movieId}`;
        });
        
        // Add to container
        container.appendChild(movieCard);
    } catch (error) {
        console.error('Error fetching movie data:', error);
        
        // Create a fallback movie card with the ID
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.setAttribute('data-id', movieId);
        
        const fallbackTitle = 'Movie ' + movieId;
        const fallbackImage = `${movieId}`;
        
        movieCard.innerHTML = `
            <img class="movie-pic" src="${fallbackImage}" alt="${fallbackTitle}">
            <div class="movie-info-box">
                <div class="movie-info">
                    <h3>${fallbackTitle}</h3>
                    <p>Unknown Genre</p>
                </div>
            </div>
        `;
        
        // Add click event to navigate to movie details with fallback data
        movieCard.addEventListener('click', () => {
            // Store fallback data in sessionStorage
            sessionStorage.setItem('movie_title', fallbackTitle);
            sessionStorage.setItem('movie_image', fallbackImage);
            sessionStorage.setItem('movie_genre', 'Unknown');
            sessionStorage.setItem('movie_releaseDate', '');
            sessionStorage.setItem('movie_description', 'No description available for this movie.');
            
            // Navigate to the details page
            window.location.href = `movie-details.html?id=${movieId}`;
        });
        
        // Add to container
        container.appendChild(movieCard);
    }
}

// Function to handle logout
function handleLogout() {
    signOut(auth).then(() => {
        // Clear local storage
        localStorage.removeItem('loggedInUserId');
        localStorage.removeItem('userEmail');
        
        // Clear session storage
        sessionStorage.removeItem('likedMovies');
        sessionStorage.removeItem('watchlistMovies');
        sessionStorage.removeItem('watchedMovies');
        
        console.log("User logged out successfully");
        
        // Redirect to login page
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
}
