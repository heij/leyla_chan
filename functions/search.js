const { 
	PropertyError,
	checkFansub, 
	checkQuality, 
	checkLanguage, 
	checkEpisode, 
	checkBatchEpisodes, 
	checkAllProperties, 
	searchByType, 
	shortenLink, 
	padEpisode
} = require('./aniHandler');

module.exports.search = async function(Discord, client, message, args) {
	try {
		const { query, fansub, quality, language, episode } = checkAllProperties(args, [
			[checkFansub, false],
			[checkQuality, false], 
			[checkLanguage, false], 
			[checkEpisode, false]
		]);
		message.channel.send('Entendido, capitão! Leyla-chan partindo em busca dos seus torrents!');

		const searchResult = await searchByType(fansub, query, quality, language, episode);
		if (searchResult.length > 0) return await returnSearchResult(Discord, client, message, searchResult);
		else return message.channel.send('Hmmm, não consegui encontrar nenhum resultado... Tente ser mais específico e tente novamente.');
	} catch(err) {
		if (err instanceof PropertyError) return message.channel.send(err.message);
		console.log(err);
		return message.channel.send('Houve um erro enquanto eu buscava seus torrents! Pode ser o trabalho de alguma organização secreta... Tente novamente quando tiver certeza de que eles não estiverem nos ouvindo...');
	}
}

module.exports.batch = async function(Discord, client, message, args) {
    try {
		const options = checkAllProperties(args, [
			[checkFansub, true], 
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
	try {
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
		const maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);

		reactMenu.on("collect", reaction => {
		    const choice = reaction.emoji.name;
			reaction.remove(message.author);

		    if (choice === "◀") {
		    	if (currentPage - 1 >= 0) {
		    		currentPage--;
					handleChoice(maxTime, reactMenu, choiceCollector, sentEmbed, resultEmbed, currentPage);
	    		}
		    } else if (choice === "▶") {
		    	if (currentPage + 1 < totalPageCount) {
		    		currentPage++;
					handleChoice(maxTime, reactMenu, choiceCollector, sentEmbed, resultEmbed, currentPage);
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

	    choiceCollector.on('collect', async message => {
	        if (!isNaN(message.content)) {
	        	const fileEntry = parseInt(message.content)
	        	if (0 < fileEntry && fileEntry <= searchResult.length) {
	        		picked = true;
	        		cancelListen(reactMenu, choiceCollector);
					const shortLink = await shortenLink(searchResult[fileEntry - 1].links.magnet);
					return message.channel.send(`Aqui está o link do seu episódio! Divirta-se! :3\n\`\`\`${searchResult[fileEntry -1].name}\`\`\`\n${shortLink}`);
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
						handleChoice(maxTime, reactMenu, choiceCollector, sentEmbed, resultEmbed, currentPage);
		    		}
	            } else if(message.content == '>') {
			    	if (currentPage + 1 < totalPageCount) {
			    		currentPage++;
						handleChoice(maxTime, reactMenu, choiceCollector, sentEmbed, resultEmbed, currentPage);
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
	} catch(err) {
		console.log(err);
		return message.channel.send('Houve um erro enquanto eu buscava seus torrents! Pode ser o trabalho de alguma organização secreta... Tente novamente quando tiver certeza de que eles não estiverem nos ouvindo...');
	}


	async function changeEmbedPage(sentEmbed, resultEmbed, currentPage) {
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

	function handleChoice(maxTime, reactMenu, choiceCollector, sentEmbed, resultEmbed, currentPage) {
		clearInterval(maxTime);
		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 60000);
		changeEmbedPage(sentEmbed, resultEmbed, currentPage)		
	}	
}

async function returnBatchResult(options) {
	const { query, fansub, quality, language, episodes } = options;
	let searchResult = [{
			name: 'Prontinho, obrigada pela paciência; aqui estão os animes que você pediu! Divirta-se!',
			value: '\u200b'
	}];

	if (!isNaN(episodes[1])) {
		return await (async function fillEpisodeArray(episodeArray, initial, final) {
			if (initial > final) return episodeArray;
		  	const res = await searchByType(fansub, query, quality, language, padEpisode(initial));

	  		if (res.length === 0) {
				episodeArray.push({
					name: `Não consegui encontrar *__${query} ${initial}__* 😖 ! Talvez esse episódio ainda não exista? De qualquer forma, desculpe pelo inconveniente...`,
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
		})(searchResult, episodes[0], episodes[1]);

	} else {
		return await (async function fillEpisodeArray(episodeArray, initial) {
		  	const res = await searchByType(fansub, query, quality, language, padEpisode(initial));

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
		})(searchResult, episodes[0]);
	}
}