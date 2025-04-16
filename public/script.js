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
}