//Importing API key and host from config.js
import APIconfig from './config.js';

const url = APIconfig.rapidApi.url;
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': APIconfig.rapidApi.key,
		'x-rapidapi-host': APIconfig.rapidApi.host
	}
};


let state = [];
let likedMovies = [];
let watchlistMovies = [];
let watchedMovies = [];

import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import app from "./auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

function showMovies(movies) {
    let grid = document.querySelector('#container');
    let html = '';
    const limitedMovies = movies.slice(0, 100);

    // Load liked, watchlist, and watched movies from sessionStorage if they exist
    const likedMoviesString = sessionStorage.getItem('likedMovies');
    const watchlistMoviesString = sessionStorage.getItem('watchlistMovies');
    const watchedMoviesString = sessionStorage.getItem('watchedMovies');
    
    if (likedMoviesString) {
        likedMovies = likedMoviesString.split(',');
    }
    
    if (watchlistMoviesString) {
        watchlistMovies = watchlistMoviesString.split(',');
    }
    
    if (watchedMoviesString) {
        watchedMovies = watchedMoviesString.split(',');
    }

    for (let i = 0; i < limitedMovies.length; i++) {
        const movie = limitedMovies[i];
        // Use the movie's index as its ID if it doesn't have one
        const movieId = movie.id || 'movie_' + i;
        
        html += `
            <div class="movie-card" data-id="${movieId}">
                <img class="movie-pic" src="${movie.primaryImage}" alt="">
                <div class="movie-info-box">
                    <div class="movie-info">
                        <h3>${movie.primaryTitle}</h3>
                        <p>${movie.genres[0]}</p>
                    </div>
                    <div class="movie-card-buttons">
                        <button class="like-btn" data-id="${movieId}">Like</button>
                        <button class="watchlist-btn" data-id="${movieId}">Watchlist</button>
                        <button class="watch-btn" data-id="${movieId}">Watch</button>
                    </div>
                </div>
            </div>
        `;
    }
  
    grid.innerHTML = html;
    
    // Add click event listeners to all movie cards
    addMovieCardClickListeners();
}

    
//function to get movie data from api
async function getData() {
    const response = await fetch(url, options);
    const result = await response.json();
    state = result; 
    showMovies(result);
  }

function filterByGenre(genres) {
    let filtered = [];
    
      for(let movie of state){
      
        if (movie.genres[0] === genres)
          filtered.push(movie);
      }
      showMovies(filtered);
  }
  
  window.filterByGenre = filterByGenre;
  

  function searchMovie() {
    let searchKey = document.querySelector('#searchKey').value;
    let results = [];

    for (let movie of state) {
        //capitalize the search term and text
        let movieTitle = movie.primaryTitle.toUpperCase();
        searchKey = searchKey.toUpperCase();

        //add to resulting array if search term is in the title
        if (movieTitle.search(searchKey) !== -1) {
            results.push(movie);
        }
    }

    //show the search results
    showMovies(results);
}


//add event listener for search input
document.querySelector('#searchKey').addEventListener('input', searchMovie);

// Back to top button functionality
const backToTopButton = document.getElementById('backToTop');

// Show button when user scrolls down 300px
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopButton.style.opacity = '1';
    } else {
        backToTopButton.style.opacity = '0';
    }
});


// Scroll to top when button is clicked
backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0, behavior: 'smooth'
        });
    });


