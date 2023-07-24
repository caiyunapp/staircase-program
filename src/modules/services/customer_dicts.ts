import { TranslateTaskProcessor } from "../../utils/translate";

export default <TranslateTaskProcessor>async function (data) {
  const xhr = await Zotero.HTTP.request(
    "GET",
    "https://api.interpreter.caiyunai.com/v1/user/dict/common_customer_dicts",
    {
      headers: {
        "content-type": "application/json",
        "x-authorization": `token ${data.secret}`,
      },
      responseType: "json",
    }
  );
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }
  data.result = xhr.response.target[0];
};
