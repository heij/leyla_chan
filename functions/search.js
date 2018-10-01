const {si, pantsu} = require('nyaapi');
const isgd = require('isgd');
const fs = require('fs');
var path = require('path'); 

const providers = require('../options/providers');
const languages = require('../options/languages');

function checkProperty(query, identifier, type) {
	const propIndex = query.indexOf(identifier);

	const formatInput = (value, type, query) => {
		return { value: value, type: type, query: query };
	};

	const validate = (valid, value) => {
		return { valid: valid, value: value };
	};

	if (propIndex > -1) {
		query.splice(propIndex, 1);
		return {
			input: formatInput(query.splice(propIndex, 1)[0], type, query),
			validate: validate
		};
	}

	return {
		input: formatInput(undefined, type, query),
		validate: validate
	};
}

function checkProvider(currentProperties) {
	const provider = checkProperty(currentProperties.query, '--p', 'provider');

	try {
		if (provider.input.value == undefined || providers.hasOwnProperty(provider.input.value)) return provider.validate(true, provider.input);
		else throw 'Eu acho que não conheço essa fansub... escolha uma dentre as que conheço e tente novamente!'
	} catch(err) {
		return provider.validate(false, err);
	}
}

function checkQuality(currentProperties) {
	const quality = checkProperty(currentProperties.query, '--q', 'quality');

	try {
		if (quality.input.value == undefined) return quality.validate(true, quality.input);
		if (currentProperties.provider == undefined) throw 'Pra ter certeza de que tudo vai vir certinho, você precisa especificar uma fansub para procurar por qualidade!';
		if (providers[currentProperties.provider].qualities.hasOwnProperty(quality.input.value)) return quality.validate(true, quality.input);
		else throw 'Hmmm, eu não acho acho que essa seja uma qualidade válida para a fansub que você escolheu... Dê uma olhada nisso e tente novamente!';
	} catch (err) {
		return quality.validate(false, err);
	}
}

function checkLanguage(currentProperties) {
	const language = checkProperty(currentProperties.query, '--l', 'language');
	
	try {
	  	if (language.input.value == undefined || languages.hasOwnProperty(language.input.value)) return language.validate(true, language.input);
	  	else throw 'Eu... não hablar su language? Errr... Tente especificar uma linguagem que eu conheça, por favor!';
	} catch (err) {
  		return language.validate(false, err);
	}
}

function checkEpisode(currentProperties) {
	const episode = checkProperty(currentProperties.query, '--e', 'episode');
	
	try {
		if (episode.input.value == undefined) return episode.validate(true, episode.input);

		// Return error if parameter is not a number;
		if (!Number.isInteger(episode.input.value)) throw 'Isso não parece ser um número de episódio válido... Lembre-se de que eu não sei resolver equações, então nada de letras!';

		episode.input.value = padEpisode(episode.input.value);
		return episode.validate(true, episode.input);
	} catch (err) {
		return episode.validate(false, err);
	}
}

function checkBatchEpisodes(currentProperties) {
	const episodes = checkProperty(currentProperties.query, '--e', 'episodes');

	try {
		if (episodes.input.value == undefined) throw 'Você precisa especificar um conjunto de episódios para poder usar esse comando!';

		const inputTest = /^\d+~(atual|\d+)$/.test(episodes.input.value);
		if (!inputTest) throw 'Isso não parece ser um número de episódio válido... Lembre-se de que eu não sei resolver equações!'

		episodes.input.value = episodes.input.value.split('~');

		// Throw an error if the number of the first episode is higher than that of the second one;
		if (episodes.input.value.every(episode => !Number.isNaN(episode)) && 
			parseInt(episodes.input.value[1]) < parseInt(episodes.input.value[0]))
			throw 'Hmmmm, você tem certeza que não inverteu os números dos episódio? Dê uma olhada nisso e tente novamente!'

		return episodes.validate(true, episodes.input);
	} catch (err) {
		return episodes.validate(false, err);
	}
}

