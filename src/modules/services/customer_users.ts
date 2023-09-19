import { TranslateTaskProcessor } from "../../utils/translate";

type CustomType = {
  key:string;
  name: string;
  trans_type: string;
}

export default async function ( data:any ) {
    const xhr = await Zotero.HTTP.request(
        "POST",
        `https://api.interpreter.caiyunai.com/v1/user/${ data.uid }/dict/all`,
        {
            headers: {
                "content-type": "application/json",
            },
            responseType: "json",
            body: JSON.stringify({
                user_id: data.uid,
            }),
        }
    );

    if (xhr?.status !== 200) {
        throw `Request error: ${xhr?.status}`;
    }

    const result = xhr.response.dict_list;

    return result;
};
