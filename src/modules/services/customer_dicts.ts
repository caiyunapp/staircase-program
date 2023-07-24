import { TranslateTaskProcessor } from "../../utils/translate";

type CustomType = {
  key:string;
  name: string;
  trans_type: string;
}


export default async function () {
  const xhr = await Zotero.HTTP.request(
    "GET",
    "https://api.interpreter.caiyunai.com/v1/user/dict/common_customer_dicts",
    {
      responseType: "json",
    }
  );
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }
  const re = xhr.response.common_customer_dicts;
  // Example： { key: 'chemistry', name: '化学领域术语库', trans_type: 'en2zh' }
  const result:CustomType[] = [];
  for( const key in re) {
    const custom: CustomType = {
      key: key,
      name: re[key]['name_zh'],
      trans_type: re[key]['trans_type'],
    }
    result.push( custom );
  }
  ztoolkit.log( '--- result')
  return result;
};
