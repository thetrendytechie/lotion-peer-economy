let initialState = {
    offers: [
        { poster: 'sage', service: 'Blockchain Crash Course', hours: 1 }
    ],
    //genesisPath: './genesis.json',
    //peers: peers ? [peers] : [],
    logTendermint: false //if true, this would show all output from underlying tendermint process
}

let app = require('lotion')(initialState);
  
  app.use((state, tx) => {
    state.count++
  });
  
  app.start().then(console.log);