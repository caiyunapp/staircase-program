import { JSEncrypt } from "jsencrypt";
import { getString } from "../../utils/locale";
import { getPref, setPref } from "../../utils/prefs";
import { setServiceSecret } from "../../utils/secret";

export async function caiyuntransStatusCallback(status: boolean) {
  const dictLibList = getPref("caiyuntransDictLibList") as string;
  const memoryLibList = getPref("caiyuntransMemoryLibList") as string;
  const signInOrRefresh = status ? "refresh" : "signin";
  const dialogData: { [key: string | number]: any } = {
    username: getPref("caiyuntransUsername"),
    password: getPref("caiyuntransPassword"),
    dictLibList,
    memoryLibList,
    dictNo: getPref("caiyuntransDictNo"),
    memoryNo: getPref("caiyuntransMemoryNo"),
    beforeUnloadCallback: () => {
      setPref("caiyuntransUsername", dialog.dialogData.username);
      setPref("caiyuntransPassword", dialog.dialogData.password);
      setPref("caiyuntransDictLibList", dialog.dialogData.dictLibList);
      setPref("caiyuntransMemoryLibList", dialog.dialogData.memoryLibList);
      setPref("caiyuntransDictNo", dialog.dialogData.dictNo);
      setPref("caiyuntransMemoryNo", dialog.dialogData.memoryNo);
    },
  };
  const dialog = new ztoolkit.Dialog(5, 3)
    .setDialogData(dialogData)
    .addCell(
      0,
      0,
      {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "username",
        },
        properties: {
          innerHTML: getString("service.caiyun.dialog.username"),
        },
      },
      false,
    )
    .addCell(0, 1, {
      tag: "input",
      id: "username",
      attributes: {
        "data-bind": "username",
        "data-prop": "value",
        type: "text",
      },
    })
    .addCell(
      0,
      2,
      {
        tag: "a",
        properties: {
          href: "https://caiyuntrans.com/register",
          innerHTML: getString("service.caiyun.dialog.signup"),
        },
      },
      false,
    )
    .addCell(
      1,
      0,
      {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "password",
        },
        properties: {
          innerHTML: getString("service.caiyun.dialog.password"),
        },
      },
      false,
    )
    .addCell(1, 1, {
      tag: "input",
      id: "password",
      attributes: {
        "data-bind": "password",
        "data-prop": "value",
        type: "password",
      },
    })
    .addCell(
      1,
      2,
      {
        tag: "a",
        properties: {
          href: "https://caiyuntrans.com/password_find",
          innerHTML: getString("service.caiyun.dialog.forget"),
        },
      },
      false,
    )
    .addCell(4, 0, {
      tag: "div",
      styles: {
        width: "200px",
      },
      children: [
        {
          tag: "span",
          properties: {
            innerHTML: getString("service.caiyun.dialog.tip0"),
          },
        },
        {
          tag: "a",
          properties: {
            href: "https://fanyi.caiyunapp.com",
            innerHTML: getString("service.caiyun.dialog.tip1"),
          },
        },
        {
          tag: "span",
          properties: {
            innerHTML: getString("service.caiyun.dialog.tip2"),
          },
        },
      ],
    })
    .addButton(
      getString(`service.caiyun.dialog.${signInOrRefresh}`),
      "signin",
    )
    .addCell(4, 1, { tag: "fragment" }, false)
    .addCell(4, 2, { tag: "fragment" }, false);


 
  await dialogData.unloadLock?.promise;
  switch (dialogData._lastButtonId) {
    case "signin":
      {
        const { loginFlag, loginErrorMessage } = await caiyuntransLogin(
          dialogData.username,
          dialogData.password,
        );
        if (!loginFlag) {
          window.alert(loginErrorMessage);
        }
        await caiyuntransStatusCallback(loginFlag);
      }
      break;
    case "signout": {
      {
        setPref("caiyuntransUsername", "");
        setPref("caiyuntransPassword", "");
        setPref("caiyuntransDictLibList", "[]");
        setPref("caiyuntransMemoryLibList", "[]");
        setPref("caiyuntransDictNo", "");
        setPref("caiyuntransMemoryNo", "");
        setServiceSecret("caiyun", "");
        await caiyuntransStatusCallback(false);
        break;
      }
    }
    default:
      break;
  }
}