// add click event listeners to movie cards
function addMovieCardClickListeners() {
    const movieCards = document.querySelectorAll('.movie-card');
    const likeButtons = document.querySelectorAll('.like-btn');
    const watchlistButtons = document.querySelectorAll('.watchlist-btn');
    const watchButtons = document.querySelectorAll('.watch-btn');
    
    // add click event to movie cards for navigation
    for (let i = 0; i < movieCards.length; i++) {
        movieCards[i].addEventListener('click', function(event) {
            // don't navigate if clicking on buttons
            if (event.target.tagName === 'BUTTON') {
                return;
            }
            
            const movieId = this.getAttribute('data-id');
            const movieIndex = findMovieIndexById(movieId);
            
            if (movieIndex !== -1) {
                const movie = state[movieIndex];
                
                // store movie data in sessionStorage for the details page
                sessionStorage.setItem('movie_title', movie.primaryTitle);
                sessionStorage.setItem('movie_image', movie.primaryImage);
                sessionStorage.setItem('movie_genre', movie.genres[0]);
                sessionStorage.setItem('movie_releaseDate', movie.releaseDate);
                sessionStorage.setItem('movie_description', movie.description);
                
                // navigate to details page
                window.location.href = `movie-details.html?id=${movieId}`;
            }
        });
    }
    
    // add click event to Like buttons
    for (let i = 0; i < likeButtons.length; i++) {
        likeButtons[i].addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent navigation
            const movieId = this.getAttribute('data-id');
            toggleLike(movieId, this);
        });
    }
    
    // add click event to Watchlist buttons
    for (let i = 0; i < watchlistButtons.length; i++) {
        watchlistButtons[i].addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent navigation
            const movieId = this.getAttribute('data-id');
            toggleWatchlist(movieId, this);
        });
    }
    
    // add click event to Watch buttons
    for (let i = 0; i < watchButtons.length; i++) {
        watchButtons[i].addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent navigation
            const movieId = this.getAttribute('data-id');
            toggleWatch(movieId, this);
        });
    }
    
    // update button states
    updateButtonStates();
  }
  
  // helper function to find a movie by its ID
  function findMovieIndexById(movieId) {
      for (let i = 0; i < state.length; i++) {
          if (state[i].id === movieId) {
              return i;
          }
      }
      return -1;
  }
  
  // toggle like status for a movie
  async function toggleLike(movieId, buttonElement) {
      let isLiked = false;
      for (let i = 0; i < likedMovies.length; i++) {
          if (likedMovies[i] === movieId) {
              isLiked = true;
              break;
          }
      }
      
      // check for Firebase user 
      const user = auth.currentUser;
      const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                            localStorage.getItem('username') === "bob";
      
      if (!user && !isBobLoggedIn) {
          alert('You must be logged in to like movies.');
          return;
      }
      
      if (isBobLoggedIn) {
          if (!isLiked) {
              likedMovies.push(movieId);
              buttonElement.classList.add('active');
              buttonElement.textContent = 'Liked';
          } else {
              let newLikedMovies = [];
              for (let i = 0; i < likedMovies.length; i++) {
                  if (likedMovies[i] !== movieId) {
                      newLikedMovies.push(likedMovies[i]);
                  }
              }
              likedMovies = newLikedMovies;
              buttonElement.classList.remove('active');
              buttonElement.textContent = 'Like';
          }
          sessionStorage.setItem('likedMovies', likedMovies.join(','));
      } else {
          // for Firebase users, use Firestore
          const userDocRef = doc(db, "users", user.uid);
          if (!isLiked) {
              likedMovies.push(movieId);
              buttonElement.classList.add('active');
              buttonElement.textContent = 'Liked';
              // add to Firestore
              await updateDoc(userDocRef, { "movies.liked": arrayUnion(movieId) });
          } else {
              let newLikedMovies = [];
              for (let i = 0; i < likedMovies.length; i++) {
                  if (likedMovies[i] !== movieId) {
                      newLikedMovies.push(likedMovies[i]);
                  }
              }
              likedMovies = newLikedMovies;
              buttonElement.classList.remove('active');
              buttonElement.textContent = 'Like';
              // remove from Firestore
              await updateDoc(userDocRef, { "movies.liked": arrayRemove(movieId) });
          }
          sessionStorage.setItem('likedMovies', likedMovies.join(','));
      }
  }
  
  // toggle watchlist status for a movie
  async function toggleWatchlist(movieId, buttonElement) {
      let isInWatchlist = false;
      for (let i = 0; i < watchlistMovies.length; i++) {
          if (watchlistMovies[i] === movieId) {
              isInWatchlist = true;
              break;
          }
      }
      
      // check for Firebase user
      const user = auth.currentUser;
      const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                            localStorage.getItem('username') === "bob";
      
      if (!user && !isBobLoggedIn) {
          alert('You must be logged in to add to watchlist.');
          return;
      }
      
      if (isBobLoggedIn) {
          if (!isInWatchlist) {
              watchlistMovies.push(movieId);
              buttonElement.classList.add('active');
              buttonElement.textContent = 'In Watchlist';
          } else {
              let newWatchlistMovies = [];
              for (let i = 0; i < watchlistMovies.length; i++) {
                  if (watchlistMovies[i] !== movieId) {
                      newWatchlistMovies.push(watchlistMovies[i]);
                  }
              }
              watchlistMovies = newWatchlistMovies;
              buttonElement.classList.remove('active');
              buttonElement.textContent = 'Watchlist';
          }
          sessionStorage.setItem('watchlistMovies', watchlistMovies.join(','));
      } else {
          // for Firebase users, use Firestore
          const userDocRef = doc(db, "users", user.uid);
          if (!isInWatchlist) {
              watchlistMovies.push(movieId);
              buttonElement.classList.add('active');
              buttonElement.textContent = 'In Watchlist';
              // add to Firestore
              await updateDoc(userDocRef, { "movies.watchlist": arrayUnion(movieId) });
          } else {
              let newWatchlistMovies = [];
              for (let i = 0; i < watchlistMovies.length; i++) {
                  if (watchlistMovies[i] !== movieId) {
                      newWatchlistMovies.push(watchlistMovies[i]);
                  }
              }
              watchlistMovies = newWatchlistMovies;
              buttonElement.classList.remove('active');
              buttonElement.textContent = 'Watchlist';
              // remove from Firestore
              await updateDoc(userDocRef, { "movies.watchlist": arrayRemove(movieId) });
          }
          sessionStorage.setItem('watchlistMovies', watchlistMovies.join(','));
      }
  }
  
  // toggle watch status for a movie
  async function toggleWatch(movieId, buttonElement) {
      let isWatched = false;
      for (let i = 0; i < watchedMovies.length; i++) {
          if (watchedMovies[i] === movieId) {
              isWatched = true;
              break;
          }
      }
      
      // check for Firebase user
      const user = auth.currentUser;
      const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                            localStorage.getItem('username') === "bob";
      
      if (!user && !isBobLoggedIn) {
          alert('You must be logged in to mark as watched.');
          return;
      }
      
      if (isBobLoggedIn) {
          if (!isWatched) {
              watchedMovies.push(movieId);
              buttonElement.classList.add('active');
              buttonElement.textContent = 'Watched';
          } else {
              let newWatchedMovies = [];
              for (let i = 0; i < watchedMovies.length; i++) {
                  if (watchedMovies[i] !== movieId) {
                      newWatchedMovies.push(watchedMovies[i]);
                  }
              }
              watchedMovies = newWatchedMovies;
              buttonElement.classList.remove('active');
              buttonElement.textContent = 'Watch';
          }
          sessionStorage.setItem('watchedMovies', watchedMovies.join(','));
      } else {
          // for Firebase users, use Firestore
          const userDocRef = doc(db, "users", user.uid);
          if (!isWatched) {
              watchedMovies.push(movieId);
              buttonElement.classList.add('active');
              buttonElement.textContent = 'Watched';
              // add to Firestore
              await updateDoc(userDocRef, { "movies.watched": arrayUnion(movieId) });
          } else {
              let newWatchedMovies = [];
              for (let i = 0; i < watchedMovies.length; i++) {
                  if (watchedMovies[i] !== movieId) {
                      newWatchedMovies.push(watchedMovies[i]);
                  }
              }
              watchedMovies = newWatchedMovies;
              buttonElement.classList.remove('active');
              buttonElement.textContent = 'Watch';
              // remove from Firestore
              await updateDoc(userDocRef, { "movies.watched": arrayRemove(movieId) });
          }
          sessionStorage.setItem('watchedMovies', watchedMovies.join(','));
      }
  }