function checkAllProperties(query, ...options) {
	try {
		let result = options.reduce((result, validator) => {
			const property = validator(result);

			if (property.valid == false) throw property.value;

			result.query = property.value.query;
			result[property.value.type] = property.value.value;
			return result;
		}, { query: query } );
		result.query = result.query.join(' ').trim();
		return result;
	} catch(errMsg) {
		return errMsg;
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
	const options = checkAllProperties(args, checkProvider, checkQuality, checkLanguage, checkEpisode);
	if (typeof options == 'string') return message.channel.send(options);
	message.channel.send('Entendido, capitão! Leyla-chan partindo em busca dos seus torrents!');

	try {
		const searchResult = await searchByType(options.provider, options.quality, options.language, options.episode, options.query);
		if (searchResult.length > 0) return await returnMagnet(Discord, client, message, searchResult);
		else return message.channel.send('Hmmm, não consegui encontrar nenhum resultado... Tente ser mais específico e tente novamente.');
	} catch(err) {
		console.log(err);
		return message.channel.send('Houve um erro enquanto eu buscava seus torrents! Pode ser o trabalho de alguma organização secreta... Tente novamente quando tiver certeza de que eles não estiverem nos ouvindo...');
	}
}

module.exports.batch = async function(Discord, client, message, args) {
	const options = checkAllProperties(args, checkProvider, checkQuality, checkLanguage, checkBatchEpisodes);
	if (typeof options == 'string') return message.channel.send(options);
    message.channel.send('Aguarde um momentinho, isso pode demorar um pouco. (Meu trabalho é mais difícil do que parece, sabe?)');
    
    try {
	    const searchResult = await returnMultisearchEmbed(options);
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
    	console.log(err);
    	return message.channel.send('Houve um erro enquanto eu buscava seus torrents! Pode ser o trabalho de alguma organização secreta... Tente novamente quando tiver certeza de que eles não estiverem nos ouvindo...');	
    };
}

function returnMagnet(Discord, client, message, result) {
	
	let queryResult = [];
	let totalPageCount = Math.ceil(result.length/10);
	let currentPage = 1;
	let control = [];

	// Divide the results in separate pages
	let counter = 1;
	result.forEach(entry => {
		let page = Math.ceil(counter/10);
		if (!(page in queryResult)) {
			queryResult[page] = [{
				name: 'Pagina ' + page + '/' + totalPageCount,
				value: '\u200b'
			}]
		}

		queryResult[page].push({
    		name: counter + " - " + entry.name,
    		value: '```Tamanho: ' + entry.fileSize + ' | Seeders: ' + entry.seeders + '```'
		});
		control.push(counter)
		counter += 1;
	});

	/*queryResult.forEach(entry => {
		entry.push({
			name: '\u200b',
			value: '```Psiu, você também pode navegar enviando os caracteres (<, >, c)```'		
		})
	});*/

	message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name:  '\u200b',
			    	value:  '\u200b'
			    }],
			    author: {
			      name: message.author.username,
			      icon_url: message.author.avatarURL
			    },
			}
	}).then(async (sentEmbed) => {
		// Collect and process requests to change the current page or cancel the search; also, automatically cancel the search after some time 
		// has passed without any user interaction
		editEmbed(sentEmbed);
		await sentEmbed.react("◀");
		await sentEmbed.react("▶");
		await sentEmbed.react("❌");

		const reactMenu = new Discord.ReactionCollector(sentEmbed, (reaction, user) => user.id === message.author.id && (reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "❌"));
	    const choiceCollector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id);
		let picked = false;

		var maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);

		reactMenu.on("collect", reaction => {
		    const chosen = reaction.emoji.name;
			reaction.remove(message.author);

		    if (chosen === "◀") {
		    	if (currentPage - 1 >= 1) {
		    		currentPage--;
		    		clearInterval(maxTime);
		    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);
		    		editEmbed(sentEmbed)
	    		}
		    } else if (chosen === "▶") {
		    	if (currentPage + 1 <= totalPageCount) {
		    		currentPage++;
		    		clearInterval(maxTime);
		    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);
		    		editEmbed(sentEmbed)
	    		}
		    } else {
            	picked = true;
            	message.channel.send('Cancelando a escolha; te vejo mais tarde!');
            	cancelListen(reactMenu, choiceCollector);
            	return;
		    }
		});
		reactMenu.on("end", reaction => {
			sentEmbed.delete();
		});


	    choiceCollector.on('collect', message => {
	        if (!isNaN(message.content)) {
	        	let fileNumber = parseInt(message.content)
	        	if (control.includes(fileNumber)) {
	        		picked = true;
	        		cancelListen(reactMenu, choiceCollector, sentEmbed);
					isgd.shorten(result[fileNumber - 1].links.magnet, function(res) {
				    	message.channel.send('Aqui está o link do seu episódio! Divirta-se! :3');
						message.channel.send('```' + result[fileNumber -1].name + '```');
			    		message.channel.send(res);
					});
	        	} else {
	        		message.channel.send('Não consigo encontrar este episódio... Tem certeza que digitou um número válido?');
	        	}
	        } else {
	        	if(message.content == 'c') {
	            	picked = true;
	            	message.channel.send('Cancelando a escolha; te vejo mais tarde!');
	            	cancelListen(reactMenu, choiceCollector, sentEmbed);
	            	return;
	            } else if(message.content == '<') {
			    	if (currentPage - 1 >= 1) {
			    		currentPage--;
			    		clearInterval(maxTime);
			    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);
			    		editEmbed(sentEmbed)
		    		}
	            } else if(message.content == '>') {
			    	if (currentPage + 1 <= totalPageCount) {
			    		currentPage++;
			    		clearInterval(maxTime);
			    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);
			    		editEmbed(sentEmbed)
		    		}
	            } else {
	            	message.channel.send('Ehhhhh?! Pare de me ignorar e escolha um episódio!');
	            }
	        }
	    })
	    choiceCollector.on('end', () => {
	    	if (picked == false) {
		    	message.channel.send('Tá tão difícil assim escolher um torrent? Sigh... Me chame novamente quando tiver decidido de verdade!');
		    	return;
		    }
	    });		
	});

	async function editEmbed(sentEmbed) {
		sentEmbed.edit({
			embed: {
			    color: 0x731399,
			    fields: queryResult[currentPage],
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
}

async function returnMultisearchEmbed(options) {
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