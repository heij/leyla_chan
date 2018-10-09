const {si, pantsu} = require('nyaapi');
const isgd = require('isgd');
const fs = require('fs');
const path = require('path'); 

const providers = require('../options/providers');
const languages = require('../options/languages');

function PropertyError(message) {
  Error.captureStackTrace(this, PropertyError);
  this.name = PropertyError.name;
  this.message = message;
};

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

function checkProvider(currentProperties, required) {
	const provider = getOption(currentProperties.query, '--p', 'provider');

	if (provider.value === undefined) {
		if (!required) return provider;
		else throw new PropertyError('Você precisa especificar uma fansub para poder usar esse comando!');
	}
	if (providers.hasOwnProperty(provider.value)) return provider;
	throw new PropertyError('Eu acho que não conheço essa fansub... escolha uma dentre as que conheço e tente novamente!');
}

function checkQuality(currentProperties, required) {
	const quality = getOption(currentProperties.query, '--q', 'quality');

	if (quality.value === undefined) {
		if (!required) return quality;
		else throw new PropertyError('Você precisa especificar uma qualidade para poder usar esse comando!');
	}
	if (currentProperties.provider === undefined) throw new PropertyError('Pra ter certeza de que tudo vai vir certinho, você precisa especificar uma fansub para procurar por qualidade!');
	if (providers[currentProperties.provider].qualities.hasOwnProperty(quality.value)) return quality;
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
	if (!Number.isInteger(episode.value)) throw new PropertyError('Isso não parece ser um número de episódio válido... Lembre-se de que eu não sei resolver equações, então nada de letras!');

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

function searchByType(provider, quality, language, episode, query) {
	if (provider != undefined) {
		return si.searchByUser({ 
			user: providers[provider].name, 
			term: providers[provider].formatName(query, episode, quality),
			category: languages[language] || '1_0' 
		});
	} else {
		if (episode) query = `${query} ${episode}`;
		return si.search({ 
			term: query,
			category: languages[language] || '1_0'
		});
	}
};

module.exports.search = async function(Discord, client, message, args) {
	try {
		const options = checkAllProperties(args, [
			[checkProvider, false], 
			[checkQuality, false], 
			[checkLanguage, false], 
			[checkEpisode, false]
		]);
		message.channel.send('Entendido, capitão! Leyla-chan partindo em busca dos seus torrents!');

		const searchResult = await searchByType(options.provider, options.quality, options.language, options.episode, options.query);
		if (searchResult.length > 0) return await returnSearchResult(Discord, client, message, searchResult);
		else return message.channel.send('Hmmm, não consegui encontrar nenhum resultado... Tente ser mais específico e tente novamente.');
	} catch(err) {
		if (err instanceof PropertyError) return message.channel.send(err.message);
		console.log(err)
		return message.channel.send('Houve um erro enquanto eu buscava seus torrents! Pode ser o trabalho de alguma organização secreta... Tente novamente quando tiver certeza de que eles não estiverem nos ouvindo...');
	}
}

module.exports.batch = async function(Discord, client, message, args) {
    try {
		const options = checkAllProperties(args, [
			[checkProvider, true], 
			[checkQuality, false], 
			[checkLanguage, false], 
			[checkBatchEpisodes, true]
		]);
    	message.channel.send('Aguarde um momentinho, isso pode demorar um pouco. (Meu trabalho é mais difícil do que parece, sabe?)');

	    const searchResult = await returnBatchResult(options);
		return message.channel.send({embed: {
		    color: 0x731399,
		    fields: searchResult,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },	    
		  }
		});
    } catch(err) {
    	if (err instanceof PropertyError) return message.channel.send(err.message);
    	console.log(err);
    	return message.channel.send('Houve um erro enquanto eu buscava seus torrents! Pode ser o trabalho de alguma organização secreta... Tente novamente quando tiver certeza de que eles não estiverem nos ouvindo...');	
    };
}

