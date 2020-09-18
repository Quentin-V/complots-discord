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
		this.lastAction = '	';
		this.currentPlayer = null;
		this.hasChosen = false;
		this.startGame();
	}


	// Method used to start the game,
	startGame() {
		this.players.forEach(player => player.user.send(this.createPlayerEmbed(player)).then(playerMsg => player.message = playerMsg));
		this.playTurn();
	}
	// Start a new turn
	playTurn() {
		this.hasChosen = false;
		this.currentPlayer = this.players[this.turn++%this.players.length]; // Get the current player
		if(this.currentPlayer.gold >= 10) {
			this.hasChosen = true;
			this.assas7();
		}
		if(this.message === null) {
			this.sendPrincipalMessage();
		}else {
			this.message.edit(`***C'est au tour de ${this.currentPlayer.user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n*${this.currentPlayer.user} choisit une action*\n${this.lastAction}` + this.statusToString());
		}
	}
	// Method used to send the principal message of the game, if it is not created when a turn starts
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
	// Method used to handle the reactions on the principal message
	handleReactions(r, u) {
		r.users.remove(u);
		if(this.currentPlayer.user.id !== u.id || this.hasChosen) return;
		switch (r.emoji.name) {
			case '🟡':
				this.hasChosen = true;
				this.revenu();
				break;
			case '🟨':
				this.hasChosen = true;
				this.aideEtr();
				break;
			case '⚫':
				this.hasChosen = true;
				this.assas7();
				break;
			case '🟣':
				this.hasChosen = true;
				this.duchesse();
				break;
			case '🔴':
				this.hasChosen = true;
				this.assassin();
				break;
			case '🔵':
				this.hasChosen = true;
				this.capitaine();
				break;
			case '🟤':
				this.hasChosen = true;
				this.ambassadeur();
				break;
			default:
				break;
		}
	}


	///////////////////////////////////
	//       Characters actions      //
	///////////////////////////////////

	revenu() {
		// Update the embed in dms
		++this.currentPlayer.gold;
		this.currentPlayer.message.edit(this.createPlayerEmbed(this.currentPlayer));

		// Updates the principal message
		this.lastAction = `*${this.currentPlayer.user} a pris le revenu et gagne 1 pièce d'or*`;
		this.playTurn();
	}

	aideEtr() { // Method called when someone react to use 'Aide etrangere'
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
									if(counterPlayer.card1 === 'Duchesse' && !counterPlayer.c1dead || counterPlayer.card2 === 'Duchesse' && !counterPlayer.c2dead) { // the counter has 'Duchesse' in his hand
										let cardDuchesse = counterPlayer.card1 === 'Duchesse' ? 1 : 2;
										this.changeCard(counterPlayer, cardDuchesse);
										msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'action de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse\n\n**${counter} était Duchesse, ${counter2} doit donc révéler une de ses cartes**`);
										this.revealCard(msg, counterPlayer2).then(deadCard => {
											msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'action de ${this.currentPlayer.user}*\n\n${counter} était bel et bien Duchesse\n\n**${counterPlayer2.user} révèle un(e) _${deadCard}_**`);
											setTimeout(() => {
												this.lastAction = `*${counterPlayer.user} a conté l'aide étrangère de ${this.currentPlayer.user}, et ${counterPlayer2.user} a révélé un(e) ${deadCard}*`;
												msg.delete();
												this.playTurn();
											}, 4000);
										});
									}else { // The counter hasn't a 'Duchesse' in his hand
										// 👈👉
										msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'action de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse\n\n**${counter} n'est pas Duchesse et doit révéler une de ses cartes**`);
										this.revealCard(msg, counterPlayer).then(deadCard => {
											msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'action de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse\n\n**${counterPlayer.user} n'était pas Duchesse et révèle un(e) _${deadCard}_**`);
											setTimeout(() => {
												msg.delete();
												this.lastAction = `*${counter} perd une vie à cause du contre de ${counter2} et ${this.currentPlayer} bénéficie de l'aide étrangère*`;
												this.currentPlayer.gold += 2; // Gives 2 gold to the current player
												this.currentPlayer.message.edit(this.createPlayerEmbed(this.currentPlayer));
												this.playTurn();
											}, 5000);
										});
									}
								}, 3000);
							} // Else nothing happen because the first action has been countered
						});
					});
				}else { // Not countered so the player takes 2 gold
					msg.delete();
					this.currentPlayer.gold += 2; // Gives 2 gold to the current player
					this.currentPlayer.message.edit(this.createPlayerEmbed(this.currentPlayer));
					// Updates the principal message
					this.lastAction = `*${this.currentPlayer.user} bénéficie de l'aide étrangère et prend 2 pièces d'or*`;
					this.playTurn();
				}
			});
		});
	}

	assas7() {
		if(this.currentPlayer.gold < 7) {
			this.actionNotAvailable(7);
			return; // Safe return to avoid any unpurposed code execution
		}
		this.currentPlayer.gold -= 7;
		this.channel.send(`${this.currentPlayer.user}, mentionne une personne pour le tuer, tu as 20 secondes pour choisir.`).then(msg => {
			this.waitTarget(msg).then(target => {
				if(target === null) { // The player hasn't mentioned anyone
					msg.edit(`*${this.currentPlayer.user}, mentionne une personne pour le tuer, tu as 20 secondes pour choisir.*\n${this.currentPlayer.user} n'a pas choisi de cible, iel perd donc 7 pièces et personne ne meurt`);
				}else { // We do have a target
					msg.edit(`*${this.currentPlayer.user}, mentionne une personne pour le tuer, tu as 20 secondes pour choisir.*\n${this.currentPlayer.user} a décidé de tuer ${target.user} qui doit maintenant révéler une de ses cartes.`);
					revealCard(target).then(deadCard => {
						this.lastAction = `*${this.currentPlayer.user} a tué ${userKilled}, qui a révélé un(e) ${deadCard}*`;
						msg.delete();
						this.playTurn();
					});
				}
			});
		});
	}

	duchesse() {
		this.channel.send(`${this.currentPlayer.user} veut faire l'action de la duchesse et prendre 3 pièces d'or.\nPour contrer cette action, régir avec :crossed_swords:️️ dans les 10 secondes.`).then(msg => {
			this.waitCounter(msg).then((countered, counter) => {
				if(counter) { // A player has countered the action
					let counterPlayer;
					this.players.forEach(player => if(player.user.id === counter.id) counterPlayer = player);
					if(this.currentPlayer.card1 === 'Duchesse' && !this.currentPlayer.c1dead || this.currentPlayer.card2 === 'Duchesse' && !this.currentPlayer.c2dead) { // The current player has a Duchesse
						msg.edit(`${this.currentPlayer.user} se fait contrer par ${counter} mais il avait bien une Duchesse`);
						this.changeCard(this.currentPlayer);
						this.revealCard(counterPlayer).then(deadCard => {
							this.lastAction = `${this.currentPlayer.user} prend 3 pièces d'or et ${counter} perd un(e) ${deadCard} car ${this.currentPlayer.user} avait bien une Duchesse`;
							this.currentPlayer.gold += 3;
							msg.delete();
							this.playTurn();
							return; // Safe return to avoid any unpurposed code execution
						});
					}else {
						msg.edit(`${this.currentPlayer.user} se fait contrer par ${counter} et n'avait pas de Duchesse`);
						this.revealCard(this.currentPlayer).then(deadCard => {
							this.lastAction = `${this.currentPlayer.user} s'est fait contré par ${counterPlayer} et a perdu un(e) ${deadCard}`;
							msg.delete();
							this.playTurn();
							return; // Safe return to avoid any unpurposed code execution
						});
					}
				}else { // No one countered so the player takes 3 gold
					this.currentPlayer.gold += 3;
					msg.delete();
					this.lastAction = `*${this.currentPlayer.user} a effectué l'action de la Duchesse et a pris 3 pièces d'or*`;
					this.playTurn();
					return; // Safe return to avoid any unpurposed code execution
				}
			});
		});
	}

	assassin() {
		if(this.currentPlayer.gold < 3) {
			this.actionNotAvailable(3);
			return; // Safe return to avoid any unpurposed code execution
		}
		this.currentPlayer.gold -= 3
		this.channel.send(`${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.`).then(msg => {
			this.waitTarget(msg).then(target => { // Waiting for the player to select  target
				if(target === null) { // If the player hasn't selected a target
					tihs.lastAction = `${this.currentPlayer.user} voulait assassiner en tant qu'assassin mais n'a pas choisi de cible.`;
					msg.delete();
					this.playTurn();
					return; // Safe return to avoid any unpurposed code execution
				}else { // The player has selected a target
					msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.*\n\n${target.user} est la cible de l'assassinat, il est possible de le contrer avec une Comptesse. Pour t'affirmer Comptesse, réagit avec :crossed_swords:️️ dans les 10 secondes.`);
					this.waitCounter(msg).then((countered, counter) => { // Edit the message and wait for the target to counter or not
						if(countered) { // If the target has countered the action
							msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.*\n\n**${target.user} contre l'assassinat en s'affirmant Comptesse, si quelqu'un pense que ce n'est pas le cas, réagissez à ce message avec :crossed_swords:️️ dans les 10 secondes.**`);
							this.waitCounter(msg).then((countered2, counter2) => {
								if(countered2) { // someone countered the counter and thinks the first counter is not a Comptesse
									let counterPlayer, counterPlayer2;
									this.players.forEach(player => { // Find the player of the counter to know the cards
										if     (player.user.id === counter.id ) counterPlayer  = player;
										else if(player.user.id === counter2.id) counterPlayer2 = player;
									});
									if(counterPlayer.card1 === 'Comptesse' && !counterPlayer.c1dead || counterPlayer.card2 === 'Comptesse' && !counterPlayer.c2dead) { // The first counter wasn't lying and has a Comptesse
										msg.edit(`*${target.user} contre l'assassinat en s'affirmant Comptesse, si quelqu'un pense que ce n'est pas le cas, réagissez à ce message avec :crossed_swords:️️ dans les 10 secondes.*\n\n**${counterPlayer2.user} pense que ${counterPlayer.user} n'est pas Comptesse mais ${counterPlayer.user} ne mentait pas.\n${counterPlayer2.user} doit choisir une carte à révéler.**`);
										this.revealCard(counterPlayer2).then(deadCard => {
											msg.delete();
											this.lastAction = `*${this.counterPlayer2} voulait contrer ${target.user} qui s'est affirmé Comptesse mais iel ne mentait pas, ${this.currentPlayer2} révèle un(e) ${deadCard}*`;
											this.playTurn();
											return; // Safe return
										});
									}else { // The first counter was lying and doesn't have a Comptesse
										// He loses 2 cards one because of the murder and one because of the failed counter
										this.revealCard(msg, counterPlayer, true).then(d => {
											msg.delete();
											this.lastAction = `${counterPlayer.user} perd ses 2 cartes à cause de l'assassinat et du contre raté.`;
											this.playTurn();
											return; // Safe return
										});
									}
								}else { // Nobody counters the counter so nothing happens except that the first player loses 3 gold.
									this.lastAction = `**${this.currentPlayer.user} voulait assassiner ${target.user} mais ${target.user} s'est affirmé(e) Comptesse.`;
									this.playTurn();
									return; // Safe return
								}
							});
						}else { // The target hasn't countered and lose a card
							msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.*\n\n**${target.user} n'a pas contré l'assassinat et va donc perdre une carte.**`);
							revealCard(target).then(deadCard => {
								msg.delete();
								this.lastAction = ``;
								this.playTurn();
								return; // Safe return to avoid any unpurposed code execution
							});
						}
					});
				}
			});
		});
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


	///////////////////////////////////
	//         Useful methods        //
	///////////////////////////////////

	actionNotAvailable(minimumGold) {
		this.hasChosen = false;
		this.channel.send(`${this.currentPlayer.user}, tu ne peux pas effectuer cette action, il te faut ${minimumGold} pièces d'or pour l'effectuer`).then(msg => {
			setTimeout(() => {
				msg.delete();
			}, 4000)
		});
	}

	revealCard(msg, player, both = false) {
		return new Promise(function(resolve, reject) {
			let deadCard;
			if(player.c1dead || player.c2dead || both) {
				if(c1dead && !both) {
					player.c2dead = true;
					deadCard = player.card1;
				}else if(!both){
					player.c1dead = true;
					deadCard = player.card1;
				}else {
					player.c1dead = true;
					player.c2dead = true;
					let deadCard = null;
				}
				player.message.delete();
				player.message.channel.send(this.createPlayerEmbed(player)).then( newdm => player.message = newdm);
				let playerToRemove = this.players.find(p => {p.user.id === pllayer.user.id}); // Find the player to remove
				let indPlayerToRemove = this.players.indexOf(playerToRemove); // Get his index in the array
				if(indPlayerToRemove !== -1) this.players.splice(indPlayerToRemove, 1); // Removes it frm the array
				resolve(deadCard);
			}else {
				player.user.send(`Réagis à ce message pour décider quelle carte tu veux dévoiler : \n:point_left: : ${player.card1}\n:point_right: : ${player.card2}`).then(dm => {
					let filter = (r,u) => !u.bot;
					msg.react('👈');
					msg.react('👉');
					let collector = msg.createReactionCollector(filter, {time: 15000});
					collector.on('collect', (r, u) => {
						msg.delete();
						if(r.emoji.name === '👈') {
							player.c1dead = true;
							deadCard = player.card1;
						}else if(r.emoji.name === '👉') { // 👉
							player.c2dead = true;
							deadCard = player.card2;
						}
						player.message.delete();
						player.message.channel.send(this.createPlayerEmbed(player)).then( newdm => player.message = newdm);
						resolve(deadCard);
					});
				});
			}
		});
	}

	changeCard(player, cardNb) { // Exchange a card from a player hand with deck (can pick the card he just put back in the deck)
		this.deck.push(player['card' + cardNb])
		this.deck = this.deck.shuffle(this.deck);
		player['card' + cardNb] = this.deck.shift();
		player.message.delete();
		player.message.channel.send(this.createPlayerEmbed(player)).then(dm => {
			player.message = dm;
		});
	}

	waitCounter(msg, targeted = null) { // Wait for a reaction on a message to execute the action linked to a counter
		return new Promise(function(resolve, reject) {
			msg.react('⚔️');
			if(targeted === null) {
				let filter = (r, u) => !u.bot && !u.id === this.currentPlayer.user.id;
			}else {
				let filter = (r, u) => !u.bot && u.id === targeted.user.id;
			}
			let collector = msg.createReactionCollector(filter, {time:10000});
			collector.on('collect', (r, u) => {
				msg.reactions.removeAll();
				collector.stop('countered');
				resolve(true, u);
			});
			collector.on('end', (coll, reason) => {
				msg.reactions.removeAll();
				if(reason !== 'countered') {
					resolve(false, null);
				}
			});
		});
	}

	waitTarget(msg) {
		return new Promise(function(resolve, reject) {
			let alreadyEdited = false;
			let secondEdit = false;
			let filter = m => m.mentions.users.array()[0] !== undefined && m.author.id === this.currentPlayer.user.id;
			let collector = this.channel.createMessageCollector(filter, {time: 20000});
			collector.on('collect', m => {
				m.delete();
				let target = m.mentions.users.array()[0];
				if(target === undefined) {
					if(!alreadyEdited) {
						msg.edit(msg.content + `\n**${this.currentPlayer.user}, il faut mentionner la personne que tu vise avec son @**`);
						alreadyEdited = true;
					}
				}else {
					let playerTarget;
					this.players.forEach(player => if(player.user.id === userKilled.id) playerTarget = player);
					if(playerTarget === undefined) {
						if(!secondEdit) {
							msg.edit(msg.content + `\n**${this.currentPlayer.user}, la personne que tu as visée n'est pas dans la partie, mentionne une personne qui est dans la partie en cours et en vie.**`);
							secondEdit = true;
						}
					}else {
						collector.stop('targeted');
						resolve(playerTarget);
					}
				}
			});
			collector.on('end', (c, reason) => {
				if(reason !== 'targeted') {
					resolve(null);
				}
			});
		});
	}

	statusToString() { // Returns a string containing a status of all players
		let status = `\n\n`;
		this.players.forEach(player => {
			let c1 = player.c1dead ? player.card1 : 'Hidden';
			let c2 = player.c2dead ? player.card2 : 'Hidden';
			status += `${player.user} : ${player.gold} gold, cards : ${c1}, ${c2}`;
		});
		return status;
	}

	createPlayerEmbed(player) { // Returns an embed for the dm
		let c1file = player.c1dead ? 'bw' + player.card1.toLowerCase() : player.card1.toLowerCase();
		let c2file = player.c2dead ? 'bw' + player.card2.toLowerCase() : player.card2.toLowerCase();
		let c1 = player.c1dead ? player.card1 + '(Dead)' : player.card1;
		let c2 = player.c2dead ? player.card2 + '(Dead)' : player.card2;
		let attached = c1file + '_' + c2file + '.png';
		return new MessageEmbed()
		.setTitle('Voici tes cartes')
		.setDescription(c1 + ' et ' + c2)
		.attachFiles(['./resources/comp/'+attached])
		.setImage('attachment://'+attached)
		.addField('Argent', player.gold);
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
