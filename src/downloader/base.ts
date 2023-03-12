import Axios from 'axios';
import { JsonURLs } from '../config';

export interface BaseJson {
  rver: string;
  extlist: string;
}

export async function downloadBaseJson(server: string, useAndroid: boolean): Promise<BaseJson> {
  if (!(server in JsonURLs)) {
    throw new Error(`Invalid Server. Valid servers are: ${Object.keys(JsonURLs).join(', ')}`);
  }
  const baseJsonURL = useAndroid ? JsonURLs[server].android : JsonURLs[server].iOS;
  console.log(`downloading root json: ${baseJsonURL}`);
  const baseJson: BaseJson = await Axios.get(baseJsonURL).then((resp) => resp.data);
  console.log(`version: ${baseJson.rver}`);
  return baseJson;
}
