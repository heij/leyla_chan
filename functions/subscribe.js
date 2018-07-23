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

function checkEpisode(message, args) {
	if (args.includes('--e')) {
  		let propertyIndex = args.indexOf('--e');		
		if (isNaN(args[propertyIndex+1])) {
			message.channel.send('Hmmm, isso não parece ser um número de episódio válido... Dê uma olhada nisso e tente novamente, ok?');
			return;
		} else {
			var animeEpisode = args[propertyIndex+1];
		}
		args[propertyIndex] = '';
		args[propertyIndex+1] = '';
	}
  	return animeEpisode;
}

function checkQuality(message, animeProvider, args) {
	if(args.includes('--q')) {
  		let propertyIndex = args.indexOf('--q');

  		if (animeProvider.qualityFormat == false) {
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
	var animeProvider = checkProviders(message, args);
	if (typeof animeProvider == 'undefined') { return; };

	var animeEpisode = checkEpisode(message, args);
	if (typeof animeEpisode != 'undefined') { 
		animeEpisode = treatEpisodeNumber(animeEpisode) 
	}

	var animeQuality = checkQuality(message, animeProvider, args);
	if (typeof animeQuality == 'undefined') { return; };

	var animeLanguage = checkLanguage(message, args);
	if (typeof animeLanguage == 'undefined') { return; }

    const query = args.join(" ").trim();

    if (!(subscriptions.hasOwnProperty(message.author.id))) {
    	subscriptions[message.author.id] = {}
    } else if (subscriptions[message.author.id].hasOwnProperty(query)) {
    	message.channel.send('Você já parece estar inscrito nesse anime, então basta esperar o próximo episódio ser lançado!');
    	return;
    }

	subscriptions[message.author.id][query] = { 
		provider: animeProvider.name || 'n/a',
		language: animeLanguage || 'n/a',
		quality: animeQuality || 'n/a',
		episode: animeEpisode || '01'
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
	    		' | Linguagem: ' + encode_utf8(subscriptions[message.author.id][entry]['language']) +
	    		' | Qualidade: ' + encode_utf8(subscriptions[message.author.id][entry]['quality']) +
	    		' | Episódio atual: ' + encode_utf8(subscriptions[message.author.id][entry]['episode']) +
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
	        		if (entry != 'Nadie!') {
		        		userAnimes.push(entry[0])
	        		}
	        	});
        		/*console.log(user)
	        	console.log(JSON.stringify(userAnimes) + '\n')*/
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

		if (subscriptions[user][anime]['provider'] == 'n/a') {
		    si.search({
		    	term: anime + ' ' + subscriptions[user][anime]['episode'] + ' ' + quality,
		    	n: 1,
		    	category: subscriptions[user][anime]['language'] != 'n/a' ? subscriptions[user][anime]['language'] : '1_0'
			}).then(result => {
				resolve(searchAnimeMagnet(result, subscriptions, user, anime));
		    })
		    .catch((err) => {
		    	console.log('Failed, retrying!');
		    	setTimeout(() => {	
			    	searchAnime(subscriptions, user, anime);
		    	}, 2000)
		    })

		} else {
		    si.searchByUser({
		    	user: subscriptions[user][anime]['provider'],
		    	term: anime + ' ' + subscriptions[user][anime]['episode'] + ' ' + quality,
		    	n: 1,
		    	category: subscriptions[user][anime]['language'] != 'n/a' ? subscriptions[user][anime]['language'] : '1_0'
			}).then(result => {
				resolve(searchAnimeMagnet(result, user, anime));
		    })
		    .catch((err) => {
		    	console.log('Failed, retrying!');
		    	setTimeout(() => {	
			    	searchAnime(subscriptions, user, anime);
		    	}, 2000)
		    })
		}
	})	
}

function searchAnimeMagnet(result, user, anime) {
	return new Promise((resolve, reject) => {		
		if (result.length == 0) {
			resolve('Nadie!');
		} else {
			isgd.shorten(result[0].links.magnet, function(res) {
				let animeEmbed = [{
					name: '[ ➔ ' + anime + ' - Episódio ' + subscriptions[user][anime]['episode'] + ' ]',
					value: 'Tamanho: ' + result[0].fileSize + ' | Seeders: ' + result[0].seeders + ' | [Link](' + res + ')'
				}]
	    		
	    		let newEp = (parseInt(subscriptions[user][anime]['episode']) + 1).toString();
	    		newEp = newEp.length < 2 ? '0' + newEp : newEp
	    		subscriptions[user][anime]['episode'] = newEp;
	    		resolve(animeEmbed)
			});
		}
	});
}

function encode_utf8(s){
    return unescape(encodeURIComponent(s));
}('\u4e0a\u6d77')

// Append '0' to single digit numbers
function treatEpisodeNumber(entry) {
	let episodeString = entry.toString();
	if (episodeString.length == 1) {
		episodeString = '0' + episodeString;
	}
	return episodeString;
}

module.exports.getAiring = function(Discord, client, message, args) {
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
}