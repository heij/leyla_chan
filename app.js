// glitch.me config
const http = require('http');
const express = require('express');
const app = express();
app.get('/', (request, response) => {
  console.log(Date.now() + ' Ping Received');
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

const Discord = require("discord.js");
const client = new Discord.Client();
require('dotenv').config()

const { prefix, token } = process.env;
const nyaaSearch = require('./functions/search');
const subscription = require('./functions/subscribe');
const utils = require('./functions/utils');

client.on('ready', () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  subscription.watchSubscriptions(Discord, client);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('message', async message => {
  if(message.author.bot) return;
  
  if(message.content.indexOf(prefix) !== 0) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch(command) {
  	case 'search':
  		nyaaSearch.search(Discord, client, message, args);
  		break;
  	case 'batch':
  		nyaaSearch.batch(Discord, client, message, args);
  		break;
  	case 'sub':
	  	subscription.sub(Discord, client, message, args);
	  	break;
  	case 'unsub':
  		subscription.unsub(Discord, client, message, args);
  		break;
  	case 'list':
  		subscription.list(Discord, client, message, args);
  		break;
  	case 'current':
  		subscription.updateAndShowCurrentlyReleasing(Discord, client, message, args);
  		break;
    case 'help':
      utils.help(Discord, client, message, args);
      break;
    /*case 'refresh':
      subscription.refreshLink(Discord, client, message, args);
      break;*/
  	default:
  		message.channel.send(`Eu não conheço esse comando; use ${process.env.PREFIX}help para ver que comandos eu conheço.`);
  }
});

client.login(token);