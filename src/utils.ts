const mysql = require('mysql');

const SERVERS = ['JP', 'NA', 'KR'];
const SQL_QUERY = `
SELECT monster_id FROM canonical_monster_ids
  WHERE monster_no = ? AND server_id = ?`;

export function readASCII(buf: Buffer, offset: number) {
  let str = '';
  while (buf[offset] !== 0)
    str += String.fromCharCode(buf[offset++]);
  return str;
}

export function formatTsubakiFile(monster_no: string, server: string | undefined): Promise<string> {
  const parsedServer = (server ?? 'JP').toUpperCase();
  if (parsedServer === 'HT') {throw new Error("HT is not supported in Tsubaki");}
  if (SERVERS.indexOf(parsedServer) === -1) {throw new Error("Invalid server: " + parsedServer);}
  const config = require('../db_config.json');
  var con = mysql.createConnection(config);
  return new Promise(function(resolve, reject){
    con.query(mysql.format(SQL_QUERY, [parseInt(monster_no), SERVERS.indexOf(parsedServer)]), function (err: string, rows: any) {
      if (err) {reject(new Error(err));}
      if (rows.length === 0) {reject(new Error(`${monster_no} is not found in server ${parsedServer}`));}
      resolve(`${rows[0].monster_id}`);
      con.end();
    })
  });
}
