let { connect } = require('lotion')
let GCI = 'b0a73c8558b73fe557e79991b6ceb962de564e03ad15c8d7b94c5c8a8bc3b720'

async function main() {
  let { state, send } = await connect(GCI)
  console.log(await state) // { count: 0 }
  console.log(await send({ nonce: 0 })) // { ok: true }
  console.log(await state) // { count: 1 }
}

main()