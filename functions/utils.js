require('dotenv').config();

const fansubs = require('../options/fansubs');
const languages = require('../options/languages');

module.exports.help = function(Discord, client, message, args) {
	if (args.includes('params')) {
		const currentFansubs = formatFansubs();
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre os __parametros de pesquisa__? Vamos lá!',
			    	value: `Os parâmetros ajudam a refinar os resultados das minhas buscas, além de serem essenciais para especificar algumas coisinhas de alguns comandos!\nCaso o parâmetro não seja obrigatório, você também pode incluí-lo no termo de pesquisa, mas usá-lo como parâmetro garante muito mais precisão nos seus resultados.`
			    },
			    {
			    	name: '**__Usagem:__** ',
			    	value: `*__--prefixoParametro__*\n\u200b`
			    },			    
				currentFansubs,
				{
					name: '( Prefixo: --l ) **Linguagens disponíveis:**',
					value: '*__ing__* : Inglês\n*__jap__* : Japonês\n*__ni__* : Outras (Português, Espanhol, Alemão, etc)'
				},
				{
					name: '( Prefixo: --q ) **Qualidades disponíveis:** (Para usar esse parâmetro, você obrigatoriamente deve definir também uma fansub!)',
					value: '*__480__* : 480p\n*__720__* : 720p\n*__1080__* : 1080p'
				}]
		  	}
		})
	}	
	else if (args.includes('search')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __search__? Vamos lá!',
			    	value: `Com este comando, você pode procurar todo e qualquer anime postado no site nyaa.si e receber o link magnet imediatamente! Não é fantástico?\n\u200b`
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: `${process.env.PREFIX}search *__anime__* --f *__fansub__* --l *__linguagem__* --q *__qualidade__*\n\u200b`
			    },
			    {
			    	name: '**__Parametros obrigatórios:__** ',
			    	value: `\u200b`
			    },
			    {
			    	name: '**__Parametros opcionais:__** ',
			    	value: `*__Fansub__*, *__linguagem__*, *__qualidade__*`
			    }]
		  	}
		})
	} else if (args.includes('batch')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __batch__? Vamos lá!',
			    	value: 'Com este comando você pode buscar animes em lote! Chega de cansar seus dedos buscando episódio por episódio! Mas atenção: para poder buscar em lote, eu preciso (obrigatoriamente) saber qual a fansub escolhida e quais episódios buscar! Ah, e não esqueça de colocar o *~* entre os episódios inicial e final!\n\u200b'
			    },				    
			    {
			    	name: '**__Usagem:__** ',
			    	value: `${process.env.PREFIX}batch *__anime__* --f *__fansub__* --q *__qualidade__* --e *__episódio incial__*~*__episódio final__*\n\u200b`
			    },
			    {
			    	name: '**__Parametros obrigatórios:__** ',
			    	value: `*__Fansub__*, *__episódios__*`
			    },
			    {
			    	name: '**__Parametros opcionais:__** ',
			    	value: `*__Linguagem__*, *__qualidade__*`			    	
			    }]
		  	}
		})		
	} else if (args.includes('sub')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __sub__? Vamos lá!',
			    	value: 'Com este comando, você pode se inscrever em animes e receber automaticamente o link magnet assim que um novo episódio for lançado! Hehe, sim, eu sei que sou fantástica!\n\u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: `${process.env.PREFIX}sub *__anime__* --f *__fansub__* --q *__qualidade__* --e *__episódio inicial__*\n\u200b`
			    },
			    {
			    	name: '**__Parametros obrigatórios:__** ',
			    	value: `*__Fansub__*, *__qualidade__*`
			    },
			    {
			    	name: '**__Parametros opcionais:__** ',
			    	value: `*__Episódio inicial__*`			    	
			    }]
		  	}
		})		
	} else if (args.includes('current')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __current__? Vamos lá!',
			    	value: 'Com este comando, você pode descobrir quais animes estão sendo lançados atualmente pela fansub que você escolheu!\n\u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: `${process.env.PREFIX}current --f *__fansub__*`
			    },
			    {
			    	name: '**__Parametros obrigatórios:__** ',
			    	value: `*__Fansub__*`
			    },
			    {
			    	name: '**__Parametros opcionais:__** ',
			    	value: `\u200b`			    	
			    }]
		  	}
		})
	} else if (args.includes('unsub')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __unsub__? Vamos lá!',
			    	value: 'Com este comando, você pode se desinscrever de animes que já terminaram ou que você decidiu deixar de acompanhar... É um comando meio triste, mas tudo chega ao fim eventualmente...\n\u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: `${process.env.PREFIX}unsub *__anime__*`
			    },
			    {
			    	name: '**__Parametros obrigatórios:__** ',
			    	value: `\u200b`
			    },
			    {
			    	name: '**__Parametros opcionais:__** ',
			    	value: `\u200b`			    	
			    }]
		  	}
		})
	} else if (args.includes('list')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __list__? Vamos lá!',
			    	value: 'Com este comando, você pode verificar todos os animes em que você está atualmente inscrito! Claro que eu não estaria completa sem isso, né?\n\u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: `${process.env.PREFIX}list`
			    },
			    {
			    	name: '**__Parametros obrigatórios:__** ',
			    	value: `\u200b`
			    },
			    {
			    	name: '**__Parametros opcionais:__** ',
			    	value: `\u200b`			    	
			    }]
		  	}
		})	
	} else {
		message.channel.send({
			embed: {
			    author: {
			      name: 'Oieee! Eu sou a Leyla-chan, seu bot favorito de torrents!',
			      icon_url: client.user.avatarURL
			    },
			    color: 0x731399,
			    fields: [{
			    	name: '\u200b',
			    	value: `Certo, então você quer saber como me usar? Pervertido! Hehe, brincadeira 😜. Bom, aqui vão os comandos que eu conheço até agora; use __**${process.env.PREFIX}help comando**__ para saber mais sobre ele! Ah, e lembre-se sempre de usar o prefixo **${process.env.PREFIX}** quando for conversar comigo!\n\u200b`
			    },
			    {
					name: '__params__',
					value: 'Que tal um pouco de informação sobre os parâmetros que você pode usar para melhorar a sua pesquisa?\n\u200b'
			    },
			    {
			    	name: '__search__',
			    	value: 'Quer buscar algum anime no Nyaa.si? Esse é o comando certo pra você!\n\u200b'
			    },
			    {
			    	name: '__batch__',
			    	value: 'Quer buscar vários episódios de um mesmo anime, mas está com preguiça de ir um por um? Basta dizer a palavra mágica batch e eu realizarei seu desejo!\n\u200b'
			    },			    
				{
					name: '__sub__',
					value: 'E se você recebesse seus animes favoritos direto no seu inbox, assim que eles fossem lançados? E se eu te dissesse que eu posso tornar isso realidade?\n\u200b'
				},
				{
					name: '__current__',
					value: 'Um ótimo comando para saber quais animes estão sendo lançados atualmente pela sua fansub favorita!\n\u200b'

				},
				{
					name: '__unsub__',
					value: 'E se você deixasse de receber seus animes favoritos direto no seu inbox? E se eu te dissesse que eu também posso tornar isso realidade?\n\u200b'
				},
				{
					name: '__list__',
					value: 'E você também pode ver em que animes está inscrito atualmente! Que tipo de magia é essa?'
				}]
		  	}
		})
	}
}

function formatFansubs() {
	return Object.entries(fansubs).reduce((result, options) => {
		result.value += `*__${options[0]}__* : ${options[1].name}\n`;
		return result;
	}, {
		name: `( Prefixo: --f ) **Fansubs disponíveis:**`,
		value: ``
	});
}