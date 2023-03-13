const mysql = require('mysql');

const SERVERS = ['JP', 'NA', 'KR'];
var TSUBAKI_IDS: any = undefined;

export function readASCII(buf: Buffer, offset: number) {
  let str = '';
  while (buf[offset] !== 0)
    str += String.fromCharCode(buf[offset++]);
  return str;
}

export async function formatTsubakiFile(monster_no: string, server: string | undefined): Promise<string> {
  const parsedServer = (server ?? 'JP').toUpperCase();
  if (parsedServer === 'HT') {throw new Error("HT is not supported in Tsubaki");}
  if (SERVERS.indexOf(parsedServer) === -1) {throw new Error("Invalid server: " + parsedServer);}

  if (TSUBAKI_IDS === undefined) {
    TSUBAKI_IDS = {};
    console.log("Generating ID mapping...")
    const config = require('../db_config.json');
    var con = mysql.createConnection(config);
    await new Promise(function(resolve, reject){
      con.query("SELECT * FROM canonical_monster_ids", function (err: string, rows: any) {
        if (err) {
          reject(new Error(err)); 
        } else {
          rows.forEach((r: any) => {
            TSUBAKI_IDS[String([r.monster_no, r.server_id])] = r.monster_id;
          });
          resolve(1);
        }
        con.end();
      });
    });
  }

  let key = String([parseInt(monster_no), SERVERS.indexOf(parsedServer)]);
  if (!(key in TSUBAKI_IDS)) {
    return `${parsedServer}_${monster_no.padStart(5, '0')}`;
  } else {
    return `${TSUBAKI_IDS[key]}`.padStart(5, '0');
  }
}
