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
let port = process.env.PORT || ( getPort());

async function main() {
	
	console.log('starting blockchain interface on port ' + port + '...\n');
	console.log(`chain state : http://localhost:${port}/state\ntransactions: http://localhost:${port}/txs`);
	
	let opts = {
		port,
		initialState: {
		offers: [
			{ poster: 'sage', service: 'Blockchain Crash Course', hours: 1, claimed: false, id: 1 }
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
			state.offers.push({
			poster: tx.poster,
			service: tx.service,
			hours: tx.hours,
			claimed: tx.claimed,
			id: tx.id
			})
		}
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
		let id;

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
				console.log('Here are all the currently available services: ');
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
					claimFlag = false;
					rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');
					claimOffer(line);
				}else{
					hours = line;
					infoComplete = true;
				}
			}
			
			if(infoComplete){
				rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');
				infoComplete = false;
				postOffer(username, service, hours, false).then((result) => {
					//   console.log('Result: ', result);
					
					updateState(result.data.state);
				});
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
	// console.log('offers: ', data);
	for (let i = lastOffersLength; i < data.offers.length; i++) {
	  	displaySingleService(data.offers[i], i);
	}
	lastOffersLength = data.offers.length;
}

function displaySingleService({ poster, service, hours, claimed , id}, index) {

	let bar = '====================================================================';
  	let link = '                                |                                ';

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    
	console.log(bar);
	if (!claimed) {
		console.log('|  ' + (id) + ': ' + poster + leftPad('- ', 12 - poster.length) + service + ' for ' + hours + ' hours' + leftPad('|', 50 - (service.length + 12)));
	}else{
		console.log('|  ' + (id) + ': ' + poster + leftPad('- ', 12 - poster.length) + service + ' CLAIMED' + leftPad('|', 50 - (service.length + 9)));
	}
	console.log(bar);
	console.log(link);
	console.log(link);
    
    rl.prompt(true);
}

function displayBoard(){
	let claimedOffers = [];
	let claimedCount = 0;

	getState().then((res) => {
		// console.log('res: ', res);
		for (let i = 0; i < res.data.offers.length; i++) {
			let current = res.data.offers[i];
			if(current.claimed){
				claimedOffers.push(current);
				claimedCount++;
			}
		}
		// console.log('claimed offers: ', claimedOffers);
		let newBoard = res.data.offers;
		claimedOffers.forEach(offer => {
			var index = newBoard.findIndex(offerToRemove => offerToRemove.service === offer.service);
			// console.log('index is: ', index);
			if (index !== -1){
				newBoard.splice(index, 1);
			}
		});
		for(let i=0; i < newBoard.length; i++){
			if(claimedCount > 0){
				// console.log('claimed count: ', claimedCount);
				var index = newBoard.findIndex(offerToRemove => offerToRemove.claimed === true);
				if (index !== -1){
					newBoard.splice(index, 1);
					claimedCount--;
				}
			}
		}
		// console.log('new board is: ', newBoard);
		let i = 0;
		newBoard.forEach(offer => {
			if(!offer.claimed){
				displaySingleService(offer, i);
			}
			i++;
		});
	});
}

async function postOffer(username, service, hours, claimed){
	let nextId = await axios.get('http://localhost:' + port + '/state').then((state) => {
		// console.log("length: ", state.data.offers.length)
		return state.data.offers.length + 1;
	});
	// console.log('in postOffer past nextId ', nextId)
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
			claimed: claimed,
			id: nextId
		}
	});
}

async function claimOffer(id){
	id -= 1;
	//get all offers
	getState().then((state) => {
		//pick the right one and update state
		//let offer = state.data.offers.find(offerToClaim => offerToClaim.id === id);
		let offer = state.data.offers[id];
		// console.log(offer);
		postOffer(offer.poster, offer.service, offer.hours, true).then((result) => {
			// console.log(result.data.state);
			updateState(result.data.state);
		});
	});
}



main();
