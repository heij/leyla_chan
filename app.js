// glitch.me config
const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);



const Discord = require("discord.js");
const client = new Discord.Client();

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const nyaa = require("./functions/search");
const subscription = require("./functions/subscribe");
const utils = require("./functions/utils");

client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  
  //180000
  setTimeout(subscription.watchSubscriptions.bind(null, Discord, client), 1000);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});


client.on("message", async message => {
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.ff
  if(message.content.indexOf(prefix) !== 0) return;

  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch(command) {
  	case 'search':
  		nyaa.search(Discord, client, message, args);
  		break;
	case 'batch':
		nyaa.batch(Discord, client, message, args);
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
	case 'help':
		utils.help(Discord, client, message, args);
		break;
	case 'airing':
		subscription.getAiring(Discord, client, message, args);
		break;
	default:
		message.channel.send('Eu não conheço esse comando; use \'help para ver que comandos eu conheço.');	
  }

});


client.login(token);