async function caiyuntransLogin(username: string, password: string) {
  let loginFlag = false;
  let loginErrorMessage = "Not login";
  const keyxhr = await getPublicKey();
  if (keyxhr?.status !== 200 || keyxhr.response.flag !== 1) {
    return { loginFlag, loginErrorMessage };
  }
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(keyxhr.response.key);
  let encryptionPassword = encrypt.encrypt(password);
  encryptionPassword = encodeURIComponent(encryptionPassword);
  const userLoginXhr = await loginApi(username, encryptionPassword);
  if (userLoginXhr?.status === 200) {
    if (userLoginXhr.response.flag === 1) {
      const apikey = userLoginXhr.response.apikey;
      setPref("caiyuntransUsername", username);
      setPref("caiyuntransPassword", password);
      setServiceSecret("caiyun", apikey);
      await setDictLibList(apikey);
      await setMemoryLibList(apikey);
      loginFlag = true;
    } else {
      loginFlag = false;
      loginErrorMessage = userLoginXhr.response.msg;
    }
  }
  return { loginFlag, loginErrorMessage };
}

async function loginApi(username: string, password: string) {
  return await Zotero.HTTP.request(
    "POST",
    "https://apis.caiyuntrans.com/NiuTransAPIServer/checkInformation",
    {
      body: `account=${username}&encryptionPassword=${password}`,
      responseType: "json",
    },
  );
}

async function setDictLibList(apikey: string) {
  const xhr = await Zotero.HTTP.request(
    "POST",
    "https://apis.caiyuntrans.com/NiuTransAPIServer/getDictLibList",
    {
      body: `apikey=${apikey}`,
      responseType: "json",
    },
  );
  if (xhr?.status === 200 && xhr.response.flag !== 0) {
    const dictList = xhr.response.dlist as {
      dictName: string;
      dictNo: string;
      isUse: number;
    }[];
    const dictNo = dictList.find((dict) => dict.isUse === 1)?.dictNo || "";
    if (dictNo && !getPref("caiyuntransDictNo")) {
      setPref("caiyuntransDictNo", dictNo);
    }
    setPref(
      "caiyuntransDictLibList",
      JSON.stringify(
        dictList.map((dict) => ({
          dictName: dict.dictName,
          dictNo: dict.dictNo,
        })),
      ),
    );
  }
}

async function setMemoryLibList(apikey: string) {
  const xhr = await Zotero.HTTP.request(
    "POST",
    "https://apis.caiyuntrans.com/NiuTransAPIServer/getMemoryLibList",
    {
      body: `apikey=${apikey}`,
      responseType: "json",
    },
  );

  if (xhr?.status === 200 && xhr.response.flag !== 0) {
    const memoryList = xhr.response.mlist as {
      memoryName: string;
      memoryNo: string;
      isUse: number;
    }[];
    const memoryNo =
      memoryList.find((memory) => memory.isUse === 1)?.memoryNo || "";
    if (memoryNo && !getPref("caiyuntransMemoryNo")) {
      setPref("caiyuntransMemoryNo", memoryNo);
    }
    setPref(
      "caiyuntransMemoryLibList",
      JSON.stringify(
        memoryList.map((memory) => ({
          memoryName: memory.memoryName,
          memoryNo: memory.memoryNo,
        })),
      ),
    );
  }
}

async function getPublicKey() {
  return await Zotero.HTTP.request(
    "GET",
    "https://apis.caiyuntrans.com/NiuTransAPIServer/getpublickey",
    {
      responseType: "json",
    },
  );
}
