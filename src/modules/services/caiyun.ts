import { TranslateTaskProcessor } from "../../utils/translate";

export default <TranslateTaskProcessor>async function (data) {
  let param = `${data.langfrom.split("-")[0]}2${data.langto.split("-")[0]}`;
  const dict_name = data.dict_name;
  const dict_user = data.dict_user;

  const json_data:any = {
    source: [data.raw],
    trans_type: param,
    request_id: new Date().valueOf() / 10000,
    detect: true,
    dict_name: {},
    user_id: data.uid,
  }

  if ( dict_name ) {
    json_data['dict_name']['common_dict'] = [dict_name];
  }
  if ( dict_user ) {
    json_data['dict_name']['custom_dict'] = [dict_user];
  }

  const xhr = await Zotero.HTTP.request(
    "POST",
    "http://api.interpreter.caiyunai.com/v1/translator",
    {
      headers: {
        "content-type": "application/json",
        "x-authorization": `token ${data.secret}`,
      },
      body: JSON.stringify(json_data),
      responseType: "json",
    }
  );
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }
  data.result = xhr.response.target[0];
};
