import * as fs from 'fs';
const path = 'src/modules/bookings/bookings.service.ts';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
lines[176] = '      throw new BadRequestException(`Lead conversion failed: ${e.message}`);';
fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed line 177');
