
import { downloadBaseJson } from '../downloader/base';
import { downloadBc } from '../downloader/bc';
import { downloadExtlist } from '../downloader/extlist';
import { Extlist } from '../models/extlist';
import minimist from "minimist";
const cliProgress = require('cli-progress');
const Semaphore = require('ts-semaphore')

async function update(server: string, outDir: string, newOnly: boolean, useAndroid: boolean, monsIds: number[], cardIds: number[], useProgressBar: boolean) {
  const baseJson = await downloadBaseJson(server.toUpperCase(), useAndroid);
  const extlist = Extlist.load(await downloadExtlist(baseJson.extlist));

  let pbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  if (useProgressBar) {pbar.start(extlist.entries.length, 0);}
  const semaphore = new Semaphore(25)
  const downloadFns = extlist.entries.map((entry) => semaphore.use(async () => {
    let isNew = false;

    if ((!monsIds.length && !cardIds.length) 
      || (!entry.isCards && monsIds.includes(entry.id))
      || (entry.isCards && cardIds.includes(entry.id))) {
      isNew = await downloadBc(outDir, baseJson.extlist, entry, newOnly);
    }
    if (useProgressBar) {pbar.increment();}
    return isNew;
  }));
  await Promise.all(downloadFns);
  if (useProgressBar) {pbar.stop();}

  console.log('Up to date.');
}

export async function main(args: string[]) {
  const parsedArgs = minimist(args, {
    boolean: ['new-only', 'for-tsubaki', 'help', 'quiet', 'use-android'],
    string: ['server', 'mons', 'cards'],
  });

  if (parsedArgs._.length !== 2 || parsedArgs.help) {
    console.log("usage: pad-visual-media update <server> <out directory> [--mons 'list, of, ids'] [--cards 'list, of, ids'] [--new-only] [--use-android] [--for-tsubaki (unused)] [--quiet]");
    return parsedArgs.help;
  }
  
  let monsIds = [];
  let cardIds = [];
  if (parsedArgs.mons !== undefined) {
    monsIds = parsedArgs.mons.match(/\d+/g).map((id: string) => parseInt(id));
  }
  if (parsedArgs.cards !== undefined) {
    cardIds = parsedArgs.cards.match(/\d+/g).map((id: string) => parseInt(id));
  }
  await update(parsedArgs._[0], parsedArgs._[1], parsedArgs['new-only'], parsedArgs['use-android'], monsIds, cardIds, !parsedArgs['quiet']);

  return true;
}
