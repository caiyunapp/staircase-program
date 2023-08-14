import { caiyuntransStatusCallback } from "./caiyuntrans";

export const secretStatusButtonData: {
  [key: string]: {
    labels: { [_k in "pass" | "fail"]: string };
    callback(status: boolean): void;
  };
} = {
  caiyun: {
    labels: {
      pass: "service.caiyun.secret.pass",
      fail: "service.caiyun.secret.fail",
    },
    callback: caiyuntransStatusCallback,
  },
  deeplcustom: {
    labels: {
      pass: "service-deeplcustom-secret-pass",
      fail: "service-deeplcustom-secret-fail",
    },
    callback: function () {
      Zotero.launchURL(
        "https://github.com/KyleChoy/zotero-pdf-translate/blob/CustomDeepL/README.md",
      );
    },
  },
};
