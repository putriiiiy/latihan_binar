const qr = require('qr-image');

var qr_png = qr.imageSync('I LOVE YOUUU FELIX', {type : 'png'});

console.log(qr_png.toString('base64'));