async function returnSearchResult(Discord, client, message, searchResult) {
	const totalPageCount = Math.ceil(searchResult.length/10);
	let currentPage = 0;

	// Initialize embed with empty pages;
	let resultEmbed = Array.from({ length: totalPageCount }, 
		(v, i) => {
			return [{
				name: `Pagina ${i + 1} / ${totalPageCount}`,
				value: '\u200b'
			}];
		});


	// Fill pages with the results from the received query;
	searchResult.forEach((entry, index) => {
		const page = Math.floor(index / 10);

		resultEmbed[page].push({
    		name: `${index + 1} - ${entry.name}`,
    		value: `\`\`\`Tamanho: ${entry.fileSize} | Seeders: ${entry.seeders}\`\`\`` 
		});
	});

	let sentEmbed = await message.channel.send({
		embed: {
		    color: 0x731399,
		    fields: resultEmbed[currentPage],
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },
		}
	});
	await sentEmbed.react("◀");
	await sentEmbed.react("▶");
	await sentEmbed.react("❌");

	const reactMenu = new Discord.ReactionCollector(sentEmbed, (reaction, user) => user.id === message.author.id && (reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "❌"));
    const choiceCollector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id);
	let picked = false;
	var maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);

	reactMenu.on("collect", reaction => {
	    const choice = reaction.emoji.name;
		reaction.remove(message.author);

	    if (choice === "◀") {
	    	if (currentPage - 1 >= 0) {
	    		currentPage--;
				handleChoice()
    		}
	    } else if (choice === "▶") {
	    	if (currentPage + 1 < totalPageCount) {
	    		currentPage++;
				handleChoice()
    		}
	    } else {
        	picked = true;
        	message.channel.send('Cancelando a escolha; te vejo mais tarde!');
        	return cancelListen(reactMenu, choiceCollector);
	    }
	})
	reactMenu.on("end", reaction => {
		sentEmbed.delete();
	});

    choiceCollector.on('collect', message => {
        if (!isNaN(message.content)) {
        	const fileEntry = parseInt(message.content)
        	if (0 < fileEntry && fileEntry <= searchResult.length) {
        		picked = true;
        		cancelListen(reactMenu, choiceCollector);

				return isgd.shorten(searchResult[fileEntry - 1].links.magnet, function(res) {
			    	return message.channel.send(`Aqui está o link do seu episódio! Divirta-se! :3\n\`\`\`${searchResult[fileEntry -1].name}\`\`\`\n${res}`);
				});
			
        	} else {
        		message.channel.send('Não consigo encontrar este episódio... Tem certeza que digitou um número válido?');
        	}
        } else {
        	if(message.content == 'c') {
            	picked = true;
            	message.channel.send('Cancelando a escolha; te vejo mais tarde!');
            	return cancelListen(reactMenu, choiceCollector);
            } else if(message.content == '<') {
		    	if (currentPage - 1 >= 0) {
		    		currentPage--;
					handleChoice()
	    		}
            } else if(message.content == '>') {
		    	if (currentPage + 1 < totalPageCount) {
		    		currentPage++;
					handleChoice()
	    		}
            } else {
            	message.channel.send('Ehhhhh?! Pare de me ignorar e escolha um episódio!');
            }
        }
    })
    choiceCollector.on('end', () => {
    	if (picked == false) {
	    	return message.channel.send('Tá tão difícil assim escolher um torrent? Sigh... Me chame novamente quando tiver decidido de verdade!');
	    }
    });

	async function changeEmbedPage(sentEmbed) {
		sentEmbed.edit({
			embed: {
			    color: 0x731399,
			    fields: resultEmbed[currentPage],
			    author: {
			      name: message.author.username,
			      icon_url: message.author.avatarURL
			    },
			}
		});
	}

	function cancelListen(reactMenu, choiceCollector) {
		reactMenu.stop();
		choiceCollector.stop();
	}

	function handleChoice() {
		clearInterval(maxTime);
		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);
		changeEmbedPage(sentEmbed)		
	}	
};

async function returnBatchResult(options) {
	let searchResult = [{
			name: 'Prontinho, obrigada pela paciência; aqui estão os animes que você pediu! Divirta-se!',
			value: '\u200b'
	}];

	if (!isNaN(options.episodes[1])) {
		return await (async function fillEpisodeArray(episodeArray, initial, final) {
			if (initial > final) return episodeArray;
		  	const res = await searchByType(options.provider, options.quality, options.language, padEpisode(initial), options.query);

	  		if (res.length === 0) {
				episodeArray.push({
					name: `Não consegui encontrar *__${options.query} ${initial}__* 😖 ! Talvez esse episódio ainda não exista? De qualquer forma, desculpe pelo inconveniente...`,
					value: '\u200b'
				});
	  		} else {
	  			const shortLink = await shortenLink(res[0].links.magnet);
				episodeArray.push({
					name: `*__${res[0].name}__*`,
					value: `Tamanho: ${res[0].fileSize} | Seeders: ${res[0].seeders} | [Link](${shortLink})\n\u200b`
				});
			}
			return fillEpisodeArray(episodeArray, ++initial, final);
		})(searchResult, options.episodes[0], options.episodes[1]);

	} else {
		return await (async function fillEpisodeArray(episodeArray, initial) {
		  	const res = await searchByType(options.provider, options.quality, options.language, padEpisode(initial), options.query);

	  		if (res.length === 0) {
				return episodeArray;
	  		} else {
	  			const shortLink = await shortenLink(res[0].links.magnet);
				episodeArray.push({
					name: `*__${res[0].name}__*`,
					value: `Tamanho: ${res[0].fileSize} | Seeders: ${res[0].seeders} | [Link](${shortLink})\n\u200b`
				});
			}
			return fillEpisodeArray(episodeArray, ++initial);
		})(searchResult, options.episodes[0]);
	}
}

function shortenLink(linkToShorten) {
	return new Promise((resolve, reject) => {
		isgd.shorten(linkToShorten, (shortLink) => {
			resolve(shortLink);
		});		
	});
}

function padEpisode(entry) {
	return entry.toString().padStart(2, '0');
}