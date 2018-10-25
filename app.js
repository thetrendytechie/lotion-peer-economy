#!/usr/bin/env node

require('dotenv').config();
let axios = require('axios');
let argv = require('minimist')(process.argv.slice(2));
let getPort = require('get-port');
let syllables = require('syllable');
let leftPad = require('left-pad');

let chatId = argv.j;
let peers = argv.p;

let readline = require('readline');
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Choose or enter your username > '
});

let lastOffersLength = 0;
const port = process.env.PORT;

async function main() {
  	console.log('starting blockchain interface on port ' + port + '...\n');
  	console.log(`chain state : http://localhost:${port}/state\ntransactions: http://localhost:${port}/txs`);
	let opts = {
		port,
		initialState: {
		offers: [
			{ poster: 'sage', service: 'Blockchain Crash Course', hours: 1, claimed: false }
		]
		},
		peers: peers ? [peers] : [],
		logTendermint: false
	}

	if (chatId) {
		opts.genesisKey = chatId
	}

	let lotion = require('lotion')(opts)
	
	let boardHandler = (state, tx) => {
		if (
		typeof tx.poster === 'string' &&
		typeof tx.service === 'string' 
		) {
		//   let requiredSyllables = state.messages.length % 3 === 1 ? 7 : 5
		//   if (syllables(tx.message) === requiredSyllables) {
			state.offers.push({
			poster: tx.poster,
			service: tx.service,
			hours: tx.hours,
			claimed: tx.claimed
			})
		}
		// }
	}

	lotion(boardHandler).then(genesisKey => {
		console.log('Community board number is ' + genesisKey + '\n');
		rl.prompt();

		let username;
		var infoComplete = false;
		var serviceFlag = false;
		var claimFlag = false;
		let service;
		let hours;

		rl.on('line', async line => {
		readline.moveCursor(process.stdout, 0, -1);
		readline.clearScreenDown(process.stdout);
		line = line.trim();

		if (!username) {
			let e = usernameError(line);
			if (e) {
			console.log(e);
			} else {
			username = line;
			rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');
			}
		} else {
			if(line == 'Offer'){
				//prompt user for description of service and # hours
				serviceFlag = true;
				rl.setPrompt('Your Service Description > ');
			}else if (line == 'Browse'){
				//display all current offers
				displayBoard();
				rl.setPrompt('Enter "Claim" to claim a service, or "Exit" to go back > ');
			}else if (line == 'Claim'){
				claimFlag = true;
				rl.setPrompt('Enter the number of the service you would like to claim > ');
			}else if (line == 'Exit'){
				serviceFlag = false;
				infoComplete = false;
				rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');
			}else{
				if(serviceFlag){
					service = line;
					serviceFlag = false;
					rl.setPrompt('# Hours Offered > ');
				}else if(claimFlag){
					claimOffer(line);
				}else{
					hours = line;
					infoComplete = true;
				}
			}
			
			if(infoComplete){
				rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');

				postOffer(username, service, hours, false);
				//   console.log('Result: ', result);
				infoComplete = false;
				updateState(result.data.state);
			}
		}
		rl.prompt(true);
		});
			
		setInterval(async () => {
		let { data } = await getState();
		updateState(data);
		}, 500);
	});
}

function usernameError(name) {
	if (name.length > 12) {
	  	return 'Username is too long';
	}
	if (name.length < 3) {
	 	return 'Username is too short';
	}
	if (name.indexOf(' ') !== -1) {
	  	return 'Username may not contain a space';
	}
	return false;
}

async function getState(){
	return axios.get('http://localhost:' + port + '/state');
}

async function updateState(data) {
	for (let i = lastOffersLength; i < data.offers.length; i++) {
	  	displaySingleService(data.offers[i], i);
	}
	lastOffersLength = data.offers.length;
}

function displaySingleService({ poster, service, hours, claimed }, index) {

	let bar = '====================================================================';
  	let link = '                                |                                ';

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    if (claimed == false) {
		console.log(bar);
		console.log('|  ' + (index + 1) + ': ' + poster + leftPad('- ', 12 - poster.length) + service + ' for ' + hours + ' hours' + leftPad('|', 50 - (service.length + 12)));
		console.log(bar);
		console.log(link);
		console.log(link);
    }
    rl.prompt(true);
}

function displayBoard(){
	getState().then((res) => {
		// console.log('displayBoard: ', res.data.offers);
		for (let i = 0; i < res.data.offers.length; i++) {
			displaySingleService(res.data.offers[i], i);
	 	 }
	});
}

async function postOffer(username, service, hours, claimed){
	return axios({
		url: 'http://localhost:' + port + '/txs',
		method: 'post',
		params: {
			return_state: true
		},
		data: {
			poster: username,
			service: service,
			hours: hours,
			claimed: claimed
		}
	});
}

async function claimOffer(index){
	index -= 1;
	let updatedItem;
	//get all offers
	getState().then((state) => {
		//pick the right one and update state
		let offer = state.data.offers[index];
		console.log('this is the state', state.data.offers[index])
		postOffer(offer.poster, offer.service, offer.hours, true).then((result) => {
			updateState(result.data.state);
		});
	});
}



main();