// Update button states based on liked, watchlist, and watched arrays
function updateButtonStates() {
    const likeButtons = document.querySelectorAll('.like-btn');
    const watchlistButtons = document.querySelectorAll('.watchlist-btn');
    const watchButtons = document.querySelectorAll('.watch-btn');
    
    // Update like buttons
    for (let i = 0; i < likeButtons.length; i++) {
        const button = likeButtons[i];
        const movieId = button.getAttribute('data-id');
        
        // Check if this movie is liked
        let isLiked = false;
        for (let j = 0; j < likedMovies.length; j++) {
            if (likedMovies[j] === movieId) {
                isLiked = true;
                break;
            }
        }
        
        if (isLiked) {
            button.classList.add('active');
            button.textContent = 'Liked';
        } else {
            button.classList.remove('active');
            button.textContent = 'Like';
        }
    }
    
    // Update watchlist buttons
    for (let i = 0; i < watchlistButtons.length; i++) {
        const button = watchlistButtons[i];
        const movieId = button.getAttribute('data-id');
        
        // Check if this movie is in watchlist
        let isInWatchlist = false;
        for (let j = 0; j < watchlistMovies.length; j++) {
            if (watchlistMovies[j] === movieId) {
                isInWatchlist = true;
                break;
            }
        }
        
        if (isInWatchlist) {
            button.classList.add('active');
            button.textContent = 'In Watchlist';
        } else {
            button.classList.remove('active');
            button.textContent = 'Watchlist';
        }
    }
    
    // Update watch buttons
    for (let i = 0; i < watchButtons.length; i++) {
        const button = watchButtons[i];
        const movieId = button.getAttribute('data-id');
        
        // Check if this movie is watched
        let isWatched = false;
        for (let j = 0; j < watchedMovies.length; j++) {
            if (watchedMovies[j] === movieId) {
                isWatched = true;
                break;
            }
        }
        
        if (isWatched) {
            button.classList.add('active');
            button.textContent = 'Watched';
        } else {
            button.classList.remove('active');
            button.textContent = 'Watch';
        }
    }
} 

