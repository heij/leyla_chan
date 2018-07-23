const {si, pantsu} = require('nyaapi');
const isgd = require('isgd');
const fs = require('fs');
var path = require('path'); 

const providers = require('../providers');
const languages = require('../languages');
const qualities = require('../qualities');

function checkProviders(message, args) {
  	if (args.includes('--p')) {
  		let propertyIndex = args.indexOf('--p');

  		if (!(args[propertyIndex+1] in providers)) {
  			message.channel.send('Não consegui encontrar o fansub que você escolheu... Tem certeza de que você digitou um fansub existente?');
  			return;
		} else {
			var animeProvider = providers[args[propertyIndex+1]];
		}
		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
  	}

  	if (animeProvider) { return animeProvider }
	else { return null }
}

function checkEpisodes(message, args) {
  	if(args.includes('--e')) {
  		let propertyIndex = args.indexOf('--e');

  		try {
  			var animeRange = args[propertyIndex+1].split('~');

  			if (isNaN(animeRange[0])) {
				throw '';
  			} else {
  				animeRange[0] = parseInt(animeRange[0]);
  			}

			if (isNaN(animeRange[1])) {
				if (animeRange[1] != 'atual') {
					throw '';
				}
			} else {
				animeRange[1] = parseInt(animeRange[1]);
			}

  			if (!(isNaN(animeRange[1])) && animeRange[0] > animeRange[1]) {
  				message.channel.send('Ehhh... Talvez você tenha invertido os números dos episódios? Por via das dúvidas, verifique isso e tente novamente.');
  				return;
  			}
  		} catch(err) {
  			message.channel.send('Hmmm, parece que tem algo errado com os números dos episódios que você escolheu... Dê uma olhada nisso e tente novamente, ok?');
  			return;
  		}
		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
  	}

  	if (animeRange) { return animeRange }
	else { return null }
}

function checkQuality(message, animeProvider, args) {
	if(args.includes('--q')) {
  		if (animeProvider.qualityFormat == false) {
  			message.channel.send('A fansub especificada não marca seus torrents com a resolução do anime (provavelmente ela trabalha com uma única resolução), então vou ter que ignorar essa opção... Desculpe o inconveniente!');
  			return;
  		}

  		let propertyIndex = args.indexOf('--q');

		if (!(qualities.includes(args[propertyIndex+1]))) {
			message.channel.send('Hmmm, isso não parece ser uma qualidade existente... Dê uma olhada nisso e tente novamente, ok?');
			return;
		} else {
			var animeQuality = args[propertyIndex+1];
		}
		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
  	}
  	if (animeQuality) { return animeQuality }
	else { return '' }  	
}

function checkLanguage(message, args) {
  	if (args.includes('--l')) {
   		let propertyIndex = args.indexOf('--l');

  		if (!(args[propertyIndex+1] in languages)) {
  			message.channel.send('Eu... eu.... não conocer su linguagem. Exibir todas então, ok?');
  		} else {
  			var animeLanguage = languages[args[propertyIndex+1]];
  		}
		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
  	}

  	if (animeLanguage) { return animeLanguage }
	else { return null }
}

module.exports.search = function(Discord, client, message, args) {
	var animeProvider = checkProviders(message, args);
	if (typeof animeProvider == 'undefined') { return; }
	else if (animeProvider) { 
		animeProvider = animeProvider.name;
		var animeQuality = checkQuality(message, animeProvider, args);
		if (typeof animeQuality == 'undefined') { return; }
	}
	
	var animeLanguage = checkLanguage(message, args);
    const query = args.join(" ").trim();

    //message.delete().catch(O_o=>{console.log(O_o)}); 
	message.channel.send('Entendido, capitão! Leyla-chan partindo em busca dos seus torrents!');
	
	if (animeProvider != null) {
	    si.searchByUser({
	    	user: animeProvider,
	    	term: query + ' ' + animeQuality,
	    	category: animeLanguage || '1_0'
		}).then(result => {
			if (result.length == 0) {
				message.channel.send('Hmmm, não consegui encontrar nenhum resultado... Tente ser mais específico e tente novamente.');
				return;
			} else {
				returnMagnet(Discord, client, message, result);
			}
	    })

	} else {
	    si.search({
	    	term: query + ' ' + animeQuality,
	    	category: animeLanguage || '1_0'
		}).then(result => {
			if (result.length == 0) {
				message.channel.send('Hmmm, não consegui encontrar nenhum resultado... Tente ser mais específico e tente novamente.');
				return;
			} else {
				returnMagnet(Discord, client, message, result);
			}
	    })		
	}
}

