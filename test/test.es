import { createTemporaryBlob, createTemporaryFile } from 'fetch-blob/from.js'

const req = new Request('https://httpbin.org/image/png')
const res = await fetch(req)
const type = res.headers.get('content-type')
const signal = req.signal
let blob = await createTemporaryBlob(res.body, { type, signal })
// const file = createTemporaryBlob(res.body, 'img.png', { type, signal })
blob = undefined // loosing references will delete the file from disk