// Fetch liked, watchlist, and watched movies from Firebase on page load
async function fetchUserMoviesFromFirebase(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if the movies object exists, if not, create it
            if (!userData.movies) {
                await updateDoc(userDocRef, {
                    movies: {
                        liked: [],
                        watchlist: [],
                        watched: []
                    }
                });
                likedMovies = [];
                watchlistMovies = [];
                watchedMovies = [];
            } else {
                // Get the movie arrays from Firebase
                likedMovies = userData.movies.liked || [];
                watchlistMovies = userData.movies.watchlist || [];
                watchedMovies = userData.movies.watched || [];
            }
            
            // Store in sessionStorage for current session
            sessionStorage.setItem('likedMovies', likedMovies.join(','));
            sessionStorage.setItem('watchlistMovies', watchlistMovies.join(','));
            sessionStorage.setItem('watchedMovies', watchedMovies.join(','));
            
            console.log("User movie preferences loaded from Firebase:", {
                liked: likedMovies.length,
                watchlist: watchlistMovies.length,
                watched: watchedMovies.length
            });
        } else {
            console.log("No user document found in Firestore. Creating a new one.");
            // Create a new user document if it doesn't exist
            await setDoc(doc(db, "users", userId), {
                movies: {
                    liked: [],
                    watchlist: [],
                    watched: []
                },
                timestamp: new Date().getTime()
            });
            
            likedMovies = [];
            watchlistMovies = [];
            watchedMovies = [];
            
            sessionStorage.setItem('likedMovies', '');
            sessionStorage.setItem('watchlistMovies', '');
            sessionStorage.setItem('watchedMovies', '');
        }
    } catch (error) {
        console.error("Error fetching user movies from Firebase:", error);
        // empty arrays if there's an error
        likedMovies = [];
        watchlistMovies = [];
        watchedMovies = [];
        
        sessionStorage.setItem('likedMovies', '');
        sessionStorage.setItem('watchlistMovies', '');
        sessionStorage.setItem('watchedMovies', '');
    }
}

// On page load, check authentication and fetch user movies
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    const username = localStorage.getItem('username');
    
    if (loggedInUserId === "hardcoded_bob_user" && username === "bob") {
        console.log("Hardcoded user is signed in:", loggedInUserId);
        
        // Update UI to show profile link instead of login
        const loginLink = document.getElementById('login-link');
        const profileLink = document.getElementById('profile-link');
        
        if (loginLink && profileLink) {
            loginLink.style.display = 'none';
            profileLink.style.display = 'inline-block';
        }
        
        // Set up empty arrays for movies since bob doesn't have Firebase data
        likedMovies = [];
        watchlistMovies = [];
        watchedMovies = [];
        
        // Just load movies without user preferences
        getData();
    } else {
        // Listen for auth state changes for regular Firebase users
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                console.log("User is signed in:", user.uid);
                localStorage.setItem('loggedInUserId', user.uid);
                
                // Update UI to show profile link instead of login
                const loginLink = document.getElementById('login-link');
                const profileLink = document.getElementById('profile-link');
                
                if (loginLink && profileLink) {
                    loginLink.style.display = 'none';
                    profileLink.style.display = 'inline-block';
                }
                
                // Fetch user's movie preferences and then load movies
                fetchUserMoviesFromFirebase(user.uid).then(() => {
                    getData();
                });
            } else {
                // User is signed out
                console.log("User is signed out");
                localStorage.removeItem('loggedInUserId');
                
                // Clear movie arrays
                likedMovies = [];
                watchlistMovies = [];
                watchedMovies = [];
                
                // Clear session storage
                sessionStorage.removeItem('likedMovies');
                sessionStorage.removeItem('watchlistMovies');
                sessionStorage.removeItem('watchedMovies');
                
                // Update UI to show login link instead of profile
                const loginLink = document.getElementById('login-link');
                const profileLink = document.getElementById('profile-link');
                
                if (loginLink && profileLink) {
                    loginLink.style.display = 'inline-block';
                    profileLink.style.display = 'none';
                }
                
                // Just load movies without user preferences
                getData();
            }
        });
    }
});
