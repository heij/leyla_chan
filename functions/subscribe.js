const {si, pantsu} = require('nyaapi');
const isgd = require('isgd');
const fs = require('fs');
const Kitsu = require('kitsu');
const api = new Kitsu();
var subscriptions = require('../subscriptions/userIndex');
var path = require('path');

const providers = require('../providers');
const languages = require('../languages');
const qualities = require('../qualities');

const control = [];
for (let i=1; i<=10;i++) {
	control.push(i)
};

function checkProvider(message, args) {
  	if (args.includes('--p')) {
  		let propertyIndex = args.indexOf('--p');

  		if (!(args[propertyIndex+1] in providers)) {
  			message.channel.send('Não consegui encontrar o fansub que você escolheu... Tem certeza de que você digitou um fansub existente?');
  			return;
		} else {
		  	var animeProvider = {
		  		key: args[propertyIndex+1],
		  		info: providers[args[propertyIndex+1]]
		  	}
		}
		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
  	} else {
  		message.channel.send('Você precisa especificar um fansub para poder usar esse comando!');
  	}

  	if (animeProvider) { return animeProvider; }
	else { return null; }
}

function checkEpisode(message, args) {
	if (args.includes('--e')) {
  		let propertyIndex = args.indexOf('--e');

  		// Throw an error if the inputted episode is not a number
		if (isNaN(args[propertyIndex+1])) {
			message.channel.send('Hmmm, isso não parece ser um número de episódio válido... Dê uma olhada nisso e tente novamente, ok?');
			return;
		}

		var episodeInt = parseInt(args[propertyIndex+1]);
		var episodeRange = [];

		while (episodeInt > 0) {
			episodeRange.push(treatEpisodeNumber(episodeInt))
			episodeInt--;
		}

		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
	}
  	if (episodeRange) { return episodeRange; }
	else { return null; }
}

