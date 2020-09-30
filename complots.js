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
		this.finished = false;
		this.startGame();
	}


	// Method used to start the game,
	startGame() {
		this.players.forEach(player => player.user.send(this.createPlayerEmbed(player)).then(playerMsg => player.message = playerMsg));
		this.playTurn();
	}
	// Start a new turn
	playTurn() {
		if(this.finished) return;

		this.hasChosen = false;

		do {
			this.currentPlayer = this.players[this.turn++%this.players.length]; // Get the current player
		} while (this.currentPlayer.dead); // Skip the dead players

		if(this.currentPlayer.gold >= 10) {
			this.hasChosen = true;
			this.assas7();
		}
		if(this.message === null) {
			this.sendPrincipalMessage();
		}else {
			this.message.edit(`***C'est au tour de ${this.currentPlayer.user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n${this.lastAction}` + this.statusToString());
		}
	}
	// Method used to send the principal message of the game, if it is not created when a turn starts
	sendPrincipalMessage() {
		this.channel.send(`***C'est au tour de ${this.currentPlayer.user}***\nRéagir pour effectuer une action :\n\t🟡 Prendre le revenu\n\t🟨 Aide étrangère\n\t⚫ Assassiner quelqu'un pour 7 pièces d'or\n\t🟣 Action de la Duchesse\n\t🔴 Action de l'Assassin\n\t🔵 Action du Capitaine\n\t🟤 Action de l'ambassadeur\n\n${this.lastAction}` + this.statusToString()).then(message => { // add 1 to the turn variable after displaying it
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
			this.waitCounter(msg).then(counter => { // Wait to see if anyone counters the action
				if(counter !== undefined) {
					let counterPlayer  = this.players.find(p => p.user.id === counter.id); // If the action is countered
					msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n\n${counter} contre l'aide étrangère (S'affirme Duchesse) de ${this.currentPlayer.user}\nPour contrer cette action, réagissez avec :crossed_swords:️️ dans les 10 secondes`).then(msg => {
						this.waitCounter(msg, null, true, counterPlayer).then(counter2 => { // Ask again to see if anyone counters the counter
							if(counter2 !== undefined) { // If the counter is countered
								let counterPlayer2 = this.players.find(p => p.user.id === counter2.id);
								msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'aide étrangère (S'affirme Duchesse) de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse`);
								setTimeout(() => { // Timeout for suspens
									if(counterPlayer.card1 === 'Duchesse' && !counterPlayer.c1dead || counterPlayer.card2 === 'Duchesse' && !counterPlayer.c2dead) { // the counter has 'Duchesse' in his hand
										let cardDuchesse = counterPlayer.card1 === 'Duchesse' ? 1 : 2;
										this.changeCard(counterPlayer, cardDuchesse);
										msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'aide étrangère (S'affirme Duchesse) de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse\n\n${counter} était Duchesse, ${counter2} doit donc révéler une de ses cartes`);
										this.revealCard(counterPlayer2).then(deadCard => {
											msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'aide étrangère (S'affirme Duchesse) de ${this.currentPlayer.user}*\n\n${counter} était bel et bien Duchesse\n\n${counterPlayer2.user} révèle un(e) ${deadCard}`);
											setTimeout(() => {
												this.lastAction = `*${counterPlayer.user} a contré l'aide étrangère de ${this.currentPlayer.user}, et ${counterPlayer2.user} a révélé un(e) ${deadCard} car iel pensait que ${counterPlayer.user} n'était pas Duchesse.*`;
												msg.delete();
												this.playTurn();
											}, 3000);
										});
									}else { // The counter hasn't a 'Duchesse' in his hand
										msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'aide étrangère (S'affirme Duchesse) de ${this.currentPlayer.user}\n\n${counter2} pense que ${counter} n'est pas Duchesse*\n\n${counter} n'est pas Duchesse et doit révéler une de ses cartes`);
										this.revealCard(counterPlayer).then(deadCard => {
											msg.edit(`*${this.currentPlayer.user} veut prendre l'aide étrangère (contré par la Duchesse)*\n*${counter} contre l'aide étrangère (S'affirme Duchesse) de ${this.currentPlayer.user}*\n\n${counter2} pense que ${counter} n'est pas Duchesse\n\n**${counterPlayer.user} n'était pas Duchesse et révèle un(e) ${deadCard}**`);
											setTimeout(() => {
												msg.delete();
												this.lastAction = `*${counter} perd une vie à cause du contre de ${counter2} car iel n'était pas Duchesse et ${this.currentPlayer.user} bénéficie de l'aide étrangère*`;
												this.currentPlayer.gold += 2; // Gives 2 gold to the current player
												this.currentPlayer.message.edit(this.createPlayerEmbed(this.currentPlayer));
												this.playTurn();
											}, 3000);
										});
									}
								}, 3000);
							}else { // Else nothing happen because the first action has been countered
								msg.delete();
								this.lastAction = `*${this.currentPlayer.user} se fait contrer son aide étrangère par ${counter}*`;
								this.playTurn();
								return;
							}
						});
					});
				}else { // Not countered so the player takes 2 gold
					msg.delete();
					this.currentPlayer.gold += 2; // Gives 2 gold to the current player
					this.currentPlayer.message.edit(this.createPlayerEmbed(this.currentPlayer));
					this.lastAction = `*${this.currentPlayer.user} bénéficie de l'aide étrangère et prend 2 pièces d'or*`;
					this.playTurn();
					return;
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
					this.revealCard(target).then(deadCard => {
						this.lastAction = `*${this.currentPlayer.user} a tué ${target.user}, qui a révélé un(e) ${deadCard}*`;
						msg.delete();
						this.playTurn();
					});
				}
			});
		});
	}

	duchesse() {
		this.channel.send(`${this.currentPlayer.user} veut faire l'action de la duchesse et prendre 3 pièces d'or.\nPour contrer cette action, régir avec :crossed_swords:️️ dans les 10 secondes.`).then(msg => {
			this.waitCounter(msg).then(counter => {
				if(counter !== undefined) { // A player has countered the action
					msg.edit(`${counter} pense que ${this.currentPlayer.user} n'est pas Duchesse`);
					let counterPlayer = this.players.find(p => p.user.id === counter.id);
					if(this.currentPlayer.card1 === 'Duchesse' && !this.currentPlayer.c1dead || this.currentPlayer.card2 === 'Duchesse' && !this.currentPlayer.c2dead) { // The current player has a Duchesse
						setTimeout(() => {
							msg.edit(`${this.currentPlayer.user} se fait contrer par ${counter} mais il avait bien une Duchesse\n${counter} perd une vie.`);
							this.revealCard(counterPlayer).then(deadCard => {
								this.lastAction = `*${this.currentPlayer.user} prend 3 pièces d'or et ${counter} perd un(e) ${deadCard} car ${this.currentPlayer.user} avait bien une Duchesse*`;
								this.currentPlayer.gold += 3;
								msg.delete();
								this.playTurn();
							});
							if(!this.finished)
								this.changeCard(this.currentPlayer);
						}, 3000);
					}else {
						setTimeout(() => {
							msg.edit(`${this.currentPlayer.user} se fait contrer par ${counter} et n'avait pas de Duchesse\nIl perd donc une vie`);
							this.revealCard(this.currentPlayer).then(deadCard => {
								this.lastAction = `*${this.currentPlayer.user} s'est fait contré par ${counterPlayer} et a perdu un(e) ${deadCard}*`;
								msg.delete();
								this.playTurn();
							});
						}, 3000);
					}
				}else { // No one countered so the player takes 3 gold
					this.currentPlayer.gold += 3;
					msg.delete();
					this.lastAction = `*${this.currentPlayer.user} a effectué l'action de la Duchesse et a pris 3 pièces d'or*`;
					this.playTurn();
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
				}else { // The player has selected a target
					msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.*\n\n${target.user} est la cible de l'assassinat, il est possible de le contrer avec une Comptesse. Pour t'affirmer Comptesse, réagit avec :crossed_swords:️️ dans les 10 secondes.`);
					this.waitCounter(msg, target).then(counter => { // Edit the message and wait for the target to counter or not
						if(counter !== undefined) { // If the target has countered the action
							let counterPlayer = this.players.find(p => p.user.id === counter.id);
							msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.*\n\n**${target.user} contre l'assassinat en s'affirmant Comptesse, si quelqu'un pense que ce n'est pas le cas, réagissez à ce message avec :crossed_swords:️️ dans les 10 secondes.**`);
							this.waitCounter(msg, null, true, counterPlayer).then(counter2 => {
								if(counter2 !== undefined) { // someone countered the counter and thinks the first counter is not a Comptesse
									msg.edit(`*${target.user} contre l'assassinat en s'affirmant Comptesse.*\n${counter2} pense que ${counter} n'est pas Comptesse.`);

									let counterPlayer2 = this.players.find(p => p.user.id === counter2.id);

									if(counterPlayer.card1 === 'Comptesse' && !counterPlayer.c1dead || counterPlayer.card2 === 'Comptesse' && !counterPlayer.c2dead) { // The first counter wasn't lying and has a Comptesse
										setTimeout(() => { // Timeout for suspens
											msg.edit(`*${target.user} contre l'assassinat en s'affirmant Comptesse.\n${counter2} pense que ${counter} n'est pas Comptesse.* ${counterPlayer.user} ne mentait pas, ${counter2.user} perd une vie.`);
											this.revealCard(counterPlayer2).then(deadCard => {
												msg.delete();
												this.lastAction = `*${counter2} voulait contrer ${target.user} qui s'est affirmé Comptesse mais iel ne mentait pas, ${counter2} révèle un(e) ${deadCard}*`;
												this.playTurn();
											});
										}, 3000);
									}else { // The first counter was lying and doesn't have a Comptesse
										// He loses 2 cards one because of the murder and one because of the failed counter
										this.revealCard(counterPlayer, true).then(d => {
											msg.delete();
											this.lastAction = `*${counter} perd ses 1 carte avec l'assassinat de ${this.currentPlayer.user} et une carte car ${counter2} contre son contre et ${counter} n'avait pas de Comptesse.*`;
											this.playTurn();
										});
									}
								}else { // Nobody counters the counter so nothing happens except that the first player loses 3 gold.
									this.lastAction = `*${this.currentPlayer.user} voulait assassiner ${target.user} mais ${target.user} s'est affirmé(e) Comptesse.*`;
									this.playTurn();
								}
							});
						}else { // The target hasn't countered and lose a card
							msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'assassin, iel doit mentioner la personne visée.*\n\n${target.user} n'a pas contré l'assassinat et va donc perdre une carte.`);
							this.revealCard(target).then(deadCard => {
								msg.delete();
								this.lastAction = `*${this.currentPlayer.user} a tué ${target.user} en tant qu'Assassin, iel révèle un(e) ${deadCard}*`;
								this.playTurn();
							});
						}
					});
				}
			});
		});
	}

	capitaine() {
		this.lastAction = `*`;
		this.channel.send(`${this.currentPlayer.user} veut effectuer l'action du capitaine, iel doit choisir une cible en mentionnant une personne.`).then(msg => {
			this.waitTarget(msg).then(target => {
				if(target === null) { // No target was given
					this.lastAction = `*${this.currentPlayer.user} voulait faire l'action du capitaine mais n'a pas choisi de cible.*`;
					msg.delete();
					this.playTurn();
				}else { // There is a target for the steal
					msg.edit(`${this.currentPlayer.user} veut voler 2 pièces à ${target.user}, si vous pensez que ${this.currentPlayer.user} n'est pas capitaine, réagissez à ce message avec :crossed_swords:️️ dans les 10 secondes`).then(() => {
						this.waitCounter(msg).then(counter => {
							if(counter !== undefined) { // Someone countered the capitaine

								let counterPlayer = this.players.find(p => p.user.id === counter.id); // Define counterPlayer
								msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}.*\n${counter} pense que ${this.currentPlayer.user} n'est pas Capitaine.`);

								if(!this.currentPlayer.c1dead && this.currentPlayer.card1 === 'Capitaine' || !this.currentPlayer.c2dead && this.currentPlayer.card2 === 'Capitaine') { // If the player wasn't lying
									setTimeout(() => { // Timeout for suspens
										msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}.\n${counter} pense que ${this.currentPlayer.user} n'est pas Capitaine.*\n${this.currentPlayer.user} ne mentait pas, ${counter} perd une vie.`);
										this.revealCard(counterPlayer).then(deadCard => {
											this.lastAction += `${counter.user} pensait que ${this.currentPlayer.user} n'était pas Capitaine mais iel ne mentait pas. `;
										});
										this.changeCard(this.currentPlayer, (!this.currentPlayer.c1dead && this.currentPlayer.card1 === 'Capitaine') ? 1 : 2)
										this.startCap(msg, target);
									}, 3000);
								}else { // If the player was actually lying
									setTimeout(() => {
										msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}.\n${counter} pense que ${this.currentPlayer.user} n'est pas Capitaine.*\n${this.currentPlayer.user} n'était pas capitaine et perd donc une vie.`);
										this.revealCard(counterPlayer).then(deadCard => {
											this.lastAction += `${counter} contre le vol de ${this.currentPlayer.user} qui n'était pas Capitaine et révèle un(e) ${deadCard}.**`;
											msg.delete();
											this.playTurn();
										});
									}, 3000);
								}
							}else { // It's not countered
								this.startCap(msg, target);
							}
						});
					});
				}
			})
		});
	}

	// 2 methods used to make capitaine() lighter
	startCap(msg, target) {
		msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}*\n${target.user} peut contrer l'action en s'affirmant Capitaine ou Ambassadeur, pour faire cela, réagis avec :crossed_swords: dans les 10 secondes`).then(edited => {
			this.waitCounter(edited, target).then(counterSteal => {
				if(counterSteal !== undefined) { // Si la cible contre le vol
					msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}*\n${target.user} se dit Capitaine et contre le vol. Si vous pensez que ${target.user} n'est pas capitaine, réagissez avec :crossed_swords: dans les 10 secondes.`).then(reEdited => {
						this.waitCounter(reEdited, null, true, target).then(counterStolen => {
							if(counterStolen !== undefined) {
								let counterStolenPlayer = this.players.find(p => p.user.id === counterStolen.id);
								if(!target.c1dead && (target.card1 === 'Capitaine' || target.card1 === 'Ambassadeur') || !target.c2dead && (target.card2 === 'Capitaine' || target.card2 === 'Ambassadeur')) { // The target is a Capitaine or Ambassadeur and wasn't lying on the counter
									msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}\n${target.user} se dit Capitaine ou AMbassadeur et contre le vol.*\n${counterStolen.user} pensait que ${target.user} n'était pas Capitaine, mais iel ne mentait pas. ${counterStolen.user} choisit une carte à révéler.`);
									this.revealCard(counterStolenPlayer).then(deadCard => {
										this.lastAction += `${target.user} a contré le vol en tant que Capitaine ou Ambassadeur et ${counterStolen.user} perd un(e) ${deadCard} car iel ne l'a pas cru.*`;
										msg.delete();
										this.playTurn();
										this.changeCard(target, (!target.c1dead && (target.card1 === 'Capitaine' || target.card1 === 'Ambassadeur')) ? 1 : 2);
									});
								}else { // The target wasn't a capitaine and was lying
									msg.edit(`*${this.currentPlayer.user} veut voler 2 pièces à ${target.user}\n${target.user} se dit Capitaine ou Ambassadeur et contre le vol.*\n${target.user} n'était pas Capitaine et perd une vie.`);
									this.capSteal(this.currentPlayer, target); // Steal maximum 2 gold from the target
									this.revealCard(target).then(deadCard => {
										this.lastAction += `${target.user} se fait voler 2 pièces par ${this.currentPlayer.user} et perd un(e) ${deadCard} en ratant son contre.**`;
										msg.delete();
										this.playTurn();
									});
								}
							}else { // Nothing happens because everybody believes the counter
								this.lastAction += `${target.user} a contré le vol de ${this.currentPlayer.user} en s'affirmant Capitaine*`;
								msg.delete();
								this.playTurn();
							}
						});
					});
				}else {
					this.capSteal(this.currentPlayer, target); // Steal maximum 2 gold from the target
					this.lastAction += `${this.currentPlayer.user} a volé 2 pièces à ${target.user}.*`;
					msg.delete();
					this.playTurn();
				}
			});
		});
	}
	capSteal(stealer, stolen) {
		if(stolen.gold >= 2) {
			stealer.gold += 2;
			stolen.gold -= 2;
		}else if(stolen.gold == 1) {
			++stealer.gold;
			--stolen.gold;
		}
	}

	ambassadeur() {
		this.lastAction = `*`;
		this.channel.send(`${this.currentPlayer.user} veut effectuer l'action de l'ambassadeur, pour contrer ceci, réagir avec :crossed_swords: dans les 10 secondes`).then(msg => {
			this.waitCounter(msg).then(counter => {
				if(counter !== undefined) {
					let counterPlayer = this.players.find(p => p.user.id === counter.id);
					msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'ambassadeur*\n${counter} pense que ${this.currentPlayer.user} n'est pas Ambassadeur.`);
					if(!this.currentPlayer.c1dead && this.currentPlayer.card1 === 'Ambassadeur' || !this.currentPlayer.c2dead && this.currentPlayer.card2 === 'Ambassadeur') { // Not lying
						setTimeout(() => {
							msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'ambassadeur\n${counter} pense que ${this.currentPlayer.user} n'est pas Ambassadeur.*\n${this.currentPlayer.user} ne mentait pas donc ${counter} perd une vie.`).then(newMsg => {
								this.revealCard(counterPlayer).then(deadCard => {
									this.lastAction += `${counter} contre mais ${this.currentPlayer.user} ne mentait pas, ${counter} perd un(e) ${deadCard}. `;
									if(!this.finished)
										this.ambassAction(newMsg);
									else
										newMsg.delete();
								});
							});
						}, 3000);
					}else { // Lying
						setTimeout(() => {
							msg.edit(`*${this.currentPlayer.user} veut effectuer l'action de l'ambassadeur\n${counter} pense que ${this.currentPlayer.user} n'est pas Ambassadeur.*\n${this.currentPlayer.user} n'était pas Ambaassadeur et perd donc une vie.`);
							this.revealCard(this.currentPlayer).then(deadCard => {
								this.lastAction = `*${this.currentPlayer.user} voulait affectuer l'action de l'Ambassadeur mais s'est fait contrer par ${counter.user} et révèle un(e) ${deadCard}*`;
								msg.delete();
								this.playTurn();
							});
						}, 3000);
					}
				}else { // Not countered
					this.ambassAction(msg);
				}
			});
		});
	}
	// Method of the action of the ambassadeur
	ambassAction(msg) {
		msg.edit(`${this.currentPlayer.user} est en train d'effectuer l'action de l'ambassadeur.`);
		let cardsToChoose = [];
		let nbKeep = 2;
		if(!this.currentPlayer.c1dead) cardsToChoose.push(this.currentPlayer.card1);
		else nbKeep = 1;
		if(!this.currentPlayer.c2dead) cardsToChoose.push(this.currentPlayer.card2);
		else nbKeep = 1;
		cardsToChoose.push(this.deck.shift());
		cardsToChoose.push(this.deck.shift());
		let index = 0;
		let cardsStr = ``;
		cardsToChoose.forEach(c => {
			cardsStr += `${index} : ${cardsToChoose[index++]}\n`;
		});

		this.currentPlayer.user.send(`Tu pioches 2 cartes et doit en choisir ${nbKeep} à garder parmi les suivantes (séparer les choix par un espace)  :\n${cardsStr}`).then(dm => {
			let filter = m => {
				let shouldReturn = false;
				let count = 0;
				m.content.split(' ').forEach(e => {
					++count;
					if(isNaN(parseInt(e, 10)) || parseInt(e, 10) >= index || m.author.bot) {
						shouldReturn = true;
						return;
					}
				});
				if(shouldReturn) return false;
				if(count !== nbKeep) return false;
				return true;
			}
			let collector = dm.channel.createMessageCollector(filter, {time: 20000});
			collector.on('collect', c => {
				let chosen = c.content.split(' ');
				let chosenIndex = [];
				chosen.forEach(i => {
					chosenIndex.push(parseInt(i, 10));
				});
				this.replaceCards(this.currentPlayer, chosenIndex, cardsToChoose);
				this.deck = this.deck.concat(cardsToChoose);
				this.deck = Deck.shuffle(this.deck);
				collector.stop('chosen');
			});

			collector.on('end', (c, r) => {
				if(r !== 'chosen') {
					cardsToChoose.shift()
					if(!this.currentPlayer.c1dead && !this.currentPlayer.c2dead)
						cardsToChoose.shift()
					this.deck = this.deck.concat(cardsToChoose);
					this.deck = Deck.shuffle(this.deck);
				}
				this.lastAction += `${this.currentPlayer.user} a fait l'action de l'ambassadeur.*`;
				this.playTurn();
				dm.delete();
				msg.delete();
			});
		});
	}

	replaceCards(player, chosen, cardsToChoose) {
		if(player.c1dead) {
			player.card2 = cardsToChoose[chosen[0]];
		}else if(player.c2dead) {
			player.card1 = cardsToChoose[chosen[0]];
		}else {
			player.card1 = cardsToChoose[chosen[0]];
			player.card2 = cardsToChoose[chosen[1]];
		}
		player.message.delete();
		player.user.send(this.createPlayerEmbed(player));
	}

	///////////////////////////////////
	//         Useful methods        //
	///////////////////////////////////

	actionNotAvailable(minimumGold) {
		this.hasChosen = false;
		this.channel.send(`${this.currentPlayer.user}, tu ne peux pas effectuer cette action, il te faut ${minimumGold} pièces d'or pour l'effectuer`).then(msg => {
			setTimeout(() => {
				msg.delete();
			}, 3000)
		});
	}

	revealCard(player, both = false) {
		let game = this;
		return new Promise(function(resolve, reject) {
			let deadCard;
			if(player.c1dead || player.c2dead || both) {
				if(player.c1dead && !both) {
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

				player.dead = true;
				let countAlive = game.players.filter(p => !p.dead).length;
				if(countAlive === 1) {
					game.finished = true;
					game.finishGame();
				}else {
					player.message.delete();
					player.message.channel.send(game.createPlayerEmbed(player)).then( newdm => player.message = newdm);
				}
				setTimeout(() => {
					resolve(deadCard);
				}, 3000);
			}else {
				player.user.send(`Réagis à ce message pour décider quelle carte tu veux dévoiler : \n:point_left: : ${player.card1}\n:point_right: : ${player.card2}`).then(dm => {
					let filter = (r,u) => !u.bot;
					// 👈👉
					dm.react('👈');
					dm.react('👉');
					let collector = dm.createReactionCollector(filter, {time: 15000});
					collector.on('collect', (r, u) => {
						dm.delete();
						if(r.emoji.name === '👈') {
							player.c1dead = true;
							deadCard = player.card1;
						}else if(r.emoji.name === '👉') {
							player.c2dead = true;
							deadCard = player.card2;
						}
						player.message.delete();
						player.message.channel.send(game.createPlayerEmbed(player)).then(newdm => player.message = newdm);
						resolve(deadCard);
					});
				});
			}
		});
	}

	changeCard(player, cardNb) { // Exchange a card from a player hand with deck (can pick the card he just put back in the deck)
		this.deck.push(player['card' + cardNb])
		this.deck = Deck.shuffle(this.deck);
		player['card' + cardNb] = this.deck.shift();
		player.message.delete();
		player.message.channel.send(this.createPlayerEmbed(player)).then(dm => {
			player.message = dm;
		});
	}

	waitCounter(msg, targeted = null, currentPlayerCanCounter = false, cantCounterPlayer = null) { // Wait for a reaction on a message to execute the action linked to a counter
		let game = this;
		return new Promise(function(resolve, reject) {
			msg.react('⚔️').then(reacted => {
				let filter = (r, u) => {
					if(u.bot) return false;
					if(targeted !== null && u.id !== targeted.user.id) return false; // If there is a target but the ocunter is not the target
					if(!currentPlayerCanCounter && u.id === game.currentPlayer.user.id) return false; // If the current player can't counter but he's countering
					if(cantCounterPlayer != null && u.id === cantCounterPlayer.user.id) return false; // If a player can't counter but he's countering
					return true;
				};
				let collector = msg.createReactionCollector(filter, {time:10000});
				collector.on('collect', (r, u) => {
					msg.reactions.removeAll();
					collector.stop('countered');
					resolve(u);
				});
				collector.on('end', (coll, reason) => {
					msg.reactions.removeAll();
					if(reason !== 'countered') {
						resolve();
					}
				});
			});
		});
	}

	waitTarget(msg) {
		let game = this;
		return new Promise(function(resolve, reject) {
			let alreadyEdited = false;
			let secondEdit = false;
			let filter = m => m.mentions.users.array()[0] !== undefined && m.author.id === game.currentPlayer.user.id;
			let collector = game.channel.createMessageCollector(filter, {time: 20000});
			collector.on('collect', m => {
				m.delete();
				let target = m.mentions.users.array()[0];
				if(target === undefined) {
					if(!alreadyEdited) {
						msg.edit(msg.content + `\n**${game.currentPlayer.user}, il faut mentionner la personne que tu vise avec son @**`);
						alreadyEdited = true;
					}
				}else {
					let playerTarget;
					game.players.forEach(player => {if(player.user.id === target.id) playerTarget = player});
					if(playerTarget === undefined) {
						if(!secondEdit) {
							msg.edit(msg.content + `\n**${game.currentPlayer.user}, la personne que tu as visée n'est pas dans la partie, mentionne une personne qui est dans la partie en cours et en vie.**`);
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
			status += `${player.user} : ${player.gold} gold, cards : ${c1}, ${c2}\n`;
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

	finishGame() {
		let winner = this.players.filter(p => !p.dead)[0];
		winner.c1dead = true;
		winner.c2dead = true;
		this.players.forEach(p => p.message.delete());
		this.message.edit(`***Partie terminée, c'est ${winner.user} qui a gagné.***\n` + this.statusToString() + `\n\nPour supprimer ce message, réagir avec :negative_squared_cross_mark:`); //❎
		this.message.reactions.removeAll().then(m => {
			m.react('❎');
		});
		let filter = (r, u) => !u.bot && r.emoji.name === '❎';
		let collector = this.message.createReactionCollector(filter);
		collector.on('collect', (r,u) => {
			this.message.delete();
			collector.stop('stopped');
		});
		// TODO: End condition
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
		this.dead = false;
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
		return Deck.shuffle(deck);
	}

	static shuffle(deck) {
		return deck.sort(() => Math.random() - 0.5);
	}
}

let possibleActions = `Prendre le revenu : Fais gagner 1 gold, incontrable
Demander l'aide étrangère : Contré par la Duchesse
Assassiner quelqu'un pour 7 gold, incontrable
Effectuer l'action d'un des personnages`;

let characterActions = `Duchesse : Prend 3 gold
Capitaine : Vole maximum 2 gold à un autre joueur, contré par le Capitaine et l'Ambassadeur
Assassin : Assassine un joueur pour 3 gold, contré par la Comptesse
Ambassadeur : Pioche 2 cartes et puis repose 2 cartes de son choix dans la pioche
Comptesse : Contre l'action de l'Assassin`;

const rulesEmbed = new MessageEmbed()
	.setTitle(`Regles : `)
	.setColor(`#ffa000`)
	.addField(`Actions possibles`, possibleActions)
	.addField(`Actions des personnages`, characterActions)
	.attachFiles([`./resources/aide_de_jeu.jpg`])
	.setImage(`attachment://aide_de_jeu.jpg`);


exports.ComplotsGame = ComplotsGame;
exports.Player = Player;
exports.Deck = Deck;
exports.rulesEmbed = rulesEmbed;
