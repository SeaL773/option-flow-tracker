const fs = require('fs');
const zlib = require('zlib');
const xml = fs.readFileSync('../docs/Phase2_ER_Diagram_v2.drawio.xml','utf8');
const m = xml.match(/<diagram[^>]*>([\s\S]*?)<\/diagram>/);
if (!m) { console.log('No diagram content'); process.exit(); }
const buf = Buffer.from(m[1],'base64');
const dec = zlib.inflateRawSync(buf);
const text = decodeURIComponent(dec.toString());
// Print readable text - extract all value attributes
const values = [];
const re = /value="([^"]*)"/g;
let match;
while ((match = re.exec(text)) !== null) {
  const v = match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/<[^>]*>/g,' ').trim();
  if (v && v.length < 300) values.push(v);
}
values.forEach(v => console.log(v));
