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
		this.channel.send(`***C'est au tour de ${this.players[this.turn++%this.players.length].user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n*${this.players[this.turn++%this.players.length].user} choisit une action*` + statusToString()).then(message => { // add 1 to the turn variable after displaying it
			this.message = message;
			message.react('🟡');
			message.react('🟨');
			message.react('⚫');
			message.react('🟣');
			message.react('🔴');
			message.react('🔵');
			message.react('🟤');
			let filter = (reaction, user) => !user.bot;
			// ^^^^ Will fire the collector only with specified emojis and if the reactor is ont a bot.
			this.collector = message.createReactionCollector(filter); // Create the reaction collector with the filter above
			this.collector.on('collect', (r, u) => {
				r.users.remove(u);
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
			});
		});
	}

	revenu() {
		// Update the embed in dms
		let currentPlayer = this.players[this.turn++%this.players.length]; // Get the current player
		++currentPlayer.gold;
		this.channel.send("Revenu");
		let embed = new MessageEmbed()
		.setTitle('Voici tes cartes')
		.setDescription(currentPlayer.card1 + ' et ' + currentPlayer.card2)
		.attachFiles(['./resources/comp/'+currentPlayer.card1.toLowerCase()+'_'+currentPlayer.card2.toLowerCase()+'.png'])
		.setImage('attachment://'+currentPlayer.card1.toLowerCase()+'_'+currentPlayer.card2.toLowerCase()+'.png')
		.addField('Argent', currentPlayer.gold);
		currentPlayer.message.edit(embed);

		// Updates the principal message
		this.message.edit(`***C'est au tour de ${this.players[this.turn++%this.players.length].user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n*${this.players[this.turn++%this.players.length].user} a pris le revenu et gagne 1 pièce d'or*` + statusToString());

	}

	aideEtr() {
		this.channel.send("Aide Etrangère");
		// TODO: Faire la méthode
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

	statusToString() {
		let status = `\n\n`;
		this.players.forEach(player => {
			let c1 = player.c1dead ? 'Hidden' : player.card1;
			let c2 = player.c2dead ? 'Hidden' : player.card2;
			status += `${player.user} : ${player.gold} gold, cards : ${c1}, ${c2}`;
		});

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
