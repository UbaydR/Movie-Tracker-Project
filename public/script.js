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
