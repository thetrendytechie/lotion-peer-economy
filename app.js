#!/usr/bin/env node

let axios = require('axios')
let argv = require('minimist')(process.argv.slice(2))
let getPort = require('get-port')
let syllables = require('syllable')
let leftPad = require('left-pad')

let chatId = argv.j
let peers = argv.p

let readline = require('readline')
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Choose or enter your username > '
})

let lastOffersLength = 0;

async function main() {
  let port = process.env.PORT || (await getPort())
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
      typeof tx.service === 'string' &&
	  typeof tx.hours === 'integer' &&
	  typeof tx.claimed === boolean
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
	let service;
	let hours;

    rl.on('line', async line => {
      readline.moveCursor(process.stdout, 0, -1)
      readline.clearScreenDown(process.stdout)
      line = line.trim()

      if (!username) {
        let e = usernameError(line)
        if (e) {
          console.log(e)
        } else {
          username = line
          rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');
        }
      } else {
        if(line == 'Offer'){
			//prompt user for description of service and # hours
			serviceFlag = true;
			rl.setPrompt('Your Service Description > ');
		}else if (line == 'Browse'){
			//display all current offers
			updateState(state);
			rl.setPrompt('Enter "Claim" to claim a service, or "Exit" to go back > ');
        }else if (line == 'Claim'){
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
			}else{
				hours = line;
				infoComplete = true;
			}
		}
		
		if(infoComplete){
			rl.setPrompt('Enter "Offer" to offer a service, or "Browse" to see current available offers \n> ');

			let result = await axios({
				url: 'http://localhost:' + port + '/txs',
				method: 'post',
				params: {
				  return_state: true
				},
				data: {
				  poster: username,
				  service: service,
				  hours: hours,
				  claimed: false
				}
			  });
			  console.log('Result: ', result);
			infoComplete = false;
			updateState(result.data.state);
		}
      }
      rl.prompt(true);
	})
	    
    setInterval(async () => {
      let { data } = await axios.get('http://localhost:' + port + '/state');
      updateState(data);
    }, 500)
  })
}

async function updateState(state) {
	for (let i = lastOffersLength; i < state.offers.length; i++) {
	  displayService(state.offers[i], i);
	}
	lastOffersLength = state.offers.length;
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

function displayService({ poster, service, hours, claimed }, index) {

	let bar = '================================================================='
  	let link = '                                |                                '

    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)

    if (claimed == false) {
		console.log(bar)
		console.log('|  ' + poster + leftPad(': ', 12 - poster.length) + service + ' for ' + hours + ' hours' + leftPad('|', 50 - (service.length + 12)))
		console.log(bar)
		console.log(link)
		console.log(link)
		console.log(link)
    }
    rl.prompt(true)
}

main();