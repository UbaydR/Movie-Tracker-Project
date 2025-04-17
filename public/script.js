//Importing API key and host from config.js
import config from '../config.js';

const url = config.rapidApi.url;
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': config.rapidApi.key,
		'x-rapidapi-host': config.rapidApi.host
	}
};

function showMovies(movies) {
    let grid = document.querySelector('#container');
    let html = '';
    const limitedMovies = movies.slice(0, 100);


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
                    </div>
                </div>
            </div>
        `;
    }
  
    grid.innerHTML = html;
    
    // Add click event listeners to all movie cards
    addMovieCardClickListeners();

    
//function to get movie data from api
async function getData() {
    const response = await fetch(url, options);
    const result = await response.json();
    state = result; 
    showMovies(result);
  }


getData();

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
      
      // check for either Firebase user or hardcoded bob user
      const user = auth.currentUser;
      const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                            localStorage.getItem('username') === "bob";
      
      if (!user && !isBobLoggedIn) {
          alert('You must be logged in to like movies.');
          return;
      }
      
      if (isBobLoggedIn) {
          // for bob user, just use session storage, no Firebase
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
      
      // check for either Firebase user or hardcoded bob user
      const user = auth.currentUser;
      const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                            localStorage.getItem('username') === "bob";
      
      if (!user && !isBobLoggedIn) {
          alert('You must be logged in to add to watchlist.');
          return;
      }
      
      if (isBobLoggedIn) {
          // for bob user, just use session storage, no Firebase
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
      
      // check for either Firebase user or hardcoded bob user
      const user = auth.currentUser;
      const isBobLoggedIn = localStorage.getItem('loggedInUserId') === "hardcoded_bob_user" && 
                            localStorage.getItem('username') === "bob";
      
      if (!user && !isBobLoggedIn) {
          alert('You must be logged in to mark as watched.');
          return;
      }
      
      if (isBobLoggedIn) {
          // for bob user, just use session storage, no Firebase
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