module.exports.batch = function(Discord, client, message, args) {
	if (!(args.includes('--p'))) {
		message.channel.send('Você precisa especificar um fansub para poder usar esse comando; eu tenho uma lista dos fansubs disponíveis no comando __*\'help batch*__');
		return;
	} if (!(args.includes('--e'))) {
		message.channel.send('Você precisa especificar quais episódios eu devo buscar!');
		return;
	}

	var animeProvider = checkProviders(message, args).name;
	if (typeof animeProvider == 'undefined') { return; };
	
	var animeRange = checkEpisodes(message, args);
	if (typeof animeRange == 'undefined') { return; };

	var animeQuality = checkQuality(message, animeProvider, args);
	if (typeof animeQuality == 'undefined') { return; };

	//var animeLanguage = checkLanguage(message, args);

    const query = args.join(" ").trim();

    if (!(isNaN(animeRange[1]))) {
	    var episodesInRange = [];
	    var counter = 0;
	    while (animeRange[0] <= animeRange[1]) {
	    	let episodeString = treatEpisodeNumber(animeRange[0]);
	    	episodesInRange[counter] = {}
	    	episodesInRange[counter].anime = query + ' ' + episodeString + ' ' + animeQuality;
	    	episodesInRange[counter].episode = episodeString;
	    	animeRange[0]++;
	    	counter++;
	    }
    } else {
    	var episodesInRange = {};
    	episodesInRange.anime = query + ' ' + animeQuality;
    	episodesInRange.episode = treatEpisodeNumber(animeRange[0]);
    }

    message.channel.send('Aguarde um momentinho, isso pode demorar um pouco. (Meu trabalho é mais difícil do que parece, sabe?)');
    returnMultisearchEmbed(Discord, client, message, episodesInRange, animeProvider).then((embedFields) => {
		message.channel.send({embed: {
		    color: 0x731399,
		    fields: embedFields,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },	    
		  }
		})    	
    });
}

