const {Discord, MessageEmbed} = require('discord.js');

class ComplotsGame {
	constructor(users, bot, channel) {
		this.channel = channel;
		this.message = null;
		this.turn = 0;
		this.deck = new Deck(users.length);
		this.bot = bot;
		this.players = Player.createPlayers(users, this.deck);
		this.collector = null;
		this.lastAction = '';
		this.currentPlayer = null;
		this.startGame();
	}

	startGame() {
		this.players.forEach(player => {
			let embed = new MessageEmbed()
			.setTitle('Voici tes cartes')
			.setDescription(player.card1 + ' et ' + player.card2)
			.attachFiles(['./resources/comp/'+player.card1.toLowerCase()+'_'+player.card2.toLowerCase()+'.png'])
			.setImage('attachment://'+player.card1.toLowerCase()+'_'+player.card2.toLowerCase()+'.png')
			.addField('Argent', player.gold);
			player.user.send(embed).then(playerMsg => player.message = playerMsg);
		});
		this.playTurn();
	}

	playTurn() {
		this.currentPlayer = this.players[this.turn++%this.players.length]; // Get the current player
		if(this.message === null) {
			this.sendPrincipalMessage();
		}else {
			this.message.edit(`***C'est au tour de ${this.currentPlayer.user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n*${this.currentPlayer.user} choisit une action*\n${this.lastAction}` + this.statusToString());
		}
	}

	sendPrincipalMessage() {
		this.channel.send(`***C'est au tour de ${this.currentPlayer.user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n*${this.currentPlayer.user} choisit une action*\n${this.lastAction}` + this.statusToString()).then(message => { // add 1 to the turn variable after displaying it
			this.message = message;
			message.react('🟡');
			message.react('🟨');
			message.react('⚫');
			message.react('🟣');
			message.react('🔴');
			message.react('🔵');
			message.react('🟤');
			let filter = (reaction, user) => !user.bot;
			// ^^^^ Will fire the collector only if the reactor is ont a bot.
			this.collector = message.createReactionCollector(filter); // Create the reaction collector with the filter above
			this.collector.on('collect', (r, u) => this.handleReactions(r, u));
		});
	}

	handleReactions(r, u) {
		r.users.remove(u);
		if(this.currentPlayer.user.id !== u.id) return;
		switch (r.emoji.name) {
			case '🟡':
				this.revenu();
				break;
			case '🟨':
				this.aideEtr();
				break;
			case '⚫':
				this.assas7();
				break;
			case '🟣':
				this.duchesse();
				break;
			case '🔴':
				this.assassin();
				break;
			case '🔵':
				this.capitaine();
				break;
			case '🟤':
				this.ambassadeur();
				break;
			default:
				break;
		}
	}

	revenu() {
		// Update the embed in dms
		++this.currentPlayer.gold;
		let embed = new MessageEmbed()
		.setTitle('Voici tes cartes')
		.setDescription(this.currentPlayer.card1 + ' et ' + this.currentPlayer.card2)
		.attachFiles(['./resources/comp/'+this.currentPlayer.card1.toLowerCase()+'_'+this.currentPlayer.card2.toLowerCase()+'.png'])
		.setImage('attachment://'+this.currentPlayer.card1.toLowerCase()+'_'+this.currentPlayer.card2.toLowerCase()+'.png')
		.addField('Argent', this.currentPlayer.gold);
		this.currentPlayer.message.edit(embed);

		// Updates the principal message
		this.lastAction = `*${this.currentPlayer.user} a pris le revenu et gagne 1 pièce d'or*`;
		this.playTurn();
	}

