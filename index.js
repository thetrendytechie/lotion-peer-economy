// async function main(){
//     let port = process.env.PORT || (await getPort())
//     console.log('starting blockchain interface on port ' + port + '...\n')
//     console.log(
//     ` 
//     chain state : http://localhost:${port}/state
//     transactions: http://localhost:${port}/txs

//     `
//     )
//     let opts = {
//         port,
//         initialState: {
//             messages: [
//                 { sender: 'keppel', message: 'to demo lotion' },
//                 { sender: 'keppel', message: 'i made a haiku blockchain' },
//                 { sender: 'keppel', message: 'you must write new ones' }
//             ]
//         },
//         peers: peers ? [peers] : [],
//         logTendermint: false

//     }
// }

let app = require('lotion')({
    initialState: { count: 0 }
  });
  
  app.use((state, tx) => {
    state.count++
  });
  
  app.start().then(console.log);