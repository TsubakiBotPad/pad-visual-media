import { downloadBaseJson } from '../downloader/base';
import { downloadBc } from '../downloader/bc';
import { downloadExtlist } from '../downloader/extlist';
import { Extlist } from '../models/extlist';
import minimist from "minimist";
const cliProgress = require('cli-progress');
const Semaphore = require('ts-semaphore');
import { formatTsubakiFile } from '../utils';

async function update(outDir: string, server: string, newOnly: boolean, useAndroid: boolean, noLeaks: boolean, monsIds: number[], cardIds: number[], quiet: boolean) {
  const baseJson = await downloadBaseJson(server.toUpperCase(), useAndroid);
  const extlist = Extlist.load(await downloadExtlist(baseJson.extlist));

  let pbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  if (!quiet) {pbar.start(extlist.entries.length, 0);}
  const semaphore = new Semaphore(25)
  const downloadFns = extlist.entries.map((entry) => semaphore.use(async () => {
    if (noLeaks && !entry.isCards) {
      if ((await formatTsubakiFile(`${entry.id}`, server)).startsWith((server ?? 'JP').toUpperCase())) {
        return;
      }
    }

    if ((!monsIds.length && !cardIds.length) 
      || (!entry.isCards && monsIds.includes(entry.id))
      || (entry.isCards && cardIds.includes(entry.id))) {
      await downloadBc(outDir, baseJson.extlist, entry, newOnly);
    }
    if (!quiet) {pbar.increment();}
  }));
  await Promise.all(downloadFns);
  if (!quiet) {pbar.stop();}

  console.log('Up to date.');
}

export async function main(args: string[]) {
  const parsedArgs = minimist(args, {
    boolean: ['new-only', 'for-tsubaki', 'help', 'quiet', 'use-android', 'prevent-leaks'],
    string: ['server', 'mons', 'cards'],
  });

  if (parsedArgs._.length !== 1 || parsedArgs.help || parsedArgs.server === undefined) {
    console.log("usage: pad-visual-media update <out directory> --server <server> [--mons 'list, of, ids'] [--cards 'list, of, ids'] [--new-only] [--use-android] [--for-tsubaki [--prevent-leaks]] [--quiet]");
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
  await update(parsedArgs._[0], parsedArgs['server'], parsedArgs['new-only'], parsedArgs['use-android'], parsedArgs['prevent-leaks'], monsIds, cardIds, parsedArgs['quiet']);

  return true;
}
