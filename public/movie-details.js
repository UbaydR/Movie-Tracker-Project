// Global variables to store movie data
let currentMovie;
let likedMovies = [];
let watchlistMovies = [];
let watchedMovies = [];

// Import Firebase modules
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import app from "./auth.js";

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);

// When the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Get the movie ID from the URL
    const urlString = window.location.search;
    const movieId = urlString.split('=')[1]; // Get the ID after the '=' character
    
    // Get the movie data from the parent page (passed through sessionStorage)
    const movieTitle = sessionStorage.getItem('movie_title');
    const movieImage = sessionStorage.getItem('movie_image');
    const movieGenre = sessionStorage.getItem('movie_genre');
    const movieReleaseDate = sessionStorage.getItem('movie_releaseDate');
    const movieDescription = sessionStorage.getItem('movie_description');
    
    // Create a simple movie object
    currentMovie = {
        id: movieId,
        title: movieTitle,
        image: movieImage,
        genre: movieGenre,
        releaseDate: movieReleaseDate,
        description: movieDescription
    };
    
    // Display the movie details
    displayMovieDetails(currentMovie);
    
    // Initialize with localStorage/sessionStorage data first
    loadFromLocalStorage();
    
    // Then use Firebase Auth state listener to get the most accurate data
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in, load from Firebase
            await loadFromFirebase(user.uid);
        } else {
            // User is not signed in, just use localStorage/sessionStorage
            loadFromLocalStorage();
        }
        // Update button states after data is loaded
        updateButtonStates();
    });
});

// Function to load movie preferences from localStorage/sessionStorage
function loadFromLocalStorage() {
    // Try to get from sessionStorage first, then fall back to localStorage
    let likedMoviesString = sessionStorage.getItem('likedMovies');
    let watchlistMoviesString = sessionStorage.getItem('watchlistMovies');
    let watchedMoviesString = sessionStorage.getItem('watchedMovies');
    
    // If not in sessionStorage, check localStorage
    if (!likedMoviesString) {
        const likedMoviesFromLocalStorage = localStorage.getItem('likedMovies');
        if (likedMoviesFromLocalStorage) {
            likedMoviesString = likedMoviesFromLocalStorage;
            sessionStorage.setItem('likedMovies', likedMoviesString);
        }
    }
    
    if (!watchlistMoviesString) {
        const watchlistMoviesFromLocalStorage = localStorage.getItem('watchlistMovies');
        if (watchlistMoviesFromLocalStorage) {
            watchlistMoviesString = watchlistMoviesFromLocalStorage;
            sessionStorage.setItem('watchlistMovies', watchlistMoviesString);
        }
    }
    
    if (!watchedMoviesString) {
        const watchedMoviesFromLocalStorage = localStorage.getItem('watchedMovies');
        if (watchedMoviesFromLocalStorage) {
            watchedMoviesString = watchedMoviesFromLocalStorage;
            sessionStorage.setItem('watchedMovies', watchedMoviesString);
        }
    }
    
    // Convert to arrays if they exist
    if (likedMoviesString && likedMoviesString !== '') {
        likedMovies = likedMoviesString.split(',');
    }
    
    if (watchlistMoviesString && watchlistMoviesString !== '') {
        watchlistMovies = watchlistMoviesString.split(',');
    }
    
    if (watchedMoviesString && watchedMoviesString !== '') {
        watchedMovies = watchedMoviesString.split(',');
    }
    
    console.log("Loaded from localStorage/sessionStorage:", {
        liked: likedMovies.length,
        watchlist: watchlistMovies.length,
        watched: watchedMovies.length
    });
}

// Function to load movie preferences from Firebase
async function loadFromFirebase(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Get the movie arrays from Firebase
            if (userData.movies) {
                likedMovies = userData.movies.liked || [];
                watchlistMovies = userData.movies.watchlist || [];
                watchedMovies = userData.movies.watched || [];
                
                // Store in sessionStorage for current session
                sessionStorage.setItem('likedMovies', likedMovies.join(','));
                sessionStorage.setItem('watchlistMovies', watchlistMovies.join(','));
                sessionStorage.setItem('watchedMovies', watchedMovies.join(','));
                
                console.log("User movie preferences loaded from Firebase:", {
                    liked: likedMovies.length,
                    watchlist: watchlistMovies.length,
                    watched: watchedMovies.length
                });
            }
        }
    } catch (error) {
        console.error("Error fetching user data from Firebase:", error);
    }
}