function returnMagnet(Discord, client, message, result) {
	let queryResult = [];
	let totalPagesResult = Math.ceil(result.length/10);
	let counter = 1;
	let currentPage = 1;
	let control = [];

	result.forEach(entry => {
		let page = Math.ceil(counter/10);
		if (!(page in queryResult)) {
			queryResult[page] = [{
				name: 'Pagina ' + page + '/' + totalPagesResult,
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

	/*queryResult.push({
		name: '< - Anterior',
		value: '\u200b'		
	},
	{
		name: '> - Prox',
		value: '\u200b'		
	},
	{
		name: 'c - Cancelar',
		value: '\u200b'		
	})*/
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
		editEmbed(sentEmbed);
		await sentEmbed.react("◀");
		await sentEmbed.react("▶");
		await sentEmbed.react("❌");

		const reactMenu = new Discord.ReactionCollector(sentEmbed, (reaction, user) => user.id === message.author.id && (reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "❌"));
	    const choiceCollector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id);
		let picked = false;

		var maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 30000);

		reactMenu.on("collect", reaction => {
		    const chosen = reaction.emoji.name;
			reaction.remove(message.author);

		    if (chosen === "◀") {
		    	if (currentPage - 1 >= 1) {
		    		currentPage--;
		    		clearInterval(maxTime);
		    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 30000);
		    		editEmbed(sentEmbed)
	    		}
		    } else if (chosen === "▶") {
		    	if (currentPage + 1 <= totalPagesResult) {
		    		currentPage++;
		    		clearInterval(maxTime);
		    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 30000);
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
			    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 30000);
			    		editEmbed(sentEmbed)
		    		}
	            } else if(message.content == '>') {
			    	if (currentPage + 1 <= totalPagesResult) {
			    		currentPage++;
			    		clearInterval(maxTime);
			    		maxTime = setInterval(cancelListen.bind(null, reactMenu, choiceCollector), 30000);
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

function returnMultisearchEmbed(Discord, client, message, episodesInRange, animeProvider) {
	return new Promise((resolve, reject) => {
		var embedFields = [];
		embedFields.push({
			name: 'Prontinho, obrigada pela paciência; aqui estão os animes que você pediu! Divirta-se!',
			value: '\u200b'
		})
		var counter = 0;


		function getAnime() {
			var episodeCheckCounter = 0;
			var valid = false;

		    si.searchByUser({
		    	user: animeProvider,
		    	term: episodesInRange[counter].anime
			}).then(result => {
				if (result.length == 0) { 
					embedFields.push({
						name: 'Não consegui encontrar *__' + episodesInRange[counter].anime + '__* 😖 ! Talvez esse episódio ainda não exista? De qualquer forma, desculpe pelo inconveniente...',
						value: '\u200b'
					});
		    		counter++;
					if (counter == episodesInRange.length) { resolve(embedFields); }
					else { getAnime(); }					
				} else {
					while (valid == false) {
						let splittedName = result[episodeCheckCounter].name.split('[')[1].split(']')[1];
						if (!(splittedName.includes(episodesInRange[counter].episode))) {
							episodeCheckCounter++;
						} else {
							valid = true;
						}
					}

					isgd.shorten(result[episodeCheckCounter].links.magnet, function(res) {
			    		counter++;
						embedFields.push({
							name: '*__' + result[episodeCheckCounter].name + '__*',
							value: 'Tamanho: ' + result[episodeCheckCounter].fileSize + ' | Seeders: ' + result[episodeCheckCounter].seeders + ' | [Link](' + res + ')' + '\n \u200b'
						});
						if (counter == episodesInRange.length) { resolve(embedFields); }
						else { getAnime(); }
					});
				}
		    })
		}

		function getAnimeTillLatest() {
			var currentQuery = episodesInRange.anime + ' ' + episodesInRange.episode;
			var episodeCheckCounter = 0;
			var valid = false;

		    si.searchByUser({
		    	user: animeProvider,
		    	term: currentQuery
			}).then(result => {
				if (result.length == 0) {
					resolve(embedFields);					
				} else {
					while (valid == false) {
						let splittedName = result[episodeCheckCounter].name.split('[')[1].split(']')[1];
						console.log(episodesInRange.episode)
						if (!(splittedName.includes(episodesInRange.episode))) {
							episodeCheckCounter++;
						} else {
							valid = true;
						}
					}

					isgd.shorten(result[episodeCheckCounter].links.magnet, function(res) {
			    		episodesInRange.episode = treatEpisodeNumber(parseInt(episodesInRange.episode) + 1) 
						embedFields.push({
							name: '*__' + result[episodeCheckCounter].name + '__*',
							value: 'Tamanho: ' + result[episodeCheckCounter].fileSize + ' | Seeders: ' + result[episodeCheckCounter].seeders + ' | [Link](' + res + ')' + '\n \u200b'
						});
						getAnimeTillLatest();
					});
				}
		    })
		}

	    if (episodesInRange instanceof Array) {
		    getAnime();
	    } else {
	    	getAnimeTillLatest();
	    }
		
	});
}

// Append '0' to single digit numbers
function treatEpisodeNumber(entry) {
	let episodeString = entry.toString();
	if (episodeString.length == 1) {
		episodeString = '0' + episodeString;
	}
	return episodeString;
}