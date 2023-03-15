import fs from "fs";
import { glob } from "glob";
import minimist from "minimist";
import { basename, extname, join } from "path";
import sharp from "sharp";
import { BBIN } from "../models/bbin";
import { ISA } from "../models/isa";
import { ISC } from "../models/isc";
import { loadISA, loadISC } from "../models/spine";
import { SpineAtlas } from "../models/spine-atlas";
import { SpineSkeleton } from "../models/spine-skeleton";
import { TEX } from "../models/tex";
import { formatTsubakiFile } from '../utils';
const cliProgress = require('cli-progress');
import Sharp from 'sharp';

const TSUBAKI_IMAGE_SIZE = [640, 388];

function writeFile(out: string, name: string, data: Buffer) {
  fs.writeFileSync(join(out, name), data);
}

async function extract(in_file: string, stillOutDir: string | undefined, animatedOutDir: string | undefined, cardOutDir: string | undefined, newOnly: boolean, forTsubaki: boolean, server: string) {
  const name = basename(in_file, extname(in_file));
  const buf = fs.readFileSync(in_file);

  if (TEX.match(buf)) {
    const tex = TEX.load(buf);
    const isCard = tex.entries[0].name.startsWith('CARDS');
    let outDir = isCard ? cardOutDir : stillOutDir;
    if (outDir === undefined) {return;}
    for (const entry of tex.entries) {
      const idNo = entry.name.match(/[A-Z]+_0*(\d+)\.PNG/)![1];
      const fname = forTsubaki && !isCard ? `${await formatTsubakiFile(idNo, server)}.png` : entry.name;
      if (newOnly && fs.existsSync(join(outDir, fname))) {continue;}
      const image = await TEX.decode(entry);
      if (!forTsubaki || isCard) {
        writeFile(outDir, fname, image);
      } else {
        writeFile(outDir, fname, await tsubakiResize(image));
      }
    }
  } else if (BBIN.match(buf)) {
    if (animatedOutDir === undefined) {return;}
    const bbin = BBIN.load(buf);

    if (newOnly && fs.existsSync(join(animatedOutDir, `${name}.json`))) {return;}
    const images = new Map<string, Buffer>();
    let isc: ISC | null = null;
    const isas: ISA[] = [];
    for (const file of bbin.files) {
      if (TEX.match(file)) {
        const tex = TEX.load(file);
        for (const entry of tex.entries) {
          const image = await TEX.decode(entry);
          images.set(entry.name, image);
        }
      } else if (ISC.match(file)) {
        isc = ISC.load(file);
      } else if (ISA.match(file)) {
        isas.push(ISA.load(file));
      }
    }
    if (isc) {
      await convertSpineModel(name, isc, isas, images, animatedOutDir);
    }
  }
}

async function convertSpineModel(
  name: string,
  isc: ISC,
  isas: ISA[],
  images: Map<string, Buffer>,
  out: string
) {
  switch (isc.type) {
    case 1:
      const atlas: SpineAtlas = { images: [] };
      for (const [name, data] of images.entries()) {
        const meta = await sharp(data).metadata();
        atlas.images.push({
          name,
          data,
          width: meta.width ?? 0,
          height: meta.height ?? 0,
          regions: [
            {
              name,
              x: 0,
              y: 0,
              width: meta.width ?? 0,
              height: meta.height ?? 0,
            },
          ],
        });
      }

      const skeleton: SpineSkeleton = {
        skeleton: {},
        bones: [],
        slots: [],
        skins: [],
        ik: [],
        animations: {},
        __attachments: {},
      };
      loadISC(isc, skeleton, atlas);
      for (const isa of isas) {
        let isaName = basename(isa.name, extname(isa.name));
        if (isa === isas[0]) {
          isaName = "animation";
        } else if (isaName.startsWith(name + "_")) {
          isaName = isaName.substring(name.length + 1);
        }
        loadISA(isaName, isc, isa, skeleton);
      }

      for (const [name, data] of images) {
        writeFile(out, name, data);
      }
      writeFile(
        out,
        `${name}.json`,
        Buffer.from(JSON.stringify(skeleton, null, 2))
      );
      writeFile(out, `${name}.atlas`, SpineAtlas.export(atlas));
      break;

    case 2:
      for (const [imageName, data] of images) {
        const fileName = imageName.toLowerCase();
        writeFile(out, fileName, data);
      }

      writeFile(
        out,
        `${name}.json`,
        Buffer.from(JSON.stringify(isc.json, null, 2))
      );
      writeFile(out, `${name}.atlas`, Buffer.from(isc.atlas));
      break;
  }
}

async function tsubakiResize(imageBuffer: Buffer) {
  let img = Sharp(imageBuffer);
  let {width, height} = await img.metadata();
  let trimmedImg = Sharp(await Sharp(await img.toBuffer()).trim('transparent').toBuffer());
  let {height: trimmedHeight} = await trimmedImg.metadata();

  if (trimmedHeight! > TSUBAKI_IMAGE_SIZE[1]) {
    img = Sharp(await img.extract({
      left: 0, top: 0,
      width: width!, height: height! / 2
    }).toBuffer());
  }
  return await Sharp({create: {
    width: TSUBAKI_IMAGE_SIZE[0],
    height: TSUBAKI_IMAGE_SIZE[1],
    channels: 4,
    background: 'transparent',
  }}).composite([{
    input: await img.trim('transparent').toBuffer()
  }]).png().toBuffer();
}

export async function main(args: string[]) {
  const parsedArgs = minimist(args, {
    boolean: ['help', 'new-only', 'for-tsubaki', 'quiet'],
    string: ['still-dir', 'animated-dir', 'card-dir', 'server']
  });

  if (parsedArgs._.length !== 1 || parsedArgs.help) {
    console.log("usage: pad-visual-media extract <bin file/path to bin files> [--animated-dir <animated output directory>] [--still-dir <still output directory>] [--card-dir <card output directory>] [--new-only] [--for-tsubaki --server <server>] [--quiet]");
    return parsedArgs.help;
  }

  const files = [];
  if (fs.existsSync(parsedArgs._[0]) && fs.lstatSync(parsedArgs._[0]).isDirectory()) {
    for (const file of fs.readdirSync(parsedArgs._[0])) {
      if (file.endsWith('.bin')) {
        files.push(join(parsedArgs._[0], file));
      }
    }
  } else {
    files.push(...glob.sync(parsedArgs._[0]));
  }
  files.sort();

  let pbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  if (!parsedArgs.quiet) {pbar.start(files.length, 0);}
  for (const file of files) {
    await extract(file, parsedArgs['still-dir'], parsedArgs['animated-dir'], parsedArgs['card-dir'], parsedArgs['new-only'], parsedArgs['for-tsubaki'], parsedArgs['server']);
    if (!parsedArgs.quiet) {pbar.increment();}
  }
  if (!parsedArgs.quiet) {pbar.stop();}
  return true;
}
