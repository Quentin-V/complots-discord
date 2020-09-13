const Discord = require('discord.js');
const bot = new Discord.Client();
const credentials = require('./credentials.js');

const complots = require('./complots.js');

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', message => {
	if(message.content.startsWith('start')) {
		message.delete();
		let players = message.mentions.users.array();
		if(!players.includes(message.author)) players.push(message.author);
		new complots.ComplotsGame(players, bot, message.channel);
	}
});


bot.login(credentials.token);
