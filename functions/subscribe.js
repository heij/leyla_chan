const { 
	PropertyError, 
	SubscriptionError,
	checkFansub, 
	checkQuality,
	checkEpisode,
	checkAllProperties, 
	searchByType, 
	shortenLink,
	padEpisode,
	buildSentEpisodesArray
} = require('./aniHandler');

const fansubFunctions = require('../options/fansubs');
const lowDB = require('../resources/lowDB')();

async function getCurrentlyReleasing(options) {
	try {
		let currentlyReleasing = await searchByType(options.fansub, '');
		return currentlyReleasing.reduce((result, entry) => {
			const entryName = fansubFunctions[options.fansub].splitName(entry.name).anime;
			return (!result.includes(entryName) && + new Date() - new Date(entry.timestamp * 1000) <= 1728000000)
			? [...result, entryName]
			: result
		}, []).sort();
	} catch(err) {
		throw err;
	}	
}

function formatCurrentlyReleasing(releaseList, embedMessage) {
	try {
		return releaseList.reduce((result, entry, index) => {
			if (index % 10 === 0) result.push({ name: `\u200b`, value: `*__${entry},__*` })
		  	else result[result.length-1].value += ` *__${entry}__*,`
		  	return result;
		},
		[{
			name: embedMessage,
			value: `\u200b`,
		}
		]);		
	} catch (err) {
		if (err instanceof TypeError) return [];
	}
}

module.exports.updateAndShowCurrentlyReleasing = async function(Discord, client, message, args) {
	try {
		const options = checkAllProperties(args, [
			[checkFansub, true]
		]);

		const db = await lowDB;
		let cachedRelease = await db.get(`data.fansubs.${options.fansub}`).value();
		if (typeof cachedRelease === 'undefined') cachedRelease = {}; 

		let messageReleaseList = await message.channel.send({embed: {
		    color: 0x731399,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },
		    fields: formatCurrentlyReleasing(Object.keys(cachedRelease), 
		    	`Aqui está a lista de anime que estão sendo lançados pela fansub *__${fansubFunctions[options.fansub].name}__*! Esses são os que lembro de cabeça, mas se você esperar um pouquinho posso te trazer uma lista atualizada!`)
		  }
		});

		const updatedReleaseList = await getCurrentlyReleasing(options);

		messageReleaseList.edit({embed: {
		    color: 0x731399,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },
		    fields: formatCurrentlyReleasing(updatedReleaseList,
		    	`Prontinho! Aqui está a lista de anime que estão sendo lançados pela fansub *__${fansubFunctions[options.fansub].name}__*, agora totalmente atualizada!')`)
		  }
		})

		const updatedRelease = updatedReleaseList.reduce((result, entry) => {
			if (cachedRelease.hasOwnProperty(entry)) result[entry] = cachedRelease[entry];
			else result[entry] = {};
			return result;
		}, {})

		return await db.set(`data.fansubs.${options.fansub}`, updatedRelease).write();
	} catch(err) {
		if (err instanceof SubscriptionError) return message.channel.send(err.message);
		console.log(err);
		return message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui remover sua inscrição... Porque não tenta novamente mais tarde?');
	}
}

module.exports.sub = async function(Discord, client, message, args) {
	try {
		const options = checkAllProperties(args, [
			[checkFansub, true], 
			[checkQuality, true], 
			[checkEpisode, false]
		]);

		const db = await lowDB;

	    // If the fansub is not currently subbing the target anime, throw;
    	if (!db.has(`data.fansubs.${options.fansub}.["${options.query}"]`).value()) {
    		throw new SubscriptionError('Hmmmmmm, não parece que a fansub que você escolheu está trabalhando nesse anime... Você pode ver uma lista de animes por fansub usando o comando *__current__*');
    	}

	    if (db.has(`data.users.${message.author.id}.["${options.query}"]`).value()) {
	    	throw new SubscriptionError('Você já parece estar inscrito nesse anime, então basta esperar o próximo episódio ser lançado!');
	    }

    	await db.set(`data.users.${message.author.id}.["${options.query}"]`, { fansub: options.fansub, quality: options.quality, episodes: [...buildSentEpisodesArray(options.episode)] }).value();
	    await db.write();

    	return message.channel.send('Pronto! Agora é só esperar os seus animes favoritos direto no seu feed!');
	} catch(err) {
		if (err instanceof PropertyError || err instanceof SubscriptionError) return message.channel.send(err.message);
		console.log(err);
		return message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui realizar sua inscrição... Porque não tenta novamente mais tarde?');
	}
}

module.exports.unsub = async function(Discord, client, message, args) {
	try {
		const options = checkAllProperties(args, [

		]);

		const db = await lowDB;

		if (!db.has(`data.users.${message.author.id}.["${options.query}"]`).value()) {
			throw new SubscriptionError('Hmmmm... Você não parece estar inscrito nesse anime... Verifique novamente a sua lista de inscrições, ok?');
		}
		
		await db.unset(`data.users.${message.author.id}.["${options.query}"]`).write();

		return message.channel.send('Pronto! Você não vai mais receber esse anime no seu feed!');
	} catch (err) {
		if (err instanceof SubscriptionError) return message.channel.send(err.message);
		console.log(err);
		return message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui remover sua inscrição... Porque não tenta novamente mais tarde?');
	}
}