// Add event listeners to the like, watchlist, and watched buttons
function addButtonEventListeners(movie) {
    const likeButton = document.getElementById('like-button');
    const watchlistButton = document.getElementById('watchlist-button');
    const watchedButton = document.getElementById('watched-button');
    
    // Set initial button states
    updateButtonStates();
    
    // Like button functionality
    likeButton.addEventListener('click', function() {
        toggleLike(movie.id);
    });
    
    // Watchlist button functionality
    watchlistButton.addEventListener('click', function() {
        toggleWatchlist(movie.id);
    });
    
    // Watched button functionality
    watchedButton.addEventListener('click', function() {
        toggleWatched(movie.id);
    });
}

// Toggle like status
async function toggleLike(movieId) {
    const likeButton = document.getElementById('like-button');
    
    // Check if movie is already liked
    let isLiked = false;
    
    // Loop through liked movies to check if this movie is already liked
    for (let i = 0; i < likedMovies.length; i++) {
        if (likedMovies[i] === movieId) {
            isLiked = true;
            break;
        }
    }
    
    // Check if user is logged in
    const user = auth.currentUser;
    const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                          localStorage.getItem('username') === "bob";
    
    if (!user && !isBobLoggedIn) {
        alert('You must be logged in to like movies.');
        return;
    }
    
    if (isBobLoggedIn) {
        if (!isLiked) {
            // Add to liked movies
            likedMovies.push(movieId);
            likeButton.textContent = 'Liked';
            likeButton.classList.add('active');
        } else {
            // Remove from liked movies
            let newLikedMovies = [];
            for (let i = 0; i < likedMovies.length; i++) {
                if (likedMovies[i] !== movieId) {
                    newLikedMovies.push(likedMovies[i]);
                }
            }
            likedMovies = newLikedMovies;
            likeButton.textContent = 'Like';
            likeButton.classList.remove('active');
        }
        
        // Save to sessionStorage
        sessionStorage.setItem('likedMovies', likedMovies.join(','));
    } else {
        // Regular Firebase user
        const userDocRef = doc(db, "users", user.uid);
        
        if (!isLiked) {
            // Add to liked movies
            likedMovies.push(movieId);
            likeButton.textContent = 'Liked';
            likeButton.classList.add('active');
            
            // Add to Firebase
            await updateDoc(userDocRef, { "movies.liked": arrayUnion(movieId) });
        } else {
            // Remove from liked movies
            let newLikedMovies = [];
            for (let i = 0; i < likedMovies.length; i++) {
                if (likedMovies[i] !== movieId) {
                    newLikedMovies.push(likedMovies[i]);
                }
            }
            likedMovies = newLikedMovies;
            likeButton.textContent = 'Like';
            likeButton.classList.remove('active');
            
            // Remove from Firebase
            await updateDoc(userDocRef, { "movies.liked": arrayRemove(movieId) });
        }
        
        // Save to sessionStorage
        sessionStorage.setItem('likedMovies', likedMovies.join(','));
    }
}

