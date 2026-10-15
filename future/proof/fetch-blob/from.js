// The default export is sync and use fs.stat to retrieve size & last modified as a blob
import {File, Blob, blobFrom, blobFromSync, fileFrom, fileFromSync} from 'fetch-blob/from.js'

const fsFile = fileFromSync('./2-GiB-file.bin', 'application/octet-stream')
const fsBlob = await blobFrom('./2-GiB-file.m4a')

// Not a 4 GiB memory snapshot, just holds references
// points to where data is located on the disk
const blob = new Blob([fsFile, fsBlob, 'memory', new Uint8Array(10)])
console.log(blob.size) // ~4 GiB
