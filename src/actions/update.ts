
import { downloadBaseJson } from '../downloader/base';
import { downloadBc } from '../downloader/bc';
import { downloadExtlist } from '../downloader/extlist';
import { Extlist } from '../models/extlist';
import minimist from "minimist";
const cliProgress = require('cli-progress');
const Semaphore = require('ts-semaphore')

async function update(outDir: string, newOnly: boolean, useProgressBar: boolean, ids: number[], doCardIds: boolean) {
  const baseJson = await downloadBaseJson();
  const extlist = Extlist.load(await downloadExtlist(baseJson.extlist));

  let pbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  if (useProgressBar) {pbar.start(extlist.entries.length, 0);}
  const semaphore = new Semaphore(25)
  const downloadFns = extlist.entries.map((entry) => semaphore.use(async () => {
    let isNew = false;
    if (!ids.length || (ids.includes(entry.id) && entry.isCards == doCardIds)) {
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
    boolean: ['new-only', 'for-tsubaki', 'help', 'cards'],
    string: ['ids'],
  });

  if (parsedArgs._ .length !== 1 || parsedArgs.help) {
    console.log("usage: pad-visual-media update <out directory> [--ids '<list, of, ids>' [--cards]] [--new-only] [--for-tsubaki]");
    return parsedArgs.help;
  }
  
  let ids = [];
  if (parsedArgs.ids !== undefined) {
    ids = parsedArgs.ids.match(/\d+/g).map((id: string) => parseInt(id));
  }
  await update(parsedArgs._[0], parsedArgs['new-only'], !parsedArgs['for-tsubaki'], ids, parsedArgs['cards']);

  return true;
}
