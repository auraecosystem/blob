const fs = require('node:fs');
const { Buffer } = require('node:buffer');

const blockSize = 4096;

// The buffer address must be block-aligned for O_DIRECT to accept it.
const buf = Buffer.allocUnsafeSlow(blockSize, blockSize);

const flags = fs.constants.O_RDONLY | fs.constants.O_DIRECT;
fs.open('/dev/sda', flags, (err, fd) => {
  if (err) throw err;
  fs.read(fd, buf, 0, blockSize, 0, (err) => {
    fs.close(fd, () => {});
    if (err) throw err;
  });
});
