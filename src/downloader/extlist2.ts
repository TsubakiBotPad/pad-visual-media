import Axios from 'axios';

export async function downloadExtlist2(extlist: string): Promise<Buffer> {
  console.log(`downloading extlist2: ${extlist}`);

  const extlistData: Buffer = await Axios.get('extlist2.bin', {
    baseURL: extlist,
    responseType: 'arraybuffer',
  }).then((resp) => resp.data);

  return extlistData;
}
