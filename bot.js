const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, Intents, MessageEmbed } = require('discord.js');
const bot = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});
const { token } = require('./credentials.json');

const ComplotsGame = require('./complots.js');

const possibleActions = `Prendre le revenu : Fais gagner 1 gold, incontrable
Demander l'aide étrangère : Contré par la Duchesse
Assassiner quelqu'un pour 7 gold, incontrable
Effectuer l'action d'un des personnages`;

const characterActions = `Duchesse : Prend 3 gold
Capitaine : Vole maximum 2 gold à un autre joueur, contré par le Capitaine et l'Ambassadeur
Assassin : Assassine un joueur pour 3 gold, contré par la Comptesse
Ambassadeur : Pioche 2 cartes et puis repose 2 cartes de son choix dans la pioche
Comptesse : Contre l'action de l'Assassin`;

const rulesEmbed = new MessageEmbed()
	.setTitle(`Regles`)
	.setDescription('Voici les règles')
	.setColor(`#ffa000`)
	.addField(`Actions possibles`, possibleActions)
	.addField(`Actions des personnages`, characterActions)
	.setImage(`https://quinta.ovh/complots/aide_de_jeu.jpg`);

bot.on('ready', async () => {
	console.log(`Logged in as ${bot.user.tag}!`);
	const appCommandManager = bot.application.commands;
	const commands = await appCommandManager.fetch()
	if(!commands.find(c => c.name === 'start')) {
		const startCommand = new SlashCommandBuilder()
			.setName('start')
			.setDescription('Démarre une partie')
			.addUserOption(option => option.setName('joueur1').setDescription('Joueur 1').setRequired(true))
			.addUserOption(option => option.setName('joueur2').setDescription('Joueur 2').setRequired(true))
			.addUserOption(option => option.setName('joueur3').setDescription('Joueur 3').setRequired(false))
			.addUserOption(option => option.setName('joueur4').setDescription('Joueur 4').setRequired(false))
			.addUserOption(option => option.setName('joueur5').setDescription('Joueur 5').setRequired(false))
			.addUserOption(option => option.setName('joueur6').setDescription('Joueur 6').setRequired(false))
			.addUserOption(option => option.setName('joueur7').setDescription('Joueur 7').setRequired(false))
			.addUserOption(option => option.setName('joueur8').setDescription('Joueur 8').setRequired(false))
		appCommandManager.create(startCommand)
	}
	if(!commands.find(c => c.name === 'rules')) {
		const rulesCommand = new SlashCommandBuilder()
			.setName('rules')
			.setDescription('Affiche une aide avec les règles')
		appCommandManager.create(rulesCommand)
	}
});

bot.on('interactionCreate', inter => {
	if(!inter.isApplicationCommand()) return;
	if(inter.commandName === 'start') start(inter)
	if(inter.commandName === 'rules') rules(inter)
})

function start(inter) {
	const users = []
	for(let i = 1; i <= 8; ++i) {
		const u = inter.options.getUser(`joueur${i}`)
		if(u) users.push(u)
	}
	new ComplotsGame(users, bot, inter.channel)
}

function rules(inter) {
	inter.reply({embeds: [rulesEmbed], ephemeral: true})
}

bot.login(token);
