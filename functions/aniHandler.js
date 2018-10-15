const { si } = require('nyaapi');
const isgd = require('isgd');

const fansubs = require('../options/fansubs');
const languages = require('../options/languages');

function PropertyError(message) {
  Error.captureStackTrace(this, PropertyError);
  this.name = PropertyError.name;
  this.message = message;
}

function SubscriptionError(message) {
  Error.captureStackTrace(this, SubscriptionError);
  this.name = SubscriptionError.name;
  this.message = message;
}

function getOption(query, identifier, type) {
	const propIndex = query.indexOf(identifier);

	const formatInput = (value, type, query) => {
		return { value: value, type: type, query: query };
	};

	if (propIndex > -1) {
		query.splice(propIndex, 1);
		return formatInput(query.splice(propIndex, 1)[0], type, query)
	}

	return formatInput(undefined, type, query)
}

function checkFansub(currentProperties, required) {
	const fansub = getOption(currentProperties.query, '--f', 'fansub');

	if (fansub.value === undefined) {
		if (!required) return fansub;
		else throw new PropertyError('Você precisa especificar uma fansub para poder usar esse comando!');
	}
	if (fansubs.hasOwnProperty(fansub.value)) return fansub;
	throw new PropertyError('Eu acho que não conheço essa fansub... escolha uma dentre as que conheço e tente novamente!');
}

function checkQuality(currentProperties, required) {
	const quality = getOption(currentProperties.query, '--q', 'quality');

	if (quality.value === undefined) {
		if (!required) return quality;
		else throw new PropertyError('Você precisa especificar uma qualidade para poder usar esse comando!');
	}
	if (currentProperties.fansub === undefined) throw new PropertyError('Pra ter certeza de que tudo vai vir certinho, você precisa especificar uma fansub para procurar por qualidade!');
	if (fansubs[currentProperties.fansub].qualities.hasOwnProperty(quality.value)) return quality;
	throw new PropertyError('Hmmm, eu não acho acho que essa seja uma qualidade válida para a fansub que você escolheu... Dê uma olhada nisso e tente novamente!');
}

function checkLanguage(currentProperties, required) {
	const language = getOption(currentProperties.query, '--l', 'language');
	
  	if (language.value === undefined) {
		if (!required) return language;
		else throw new PropertyError('Você precisa especificar uma linguagem para poder usar esse comando!');
	}
	if (languages.hasOwnProperty(language.value)) return language;
	throw new PropertyError('Eu... não hablar su language? Errr... Tente especificar uma linguagem que eu conheça, por favor!');
}

function checkEpisode(currentProperties, required) {
	const episode = getOption(currentProperties.query, '--e', 'episode');
	
	if (episode.value === undefined) {
		if (!required) return episode;
		else throw new PropertyError('Você precisa especificar um episódio para poder usar esse comando!');
	}
	// Return error if parameter is not a number;
	if (isNaN(episode.value)) throw new PropertyError('Isso não parece ser um número de episódio válido... Lembre-se de que eu não sei resolver equações, então nada de letras!');

	episode.value = padEpisode(episode.value);
	return episode;
}

function checkBatchEpisodes(currentProperties, required) {
	const episodes = getOption(currentProperties.query, '--e', 'episodes');
	
	if (episodes.value === undefined) {
		if (!required) return episodes;
		else throw new PropertyError('Você precisa especificar um conjunto de episódios para poder usar esse comando!');
	} 

	const inputTest = /^\d+~(atual|\d+)$/.test(episodes.value);
	if (!inputTest) throw new PropertyError('Isso não parece ser um número de episódio válido... Lembre-se de que eu não sei resolver equações!');

	episodes.value = episodes.value.split('~');
	// Throw an error if the number of the first episode is higher than that of the second one;
	if (episodes.value.every(episode => !Number.isNaN(episode)) && 
		parseInt(episodes.value[1]) < parseInt(episodes.value[0]))
		throw new PropertyError('Hmmmm, você tem certeza que não inverteu os números dos episódio? Dê uma olhada nisso e tente novamente!');

	return episodes;
}

function checkAllProperties(query, options) {
	try {
		let result = options.reduce((result, validator) => {
			const property = validator[0](result, validator[1]);

			result.query = property.query;
			result[property.type] = property.value;
			return result;
		}, { query: query } );
		result.query = result.query.join(' ').trim();
		return result;
	} catch(err) {
		throw err;
	}
}

function searchByType(fansub, query, quality, language, episode) {
	try {
		if (fansub != undefined) {
			return si.searchByUser({ 
				user: fansubs[fansub].name, 
				term: fansubs[fansub].formatName(query, episode, quality),
				category: languages[language] || '1_0' 
			});
		} else {
			if (episode) query = `${query} ${episode}`;
			return si.search({ 
				term: query,
				category: languages[language] || '1_0'
			});
		}
	} catch(err) {
		throw err;
	}
};

async function shortenLink(linkToShorten) {
	function tryShorten(linkToShorten) {
		return new Promise((resolve, reject) => {
			isgd.shorten(linkToShorten, (shortLink) => {
				resolve(shortLink);
			});
		});
	}

	try {
		return await tryShorten(linkToShorten)
	} catch (err) {
		console.log(err);
    	setTimeout(() => {	
	    	shortenLink.bind(null, linkToShorten)
    	}, 2000)
	}
}

function padEpisode(entry) {
	return entry.toString().padStart(2, '0');
}

function buildSentEpisodesArray(initialEpisode) {
	if (typeof initialEpisode !== 'undefined') {
		initialEpisode = parseInt(initialEpisode);
		let episodeArray = [];
		while (initialEpisode > 0) {
			episodeArray.push(padEpisode(initialEpisode));
			initialEpisode--;
		}
		return episodeArray;
	} else {
		return [];
	}
}

module.exports = {
	PropertyError,
	SubscriptionError,
	checkFansub,
	checkQuality,
	checkLanguage,
	checkEpisode,
	checkBatchEpisodes,	
	checkAllProperties,
	searchByType,
	shortenLink,
	padEpisode,
	buildSentEpisodesArray
}