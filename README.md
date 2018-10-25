# lotion-peer-economy
Blockchain sharing economy demo using Lotion.js

## How to use

app.js is the entry point. When you run this script it will generate a new lotion-data file for the transactions and state.

## What is a peer economy?

A peer economy is a network of value exchange in the form of personal time and effort rather than money. For example, if Jan offers two hours of dance lessons for three children in his neighborhood, he has given six hours of his time to others. Those others (or their parents) have essentially redeemed that time with Jan. Jan should now have a credit of six hours that he can redeem with others in the network - note that he doesn't have to redeem them with the same people from the first transaction.

This app models this concept using a blockchain. In this case, blockchain helps accomplish two things that are very difficult in a time-based economy: verifying value exchange and keeping consistent, shared records between participants.

## About Lotion.js

Lotion.js[https://github.com/keppel/lotion] helps us build smooth, easy blockchain apps in JavaScript! It builds on top of Tendermint using the ABCI protocol. 

For stability's sake, and because documentation is still in early days, lotion-peer-economy is built on lotion-0.0.4. I hope to update this in the future, and welcome contributors who'd like to join in on the fun.