module.exports.list = async function(Discord, client, message, args) {
	try {
		const options = checkAllProperties(args, [

		]);

		const db = await lowDB;

		const data = db.get(`data.users.${message.author.id}`).value();

		const embedData = Object.entries(data).reduce(
			(embed, entry) => 
			[...embed, 
			{
				name: `➔ ${entry[0]}`,
				value: `\`\`\`Fansub: ${fansubFunctions[entry[1].fansub].name} | Qualidade: ${entry[1].quality}p\`\`\``
			}]
		, [{ name: 'Lista de inscrições', value: '\u200b' }] );

		return message.channel.send({embed: {
		    color: 0x731399,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },	    
		    fields: embedData
		  }
		});	
	} catch (err) {
		console.log(err);
		return message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui remover sua inscrição... Porque não tenta novamente mais tarde?');		
	}
}

module.exports.watchSubscriptions = async function watchSubscriptions(Discord, client) {
	try {
		await updateSubscribedReleases();
		await sendSubscriptions(client);
	} catch(err) {
		console.log(err)
	}

	setTimeout(() => {
		watchSubscriptions.bind(null, Discord, client)()
	}, 1800000);
}

module.exports.refreshLink = async function(Discord, client, message, args) {
	try {
		const options = checkAllProperties(args, [
			[checkFansub, true], 
			[checkQuality, true], 
			[checkEpisode, true]
		]);

		const db = await lowDB;

		const data = db.has(`data.fansubs.${options.fansub}.["${options.query}"].${padEpisode(options.episode)}.${options.quality}`).value();
		
		if (!data) throw new SubscriptionError('Como esse link pode estar quebrado se eu nem lembro dele? Pare de tentar me ludibriar!');

		const searchResult = await searchByType(options.fansub, options.query, options.quality, options.episode);
		const shortLink = await shortenLink(searchResult[0].links.magnet);
		const fixedLinkEmbed = [{
			name: 'Prontinho, consertei o link do episódio para você!',
			value: '\u200b'
		},
		{
			name: `\u200b`,
			value: `[\[ ➔ ${options.query} - ${options.episode} \]](${shortLink})`
		}]

		message.channel.send({embed: {
		    color: 0x731399,
		    fields: fixedLinkEmbed,
		    author: {
		      name: message.author.username,
		      icon_url: message.author.avatarURL
		    },	    
		  }
		});

		db.set(`data.fansubs.${options.fansub}.["${options.query}"].${padEpisode(options.episode)}.${options.quality}`, shortLink).value();
		return await db.write();
	} catch(err) {
		if (err instanceof PropertyError || err instanceof SubscriptionError) return message.channel.send(err.message);
		console.log(err);
		return message.channel.send('Oh não... Aconteceu algo de ruim e eu não consegui realizar sua inscrição... Porque não tenta novamente mais tarde?');
	}	
}

async function updateSubscribedReleases() {
	try {
		const db = await lowDB;
		const data = db.get(`data`).value();

		for (const [userId, userSubscriptions] of Object.entries(data.users)) {
			for (const [animeName, subscriptionInfo] of Object.entries(userSubscriptions)) {
				const cachedReleases = data.fansubs[subscriptionInfo.fansub][animeName];
				const searchResults = await searchByType(subscriptionInfo.fansub, animeName, subscriptionInfo.quality);

				for (const searchEntry of searchResults) {
					const entryEpisode = fansubFunctions[subscriptionInfo.fansub].splitName(searchEntry.name).episode;
					if (typeof cachedReleases === 'undefined' || 
						typeof cachedReleases[entryEpisode] === 'undefined' || 
						typeof cachedReleases[entryEpisode][subscriptionInfo.quality] === 'undefined') {
						const shortLink = await shortenLink(searchEntry.links.magnet);

						await db.set(`data.fansubs.${subscriptionInfo.fansub}.["${animeName}"].${entryEpisode}`, { [subscriptionInfo.quality]: shortLink }).value();
					}
				}
			}
		}
		await db.write();
	} catch (err) {
		console.log(err);
		throw new SubscriptionError(err);
	}
}

async function sendSubscriptions(client) {
	try {
		const db = await lowDB;
		const data = db.get(`data`).value();

		for (const [userId, userSubscriptions] of Object.entries(data.users)) {
			let unsentSubscriptions = [];

			for (const [animeName, subscriptionInfo] of Object.entries(userSubscriptions)) {
				const cachedReleases = data.fansubs[subscriptionInfo.fansub][animeName];

				for (const [episode, quality] of Object.entries(cachedReleases)) {
					if (!subscriptionInfo.episodes.includes(episode)) {
						unsentSubscriptions.push({
							name: `\u200b`,
							value: `[\[ ➔ ${animeName} - ${episode} \]](${quality[subscriptionInfo.quality]})`
						})
						await db.get(`data.users.${userId}.["${animeName}"].episodes`).push(episode).sort().value();
					}
				}
			}

			if (unsentSubscriptions.length > 0) {
				unsentSubscriptions.unshift({
	                name: 'Oieee! Aqui é o delivery da Leyla-chan, trazendo pra você os animes mais fresquinhos da temporada!',
	                value: '\u200b'
          		});

				await client.users.get(userId).send({
							embed: {
							    color: 0x731399,
							    fields: unsentSubscriptions
						  	}
					  })
				await db.write();
			}
		}
	} catch (err) {
		console.log(err)
		throw new SubscriptionError(err);
	}
}