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



}