	aideEtr() {
		this.channel.send(`${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse), pour contrer cette action, réagissez avec l'emote :crossed_swords:️️ dans les 10 secondes`).then(msg => {
			this.waitCounter(msg).then((countered, counter) => { // Wait to see if anyone counters the action
				if(countered) { // If the action is countered
					msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n\n**${counter} contre l'action de ${this.currentPlayer.user} (s'affirme Duchesse**\nPour contrer cette action, réagissez avec :crossed_swords:️️ dans les 10 secondes`).then(msg => {
						this.waitCounter(msg).then((countered2, counter2) => { // Ask again to see if anyone counters the counter
							if(countered2) { // If the counter is countered
								msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'action de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse`);
								setTimeout(() => { // Timeout for suspens
									let counterPlayer, counterPlayer2;
									this.players.forEach(player => { // Find the player of the counter to know the cards
										if     (player.user.id === counter.id ) counterPlayer  = player;
										else if(player.user.id === counter2.id) counterPlayer2 = player;
									});
									// If the counter has 'Duchesse' in his hand
									if(counterPlayer.card1 === 'Duchesse' || counterPlayer.card2 === 'Duchesse') {
										let cardDuchesse = counterPlayer.card1 === 'Duchesse' ? 1 : 2;
									}else { // The counter hasn't a 'Duchesse' in his hand
										// 👈👉
										msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'action de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse\n\n**${counter} n'est pas Duchesse et doit révéler une de ses cartes**`);
										counterPlayer.user.send(`Réagis à ce message pour décider quelle carte tu veux dévoiler : \n:point_left: : ${counterPlayer.card1}\n:point_right: : ${counterPlayer.card2}`).then(msg => {
											let filter = (r,u) => !u.bot;
											msg.react('👈');
											msg.react('👉');
											let collector = msg.createReactionCollector(filter, {time: 15000});
											collector.on('collect', ());
										});
									}
								}, 3000);
							}
						})
					});
				}
			});
		});
	}

	assas7() {
		this.channel.send("Assasiner pour 7");
		// TODO: Faire la méthode
	}

	duchesse() {
		this.channel.send("Duchesse");
		// TODO: Faire la méthode
	}

	assassin() {
		this.channel.send("Assassin");
		// TODO: Faire la méthode
	}

	capitaine() {
		this.channel.send("Capitaine");
		// TODO: Faire la méthode
	}

	ambassadeur() {
		this.channel.send("Ambassadeur");
		// TODO: Faire la méthode
	}

	waitCounter(msg) {
		return new Promise(function(resolve, reject) {
			msg.react('⚔️');
			let filter = (r, u) => !u.bot && !u.id === this.currentPlayer.user.id;
			let collector = msg.createReactionCollector(filter, {time:10000});
			collector.on('collect', (r, u) => {
				r.users.remove(u);
				collector.end('countered');
				resolve(true, u);
			});
			collector.on('end', (coll, reason)) {
				if(reason !== 'countered') {
					resolve(false, null);
				}
			}
		});
	}

	statusToString() {
		let status = `\n\n`;
		this.players.forEach(player => {
			let c1 = player.c1dead ? player.card1 : 'Hidden';
			let c2 = player.c2dead ? player.card2 : 'Hidden';
			status += `${player.user} : ${player.gold} gold, cards : ${c1}, ${c2}`;
		});
		return status;
	}
}

class Player {
	constructor(user, deck) {
		this.message = null;
		this.user = user;
		this.gold = 2;
		this.card1 = deck.shift();
		this.card2 = deck.shift();
		this.c1dead = false;
		this.c2dead = false;
	}

	static createPlayers(users, deck) {
		let players = [];
		users.forEach(user => {
			players.push(new Player(user, deck));
		});
		return players;
	}
}

class Deck {
	constructor(playersNb) {
		let cards = ['Duchesse', 'Assassin', 'Capitaine', 'Ambassadeur', 'Comptesse'];
		let deck = [];
		let eachCardNb = 3;
		if(playersNb > 6) eachCardNb = 4; // 7 or 8 players
		cards.forEach(card => {
			for(let i = 0; i < eachCardNb; ++i) deck.push(card);
		});
		return this.shuffle(deck);
	}

	shuffle(deck) {
		return deck.sort(() => Math.random() - 0.5);
	}
}

exports.ComplotsGame = ComplotsGame;
exports.Player = Player;
exports.Deck = Deck;
