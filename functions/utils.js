require('dotenv').config();
const fs = require('fs');
const providers = require('../options/providers');
const languages = require('../options/languages');
//const qualities = require('../options/qualities');
var path = require('path');

module.exports.help = function(Discord, client, message, args) {
	if (args.includes('search')) {
		let currentProviders = formatProviders();
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __search__? Vamos lá!',
			    	value: 'Com este comando, você pode procurar todo e qualquer anime postado no site nyaa.si e receber o link magnet imediatamente! Não é fantástico? \n \u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: process.env.PREFIX + 'search *__anime__* --p *__fansub__* --l *__linguagem__* \n \u200b'
			    },
				currentProviders,
				{
					name: '**Linguagens disponíveis:**',
					value: '*__ing__* : Inglês\n*__jap__* : Japonês\n*__ni__* : Outras (Português, Espanhol, Alemão, etc)'
				}]
		  	}
		})
	} else if (args.includes('batch')) {
		let currentProviders = formatProviders();
		let currentQualities = formatQualities();
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __batch__? Vamos lá!',
			    	value: 'Com este comando você pode buscar animes em lote! Chega de cansar seus dedos buscando episódio por episódio! Mas atenção: para poder buscar em lote, eu preciso (obrigatoriamente) saber qual a fansub escolhida e quais episódios buscar! Ah, e não esqueça de colocar o *~* entre os episódios inicial e final! \n \u200b'
			    }, 
			    {
			    	name: '**__!!! Propriedades obrigatórias !!! :__** ',
			    	value: 'Fansub __(--p)__\nEpisódio inicial e episódio final __(--e)__\n \u200b'
			    },				    
			    {
			    	name: '**__Usagem:__** ',
			    	value: process.env.PREFIX + 'batch *__anime__* --p *__fansub__* --q *__qualidade__* --e *__episódio incial__*~*__episódio final__*\n \u200b'
			    },
				currentProviders,
				currentQualities
				]
		  	}
		})		
	} else if (args.includes('sub')) {
		let currentProviders = formatProviders();
		let currentQualities = formatQualities();
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __sub__? Vamos lá!',
			    	value: 'Com este comando, você pode se inscrever em animes e receber automaticamente o link magnet assim que um novo episódio for lançado! Hehe, sim, eu sei que sou fantástica! \n \u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: process.env.PREFIX + 'sub *__anime__* --p *__fansub__* --q *__qualidade__*\n \u200b'
			    },
				currentProviders,
				currentQualities
				]
		  	}
		})		
	} else if (args.includes('current')) {
		let currentProviders = formatProviders();
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __current__? Vamos lá!',
			    	value: 'Com este comando, você pode descobrir quais animes estão sendo lançados atualmente pela fansub que você escolheu! \n \u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: process.env.PREFIX + 'current --p *__fansub__*'
			    },
			    currentProviders
			    ]
		  	}
		})
	} else if (args.includes('unsub')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __unsub__? Vamos lá!',
			    	value: 'Com este comando, você pode se desinscrever de animes que já terminaram ou que você decidiu deixar de acompanhar... É um comando meio triste, mas tudo chega ao fim eventualmente...\n \u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: process.env.PREFIX + 'unsub *__anime__*'
			    }]
		  	}
		})
	} else if (args.includes('list')) {
		message.channel.send({
			embed: {
			    color: 0x731399,
			    fields: [{
			    	name: 'Então você quer saber sobre o __list__? Vamos lá!',
			    	value: 'Com este comando, você pode verificar todos os animes em que você está atualmente inscrito! Claro que eu não estaria completa sem isso, né?\n \u200b'
			    }, 
			    {
			    	name: '**__Usagem:__** ',
			    	value: process.env.PREFIX + 'list'
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
			    	value: 'Certo, então você quer saber como me usar? Pervertido! Hehe, brincadeira 😜. Bom, aqui vão os comandos que eu conheço até agora; use __**' + process.env.PREFIX + 'help comando**__ para saber mais sobre ele! Ah, e lembre-se sempre de usar o prefixo **' + process.env.PREFIX + '** quando for conversar comigo! \n \u200b'
			    }, 
			    {
			    	name: '__search__',
			    	value: 'Quer buscar algum anime no Nyaa.si? Esse é o comando certo pra você!\n \u200b'
			    },
			    {
			    	name: '__batch__',
			    	value: 'Quer buscar vários episódios de um mesmo anime, mas está com preguiça de ir um por um? Basta dizer a palavra mágica batch e eu realizarei seu desejo!\n \u200b'
			    },			    
				{
					name: '__sub__',
					value: 'E se você recebesse seus animes favoritos direto no seu inbox, assim que eles fossem lançados? E se eu te dissesse que eu posso tornar isso realidade?\n \u200b'
				},
				{
					name: '__current__',
					value: 'Um ótimo comando para saber quais animes estão sendo lançados atualmente pela sua fansub favorita!\n \u200b'

				},
				{
					name: '__unsub__',
					value: 'E se você deixasse de receber seus animes favoritos direto no seu inbox? E se eu te dissesse que eu também posso tornar isso realidade?\n \u200b'
				},
				{
					name: '__list__',
					value: 'E você também pode ver em que animes está inscrito atualmente! Que tipo de magia é essa?'
				}]
		  	}
		})
	}
}

function formatProviders() {
	let entries = Object.entries(providers);
	let embedField = {
		name: '**Fansubs disponíveis:**',
		value: ''
	};

	entries.forEach((entry) => {
		embedField.value = embedField.value  + '*__' + entry[0] + '__* : ' + entry[1].name + '\n'
	})
	return embedField;
}

function formatQualities() {
	let entries = qualities;
	let embedField = {
		name: '**Qualidades disponíveis:**',
		value: ''
	};

	entries.forEach((entry) => {
		embedField.value = embedField.value  + '*__' + entry + '__* : ' + entry + 'p\n'
	})
	return embedField;
}