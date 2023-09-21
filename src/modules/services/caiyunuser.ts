
export default async function ( uid:string) {
    const xhr = await Zotero.HTTP.request(
      "POST",
      `https://api.interpreter.caiyunai.com/v1/user/${ uid }`,
      {
        headers: {
          "content-type": "application/json",
          "x-authorization": `token 9sdftiq37bnv410eon2l`,
        },
        body: JSON.stringify({
            sync: true,
            user_id: uid, 
        }),
        responseType: "json",
      }
    );
    if (xhr?.status !== 200) {
      throw `Request error: ${xhr?.status}`;
    }
    // Example： { key: 'chemistry', name: '化学领域术语库', trans_type: 'en2zh' }
    const result = xhr.response;
    // ztoolkit.log(xhr.response);
    return result;
  };
  