// Toggle watchlist status
async function toggleWatchlist(movieId) {
    const watchlistButton = document.getElementById('watchlist-button');
    
    // Check if movie is already in watchlist
    let isInWatchlist = false;
    
    // Loop through watchlist movies to check if this movie is already in it
    for (let i = 0; i < watchlistMovies.length; i++) {
        if (watchlistMovies[i] === movieId) {
            isInWatchlist = true;
            break;
        }
    }
    
    // Check if user is logged in
    const user = auth.currentUser;
    const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                          localStorage.getItem('username') === "bob";
    
    if (!user && !isBobLoggedIn) {
        alert('You must be logged in to add to watchlist.');
        return;
    }
    
    if (isBobLoggedIn) {
        if (!isInWatchlist) {
            // Add to watchlist movies
            watchlistMovies.push(movieId);
            watchlistButton.textContent = 'In Watchlist';
            watchlistButton.classList.add('active');
        } else {
            // Remove from watchlist movies
            let newWatchlistMovies = [];
            for (let i = 0; i < watchlistMovies.length; i++) {
                if (watchlistMovies[i] !== movieId) {
                    newWatchlistMovies.push(watchlistMovies[i]);
                }
            }
            watchlistMovies = newWatchlistMovies;
            watchlistButton.textContent = 'Add to Watchlist';
            watchlistButton.classList.remove('active');
        }
        
        // Save to sessionStorage
        sessionStorage.setItem('watchlistMovies', watchlistMovies.join(','));
    } else {
        // Regular Firebase user
        const userDocRef = doc(db, "users", user.uid);
        
        if (!isInWatchlist) {
            // Add to watchlist movies
            watchlistMovies.push(movieId);
            watchlistButton.textContent = 'In Watchlist';
            watchlistButton.classList.add('active');
            
            // Add to Firebase
            await updateDoc(userDocRef, { "movies.watchlist": arrayUnion(movieId) });
        } else {
            // Remove from watchlist movies
            let newWatchlistMovies = [];
            for (let i = 0; i < watchlistMovies.length; i++) {
                if (watchlistMovies[i] !== movieId) {
                    newWatchlistMovies.push(watchlistMovies[i]);
                }
            }
            watchlistMovies = newWatchlistMovies;
            watchlistButton.textContent = 'Add to Watchlist';
            watchlistButton.classList.remove('active');
            
            // Remove from Firebase
            await updateDoc(userDocRef, { "movies.watchlist": arrayRemove(movieId) });
        }
        
        // Save to sessionStorage
        sessionStorage.setItem('watchlistMovies', watchlistMovies.join(','));
    }
}

// Toggle watched status
async function toggleWatched(movieId) {
    const watchedButton = document.getElementById('watched-button');
    
    // Check if movie is already watched
    let isWatched = false;
    
    // Loop through watched movies to check if this movie is already watched
    for (let i = 0; i < watchedMovies.length; i++) {
        if (watchedMovies[i] === movieId) {
            isWatched = true;
            break;
        }
    }
    
    // Check if user is logged in
    const user = auth.currentUser;
    const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                          localStorage.getItem('username') === "bob";
    
    if (!user && !isBobLoggedIn) {
        alert('You must be logged in to mark as watched.');
        return;
    }
    
    if (isBobLoggedIn) {
        if (!isWatched) {
            // Add to watched movies
            watchedMovies.push(movieId);
            watchedButton.textContent = 'Watched';
            watchedButton.classList.add('active');
        } else {
            // Remove from watched movies
            let newWatchedMovies = [];
            for (let i = 0; i < watchedMovies.length; i++) {
                if (watchedMovies[i] !== movieId) {
                    newWatchedMovies.push(watchedMovies[i]);
                }
            }
            watchedMovies = newWatchedMovies;
            watchedButton.textContent = 'Mark as Watched';
            watchedButton.classList.remove('active');
        }
        
        // Save to sessionStorage
        sessionStorage.setItem('watchedMovies', watchedMovies.join(','));
    } else {
        // Regular Firebase user
        const userDocRef = doc(db, "users", user.uid);
        
        if (!isWatched) {
            // Add to watched movies
            watchedMovies.push(movieId);
            watchedButton.textContent = 'Watched';
            watchedButton.classList.add('active');
            
            // Add to Firebase
            await updateDoc(userDocRef, { "movies.watched": arrayUnion(movieId) });
        } else {
            // Remove from watched movies
            let newWatchedMovies = [];
            for (let i = 0; i < watchedMovies.length; i++) {
                if (watchedMovies[i] !== movieId) {
                    newWatchedMovies.push(watchedMovies[i]);
                }
            }
            watchedMovies = newWatchedMovies;
            watchedButton.textContent = 'Mark as Watched';
            watchedButton.classList.remove('active');
            
            // Remove from Firebase
            await updateDoc(userDocRef, { "movies.watched": arrayRemove(movieId) });
        }
        
        // Save to sessionStorage
        sessionStorage.setItem('watchedMovies', watchedMovies.join(','));
    }
}

