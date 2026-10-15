// Ways to import
import { Blob } from 'fetch-blob'
import { File } from 'fetch-blob/file.js'

const { Blob } = await import('fetch-blob')


// Ways to read the blob:
const blob = new Blob(['hello, world'])

await blob.text()
await blob.arrayBuffer()
for await (let chunk of  blob.stream()) { ... }
blob.stream().getReader().read()
blob.stream().getReader({mode: 'byob'}).read(view)