function checkQuality(message, animeProvider, args) {
	if(args.includes('--q')) {
  		let propertyIndex = args.indexOf('--q');

  		if (animeProvider.info.qualityFormat == false) {
  			message.channel.send('A fansub especificada não marca seus torrents com a resolução do anime (provavelmente ela trabalha com uma única resolução), então vou ter que ignorar essa opção... Desculpe o inconveniente!');
			args[propertyIndex] = '';
			args[propertyIndex+1] = '';  			
  			return null;
  		}

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
  	else { return null; }
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

module.exports.sub = function(Discord, client, message, args) {
	// Check for --p option (mandatory)
	var animeProvider = checkProvider(message, args);
	if (typeof animeProvider == 'undefined') { return; };

	// Check for --q option
	var animeQuality = checkQuality(message, animeProvider, args);
	if (typeof animeQuality == 'undefined') { return; };

	// Check for --e option
	/*var episodeRange = checkEpisode(message, args);
	if (typeof episodeRange == 'undefined') { return; };*/

    const query = args.join(" ").trim();

    // If the user has no subscriptions, register the user
    if (!(subscriptions.hasOwnProperty(message.author.id))) {
    	subscriptions[message.author.id] = {}
    }

    // If the user is already subscribed to the requested anime, return error
    if (subscriptions[message.author.id].hasOwnProperty(query)) {
    	message.channel.send('Você já parece estar inscrito nesse anime, então basta esperar o próximo episódio ser lançado!');
    	return;
    }

    // Check if the requested anime is being released by the selected fansub, and return an error if not.
    if (providers[animeProvider.key].currentlyReleasing.includes(query)) {
		subscriptions[message.author.id][query] = { 
			provider: animeProvider.info.name,
			quality: animeQuality || 'n/a',
			episode: []
		}
		
		fs.writeFile(path.join(__dirname, '../subscriptions', 'userIndex.json'), JSON.stringify(subscriptions), 'utf8', (err) => {
			if (err) {
				console.log(err)
				message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui realizar sua inscrição... Porque não tenta novamente mais tarde?');
				return;
			} else {
				message.channel.send('Pronto! Agora é só esperar os seus animes favoritos direto no seu feed!');
			}
		});
    } else {
    	message.channel.send('Hmmmmmm, não parece que a fansub que você escolheu está trabalhando nesse anime... Você pode ver uma lista de animes por fansub usando o comando *__current__*');
    	return;
    }
}

module.exports.unsub = function(Discord, client, message, args) {
    const query = args.join(" ").trim();

    if (!(subscriptions.hasOwnProperty(message.author.id))) {
    	message.channel.send('Err... Você deveria se inscrever em algo antes de tentar se desinscrever...');
    	return;
    }

	if (!(subscriptions[message.author.id].hasOwnProperty(query))) {
		message.channel.send('Hmmmm... Você não parece estar inscrito nesse anime... Verifique novamente a sua lista de inscrições, ok?');
		return;
	} else {
	  	delete subscriptions[message.author.id][query];
	}
	
	fs.writeFile(path.join(__dirname, '../subscriptions', 'userIndex.json'), JSON.stringify(subscriptions), 'utf8', (err) => {
		if (err) {
			console.log(err)
			message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui remover sua inscrição... Porque não tenta novamente mais tarde?');
			return;
		} else {
			message.channel.send('Pronto! Você não vai mais receber esse anime no seu feed!');
		}
	});
}

module.exports.list = function(Discord, client, message, args) {
	var queryResultExhibit = [];
	queryResultExhibit.push({
		name: 'Lista de inscrições: ',
		value: '\u200b'
	});

	for (var entry in subscriptions[message.author.id]) {
		if (subscriptions[message.author.id].hasOwnProperty(entry)) {
			queryResultExhibit.push({
	    		name: '➔ ' + encode_utf8(entry),
	    		value: 
	    		'```Fansub: ' + encode_utf8(subscriptions[message.author.id][entry]['provider']) + 
	    		' | Qualidade: ' + encode_utf8(subscriptions[message.author.id][entry]['quality']) + /*+
	    		' | Episódios enviados: ' + encode_utf8(subscriptions[message.author.id][entry]['episode']) +*/
	    		'```'
			});			
		}
	}
 	
	message.channel.send({embed: {
	    color: 0x731399,
	    author: {
	      name: message.author.username,
	      icon_url: message.author.avatarURL
	    },	    
	    fields: queryResultExhibit
	  }
	})
}

module.exports.watchSubscriptions = function watchSubscriptions(Discord, client) {
  	console.log('Checando inscrições!');
	sendSubscriptions(client).then(() => {
    	console.log('Loop concluído!');
		fs.writeFile(path.join(__dirname, '../subscriptions', 'userIndex.json'), JSON.stringify(subscriptions), 'utf8', (err) => {
			if (err) {
				console.log(err)
				return;
			}
		});
	});
  	setTimeout(watchSubscriptions.bind(null, Discord, client), 1800000);
}

function sendSubscriptions(client) {
	return new Promise((resolve, reject) => {
		var counter = 0;
		var usersLen = Object.keys(subscriptions).length;

		function prepareSubscription(counter) {
			var user = Object.keys(subscriptions)[counter];
			cycleUser(client, counter, user).then(() => {
				counter++;
				if (counter == usersLen) {
					resolve();
				} else {
					prepareSubscription(counter);
				}
			})
		}
		if (usersLen == 0) {
			resolve();
		} else {
		  prepareSubscription(counter);
    }
	})
}

function cycleUser(client, counter, user) {
	return new Promise((resolve, reject) => {
    	sendEmbed(user, client).then(() => {
    		resolve();
    	});		
	})
}

function sendEmbed(user, client) {
	return new Promise((resolve, reject) => {
		var userAnimes = [];
		userAnimes.push({
			name: 'Oieee! Aqui é o delivery da Leyla-chan, trazendo pra você os animes mais fresquinhos da temporada!',
			value: '\u200b'
		});

		cycleAnime(user).then((userPromises) => {
	        Promise.all(userPromises).then((values) => {
	        	values.forEach((entry) => {
	        		entry.forEach((subEntry) => {
		        		if (subEntry != 'Nadie!') {
			        		userAnimes.push(subEntry)
		        		}
	        		})
	        	});
	        	if (userAnimes.length > 1) {
					client.users.get(user).send({
						embed: {
						    color: 0x731399,
						    fields: userAnimes
					  	}
					})
					resolve();
				} else {
					resolve();
				};
	        })
	        .catch((err) => {
	        	console.log('Errooou! ' + err);
	        })
		})	
	});
}

function cycleAnime(user) {
	return new Promise((resolve, reject) => {
		var animeCount = Object.keys(subscriptions[user]).length;
		var userPromises = [];

	    for (var anime in subscriptions[user]) {
	    	if (subscriptions[user].hasOwnProperty(anime)) {
	    		searchAnime(user, anime).then((res) => {
		    		userPromises.push(res);
					if (userPromises.length == animeCount) { resolve(userPromises) }
	    		})
	    	}
	    }
	})
}

function searchAnime(user, anime) {
	return new Promise((resolve, reject) => {
		var quality = subscriptions[user][anime]['quality'] != 'n/a' ? subscriptions[user][anime]['quality'] : '';

	    si.searchByUser({
	    	user: subscriptions[user][anime]['provider'],
	    	term: anime + ' ' + quality,
		}).then(result => {
			var newEntries = [];
			result.forEach((entry) => {
				if (!(subscriptions[user][anime].episode.includes(entry.name))) {
					newEntries.push(entry)
					subscriptions[user][anime].episode.push(entry.name);
				}
			})
			resolve(searchAnimeMagnet(newEntries, user));
	    })
	    .catch((err) => {
	    	console.log('Failed, retrying!');
	    	setTimeout(() => {	
		    	searchAnime(subscriptions, user, anime);
	    	}, 2000)
	    })

	})	
}

function searchAnimeMagnet(newEntries, user) {
	return new Promise((resolve, reject) => {
		var animeEmbed = [];
		var counter = 0;

		if (newEntries.length == 0) {
			animeEmbed.push('Nadie!');
			resolve(animeEmbed);
		} else {

			function shortenMagnet() {
				isgd.shorten(newEntries[counter].links.magnet, function(res) {
					//.split(']')[1].split('[')[0].trim()
					animeEmbed.push({
						name: '[ ➔ '  + newEntries[counter].name.split(']')[1].split('[')[0].trim() + ' ]',
						value: 'Tamanho: ' + newEntries[counter].fileSize + ' | Seeders: ' + newEntries[counter].seeders + ' | [Link](' + res + ')'
					});

					if (counter == (newEntries.length - 1)) {
						resolve(animeEmbed);
					} else {
						counter++;
						shortenMagnet();					
					}					
				});
			}
			shortenMagnet()
		}
	});
}

function encode_utf8(s){
    return unescape(encodeURIComponent(s));
}('\u4e0a\u6d77')

// Append '0' to single digit numbers
function treatEpisodeNumber(episode) {
	episode = episode.toString();
	if (episode.length == 1) {
		episode = '0' + episode;
	}

	return episode;
}

/*module.exports.getAiring = function(Discord, client, message, args) {
	message.channel.send('Aguarde um minutinho, posso levar um tempo para responder à este comando. (Coletar tantos animes de uma vez só é difícil, tá bom?)');
	var embedFields = [{
		name: 'Haaaai! Aqui está a lista de animes que estão sendo lançados atualmente!',
		value: '\u200b'
	}]

	getAiring().then((animeList) => {
		animeList.forEach((entry) => {
			embedFields.push({
				name: entry,
				value: '\u200b'
			})
		});

		message.channel.send({embed: {
		    color: 0x731399,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },	    
		    fields: embedFields
		  }
		});
	})
}

function getAiring() {
	return new Promise((resolve, reject) => {
		var animeList = [];
		var counter = 0;

		function repeat() {
			api.fetch('anime', {
				filter: {status: 'current'},
				page: {
					limit: 20,
					offset: counter
				}
			}).then((res) => {
				if (Object.keys(res.data).length > 0) { 
					res.data.forEach((entry) => {
						if ('en_jp' in entry.titles) {
							//console.log(entry.titles.en_jp);							
							animeList.push(entry.titles.en_jp);
						} else if ('en_cn' in entry.titles) {
							//console.log(entry.titles.en_cn);
							animeList.push(entry.titles.en_cn);
						} else if ('en' in entry.titles) {
							//console.log(entry.titles.en);
							animeList.push(entry.titles.en);
						}
					})
				}
				if ('next' in res.links) { 
					counter = counter + 20;
					repeat();
				} else {
					console.log(animeList.length);
					resolve(animeList);
				}
			}).catch((err) => {
				console.log(err);
			})
		}

		repeat();
	})
}*/

module.exports.showCurrentlyReleasing = function(Discord, client, message, args) {
	let animeProvider = checkProvider(message, args);
	if (!animeProvider) { return; }

	var initialEmbed = [{
		name: 'Prontinho! Aqui está a lista de anime que estão sendo lançados pela fansub *__' + animeProvider.info.name + '__*! Esses são os que lembro de cabeça, mas se você esperar um pouquinho posso te trazer uma lista atualizada!',
		value: '\u200b',
	}];
	let embedField = formatCurrentlyReleasing(initialEmbed, animeProvider.info.currentlyReleasing);

	message.channel.send({embed: {
	    color: 0x731399,
	    author: {
	      name: message.author.username,
	      icon_url: message.author.avatarURL
	    },
	    fields: embedField
	}}).then((message) => {
		getCurrentlyReleasing(animeProvider).then((fansubEntries) => {
			var initialEmbed = [{
				name: 'Prontinho! Aqui está a lista de anime que estão sendo lançados pela fansub *__' + animeProvider.info.name + '__*, agora totalmente atualizada!',
				value: '\u200b',
			}];
			embedField = formatCurrentlyReleasing(initialEmbed, animeProvider.info.currentlyReleasing);

			message.edit({embed: {
			    color: 0x731399,
			    author: {
			      name: message.author.username,
			      icon_url: message.author.avatarURL
			    },
			    fields: embedField
			}});
		})
	})
}

function getCurrentlyReleasing(animeProvider) {
	return new Promise((resolve, reject) => {
	    si.searchAllByUser({
	    	term: ' ',
	    	user: animeProvider.info.name
		}).then(result => {
			var fansubEntries = [];

			result.forEach(entry => {
				let torrentName = entry.name.split('[')[1].split(']')[1].split('-')[0].trim();
				if (!fansubEntries.includes(torrentName)) {
					if (+ new Date() - new Date(entry.timestamp * 1000) <= 1728000000) {
						fansubEntries.push(torrentName);
					}
				}
			})

			providers[animeProvider.key].currentlyReleasing = fansubEntries;
			resolve(fansubEntries);
	    })
	    .catch((err) => {
	    	console.log(err);
	    })
	})
}

function formatCurrentlyReleasing(embedField, fansubEntries) {
	var counter = 1;
	var entryNumber = 1;

	fansubEntries.forEach(entry => {
		if (typeof embedField[counter] === 'undefined') {
			embedField.push({
				name: '\u200b',
				value: []
			})
		}

		if (embedField[counter].value.length < 10) {
			embedField[counter].value.push('*__' + entry + '__*');
		} 

		if (entryNumber == fansubEntries.length) {
			embedField[counter].value = embedField[counter].value.join(', ');
		} 

		if (embedField[counter].value.length == 10) {
			embedField[counter].value = embedField[counter].value.join(', ');
			counter++;
		}
		entryNumber += 1;
	})

	return embedField;
}

module.exports.updateCurrentlyReleasing = function updateCurrentlyReleasing() {
	_updateCurrentlyReleasing().then(() => {
		console.log('Done updating!')
	});

	//86400000 24h
	setTimeout(updateCurrentlyReleasing, 43200000);
}

function _updateCurrentlyReleasing() {
	return new Promise((resolve, reject) => {
		var entries = Object.entries(providers);
		var counter = 0;

		function update() {
		  	var animeProvider = {
		  		key: entries[counter][0],
		  		info: entries[counter][1]
		  	}			
			getCurrentlyReleasing(animeProvider).then(() => {
				counter++;
				if (counter < entries.length) {
					update();
				} else {
					resolve();
				}
			})
		}
		update();		
	})	
}