// Update button states based on liked, watchlist, and watched arrays
function updateButtonStates() {
    const likeButton = document.getElementById('like-button');
    const watchlistButton = document.getElementById('watchlist-button');
    const watchedButton = document.getElementById('watched-button');
    const movieId = currentMovie.id;
    
    // Check if user is logged in
    const user = auth.currentUser;
    const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                          localStorage.getItem('username') === "bob";
    const isLoggedIn = user || isBobLoggedIn;
    
    // If user is not logged in, ensure buttons are not active
    if (!isLoggedIn) {
        likeButton.textContent = 'Like';
        likeButton.classList.remove('active');
        watchlistButton.textContent = 'Add to Watchlist';
        watchlistButton.classList.remove('active');
        watchedButton.textContent = 'Mark as Watched';
        watchedButton.classList.remove('active');
        return; // Exit the function early
    }
    
    // Only proceed to check movie status if user is logged in
    // Check if movie is liked
    let isLiked = false;
    for (let i = 0; i < likedMovies.length; i++) {
        if (likedMovies[i] === movieId) {
            isLiked = true;
            break;
        }
    }
    
    // Check if movie is in watchlist
    let isInWatchlist = false;
    for (let i = 0; i < watchlistMovies.length; i++) {
        if (watchlistMovies[i] === movieId) {
            isInWatchlist = true;
            break;
        }
    }
    
    // Check if movie is watched
    let isWatched = false;
    for (let i = 0; i < watchedMovies.length; i++) {
        if (watchedMovies[i] === movieId) {
            isWatched = true;
            break;
        }
    }
    
    // Update button states
    if (isLiked) {
        likeButton.textContent = 'Liked';
        likeButton.classList.add('active');
    } else {
        likeButton.textContent = 'Like';
        likeButton.classList.remove('active');
    }
    
    if (isInWatchlist) {
        watchlistButton.textContent = 'In Watchlist';
        watchlistButton.classList.add('active');
    } else {
        watchlistButton.textContent = 'Add to Watchlist';
        watchlistButton.classList.remove('active');
    }
    
    if (isWatched) {
        watchedButton.textContent = 'Watched';
        watchedButton.classList.add('active');
    } else {
        watchedButton.textContent = 'Mark as Watched';
        watchedButton.classList.remove('active');
    }
}

function displayMovieDetails(movie) {
    const detailsContainer = document.getElementById('movie-details');
    
    // Format the release date nicely if it exists
    let releaseDate = 'Unknown';
    if (movie.releaseDate) {
        const dateObj = new Date(movie.releaseDate);
        releaseDate = dateObj.toLocaleDateString();
    }
    
    // Create HTML for movie details
    const html = `
        <div class="movie-details-header">
            <img src="${movie.image}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info-container">
                <h1 class="movie-title">${movie.title}</h1>
                <div class="movie-metadata">
                    <p><strong>Genre:</strong> ${movie.genre}</p>
                    <p><strong>Release Date:</strong> ${releaseDate}</p>
                </div>
                <div class="movie-description">
                    <h3>Description</h3>
                    <p>${movie.description}</p>
                </div>
            </div>
        </div>
        <div class="movie-action-buttons">
            <button id="like-button" class="like-button">Like</button>
            <button id="watchlist-button" class="watchlist-button">Add to Watchlist</button>
            <button id="watched-button" class="watch-button">Mark as Watched</button>
        </div>
    `;
    
    detailsContainer.innerHTML = html;
    
    // Add event listeners to the buttons
    addButtonEventListeners(movie);
    
    // Update page title
    document.title = `${movie.title} - LoTS Movie Tracker`;
}
