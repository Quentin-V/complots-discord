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

	if(message.content.startsWith('cleardm')) {
		message.author.createDM().then(dmc => {
			dmc.messages.fetch(true).then(messages => {
				let collBotMessages = messages.filter(mess => mess.author.id === bot.user.id);
				let toDelete = collBotMessages.array().length;
				let deleted = 0;
				collBotMessages.forEach(m => {
					m.delete().then(() => {console.log(`Deleted ${++deleted}/${toDelete} ${((deleted/toDelete) * 100).toFixed(2)}%`)});
				})
			});
		});
	}
});


bot.login(credentials.token);
