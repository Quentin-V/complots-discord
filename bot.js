const Discord = require('discord.js');
const bot = new Discord.Client();
const credentials = require('./credentials.js');

const complots = require('./complots.js');
var game;
bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', message => {
	if(message.content.startsWith('start')) {
		message.delete();
		let players = message.mentions.users.array();
		if(!players.includes(message.author)) players.push(message.author);
		game = new complots.ComplotsGame(players, bot, message.channel);
	}
	if(message.content.startsWith('dead')) {
		game.players[0].c1dead = true;
		game.players[0].message.delete();
		game.players[0].message.channel.send(game.createPlayerEmbed(game.players[0])).then( newdm => game.players[0].message = newdm);
	}
	if(message.content.startsWith('mention')) {
		console.log(message.mentions.users.array());
		console.log(message.mentions.users.array()[0]);
	}
});


bot.login(credentials.token);
