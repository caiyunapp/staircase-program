import { config } from "../../package.json";
import { LANG_CODE, SERVICES } from "../utils/config";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import { secretStatusButtonData } from "./settings";
import { UID } from '../config/user';
import { getService } from '../utils/config';


import {
  validateServiceSecret,
  setServiceSecret,
} from "../utils/translate";

export function registerPrefsWindow() {
  ztoolkit.PreferencePane.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("pref.title"),
    image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
    defaultXUL: true,
  });
}

export function registerPrefsScripts(_window: Window) {
  ztoolkit.log('----- registerPrefsScripts -----')
  // This function is called when the prefs window is opened
  addon.data.prefs.window = _window;
  ztoolkit.log('buildPrefsPane:start');
  buildPrefsPane();
  ztoolkit.log('buildPrefsPane:over');
  updatePrefsPaneDefault();
}

function buildPrefsPane() {
  ztoolkit.log('--- buildPrefsPane ----')
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }
  // menus
  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("sentenceServices"),
      attributes: {
        value: getPref("translateSource") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setSentenceService");
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          children: SERVICES.filter(
            (service) => service.type === "sentence"
          ).map((service) => ({
            tag: "menuitem",
            attributes: {
              label: getString(`service.${service.id}`),
              value: service.id,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("sentenceServices-placeholder")}`)!
  );

  // ztoolkit.UI.replaceElement(
  //   {
  //     tag: "menulist",
  //     id: makeId("wordServices"),
  //     attributes: {
  //       value: getPref("dictSource") as string,
  //       native: "true",
  //     },
  //     classList: ["use-word-service"],
  //     listeners: [
  //       {
  //         type: "command",
  //         listener: (e: Event) => {
  //           onPrefsEvents("setWordService");
  //         },
  //       },
  //     ],
  //     children: [
  //       {
  //         tag: "menupopup",
  //         children: SERVICES.filter((service) => service.type === "word").map(
  //           (service) => ({
  //             tag: "menuitem",
  //             attributes: {
  //               label: getString(`service.${service.id}`),
  //               value: service.id,
  //             },
  //           })
  //         ),
  //       },
  //     ],
  //   },
  //   doc.querySelector(`#${makeId("wordServices-placeholder")}`)!
  // );
  // ztoolkit.log('menulist:over');

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("langfrom"),
      attributes: {
        value: getPref("sourceLanguage") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setSourceLanguage");
          },
        },
      ],
      styles: {
        maxWidth: "250px",
      },
      children: [
        {
          tag: "menupopup",
          children: LANG_CODE.map((lang) => ({
            tag: "menuitem",
            attributes: {
              label: lang.name,
              value: lang.code,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("langfrom-placeholder")}`)!
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("langto"),
      attributes: {
        value: getPref("targetLanguage") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setTargetLanguage");
          },
        },
      ],
      styles: {
        maxWidth: "250px",
      },
      children: [
        {
          tag: "menupopup",
          children: LANG_CODE.map((lang) => ({
            tag: "menuitem",
            attributes: {
              label: lang.name,
              value: lang.code,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("langto-placeholder")}`)!
  );

  doc
    .querySelector(`#${makeId("enableAuto")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setAutoTranslateSelection");
    });

  doc
    .querySelector(`#${makeId("enableComment")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setAutoTranslateAnnotation");
    });
  
  doc
    .querySelector(`#${makeId("enablePopup")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setEnablePopup");
    });
  
  doc
    .querySelector(`#${makeId("enableAddToNote")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setEnableAddToNote");
    });

  doc
    .querySelector(`#${makeId("useWordService")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setUseWordService");
    });

  doc
    .querySelector(`#${makeId("sentenceServicesSecret")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateSentenceSecret");
    });

  doc
    .querySelector(`#${makeId("wordServicesSecret")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateWordSecret");
    });

  doc
    .querySelector(`#${makeId("fontSize")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateFontSize");
    });

  doc
    .querySelector(`#${makeId("lineHeight")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updatelineHeight");
    });

  doc
    .querySelector(`#${makeId("caiyunUserAccount")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateuseraccount");
    });

  doc
    .querySelector(`#${makeId("caiyunUserCode")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateusercode");
    });
}

function updatePrefsPaneDefault() {
  ztoolkit.log('update updatePrefsPaneDefault start')
  onPrefsEvents("setAutoTranslateAnnotation", false);
  onPrefsEvents("setEnablePopup", false);
  onPrefsEvents("setUseWordService", false);
  onPrefsEvents("setSentenceSecret", false);
  onPrefsEvents("setWordSecret", false);
  ztoolkit.log('&& setWordSecret: over &&')
  onPrefsEvents("updateUserStatus", false);
  ztoolkit.log('update updatePrefsPaneDefault over')
}

function onPrefsEvents(type: string, fromElement: boolean = true) {
  ztoolkit.log('type:' + type)
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  const setDisabled = (className: string, disabled: boolean) => {
    doc
      .querySelectorAll(`.${className}`)
      .forEach(
        (elem) => ((elem as XUL.Element & XUL.IDisabled).disabled = disabled)
      );
  };
  ztoolkit.log('--- add switch:' + type + "----")
  switch (type) {
    case "setAutoTranslateSelection":
      addon.hooks.onReaderTabPanelRefresh();
      break;
    case "setAutoTranslateAnnotation":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enableComment")}`) as XUL.Checkbox)
              .checked
          : (getPref("enableComment") as boolean);
        const hidden = !elemValue;
        setDisabled("auto-annotation", hidden);
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "setEnablePopup":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enablePopup")}`) as XUL.Checkbox)
              .checked
          : (getPref("enablePopup") as boolean);
        const hidden = !elemValue;
        setDisabled("enable-popup", hidden);
        if (!hidden) {
          onPrefsEvents("setEnableAddToNote", fromElement);
        }
      }
      break;
    case "setEnableAddToNote":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enableAddToNote")}`) as XUL.Checkbox)
              .checked
          : (getPref("enableNote") as boolean);
        const hidden = !elemValue;
        setDisabled("enable-popup-addtonote", hidden);
      }
      break;
    case "setUseWordService":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("useWordService")}`) as XUL.Checkbox)
              .checked
          : (getPref("enableDict") as boolean);
        const hidden = !elemValue;
        setDisabled("use-word-service", hidden);
      }
      break;
    case "setSentenceService":
      {
        setPref(
          "translateSource",
          (
            doc.querySelector(`#${makeId("sentenceServices")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        onPrefsEvents("setSentenceSecret", fromElement);
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "updateSentenceSecret":
      {
        setServiceSecret(
          getPref("translateSource") as string,
          (
            doc.querySelector(
              `#${makeId("sentenceServicesSecret")}`
            ) as HTMLInputElement
          ).value
        );
      }
      break;
    case "setSentenceSecret":
      {
        const serviceId = getPref("translateSource") as string;
        const secretCheckResult = validateServiceSecret(
          serviceId,
          (validateResult) => {
            if (fromElement && !validateResult.status) {
              addon.data.prefs.window?.alert(
                `You see this because the translation service ${serviceId} requires SECRET, which is NOT correctly set.\n\nDetails:\n${validateResult.info}`
              );
            }
          }
        );
        (
          doc.querySelector(
            `#${makeId("sentenceServicesSecret")}`
          ) as HTMLInputElement
        ).value = secretCheckResult.secret;
        // Update secret status button
        const statusButtonData = secretStatusButtonData[serviceId];
        const statusButton = doc.querySelector(
          `#${makeId("sentenceServicesStatus")}`
        ) as XUL.Button;
        if (statusButtonData) {
          statusButton.hidden = false;
          statusButton.label = getString(
            statusButtonData.labels[secretCheckResult.status ? "pass" : "fail"]
          );
          statusButton.onclick = (ev) => {
            statusButtonData.callback(secretCheckResult.status);
          };
        } else {
          statusButton.hidden = true;
        }
      }
      break;
    case "setWordService":
      {
        setPref(
          "dictSource",
          (
            doc.querySelector(`#${makeId("wordServices")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        onPrefsEvents("setWordSecret", fromElement);
      }
      break;
    case "updateWordSecret":
      {
        setServiceSecret(
          getPref("dictSource") as string,
          (
            doc.querySelector(
              `#${makeId("wordServicesSecret")}`
            ) as HTMLInputElement
          ).value
        );
      }
      break;
    case "setWordSecret":
      { 
        ztoolkit.log('add setWordSecret, is loading...')

        const __serviceId = getService('caiyun')['defaultSecret'] || '';
        const serviceId = __serviceId;

        // const input = doc.querySelector(
        //   `#${makeId("wordServicesSecret")}`
        // ) as HTMLInputElement;
        // ztoolkit.log(input);
        // input.value = serviceId;
        // ztoolkit.log(serviceId)
      }
      break;
    case "setSourceLanguage":
      {
        setPref(
          "sourceLanguage",
          (
            doc.querySelector(`#${makeId("langfrom")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "setTargetLanguage":
      {
        setPref(
          "targetLanguage",
          (
            doc.querySelector(`#${makeId("langto")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "updateFontSize":
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
      break;
    case "updatelineHeight":
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
      break;
    case "updateUserStatus": 
      ztoolkit.log('用户登录信息');
      const box1 = doc.querySelector(
        `#${makeId("caiyunNeedLogin")}`
      ) as XUL.Box;
      const box2 = doc.querySelector(
        `#${makeId("caiyunIsLogin")}`
      ) as XUL.Box;
      if ( UID ) {
        ztoolkit.log('用户登录');
        showLogout(doc, box1, box2 );
      } else {
        ztoolkit.log('未登录')
        showLogin(doc, box1, box2 );
      }
      break;
    case "updateuseraccount":
      ztoolkit.log('--- updateuseraccount ---')
      break;
    case "updateusercode":
      ztoolkit.log('--- updateusercode ---')
      break;
    default:
      return;
  }
}

function makeId(type: string) {
  return `${config.addonRef}-${type}`;
}


function showLogin(doc:Document, box1:HTMLElement, box2:HTMLElement ) {
  box1.hidden = false;
  box2.hidden = true; 
  const loginButton = doc.querySelector(
    `#${makeId("caiyunUserLogin")}`
  ) as XUL.Button;
  
  const codeButton = doc.querySelector(
    `#${makeId("caiyunUserSendCode")}`
  ) as XUL.Button;

  loginButton.onclick = ($event) => {
    ztoolkit.log('login');
    
    const account = doc.querySelector(
      `#${makeId("caiyunUserAccount")}`
    ) as HTMLInputElement;
    const __account = account.value;
    console.log('account:' + __account);
    const code = doc.querySelector(
      `#${makeId("caiyunUserCode")}`
    ) as HTMLInputElement;
    const __code = code.value;
    console.log('code:' + __code);


    showLogout( doc,box1,box2 )

  }

  codeButton.onclick = ($event) => {
    ztoolkit.log('code');
    const account = doc.querySelector(
      `#${makeId("caiyunUserAccount")}`
    ) as HTMLInputElement;
    const phone = account.value;
    ztoolkit.log('account:' + phone);
  }
}
function showLogout(doc:Document,  box1:HTMLElement, box2:HTMLElement  ) {
  box1.hidden = true;
  box2.hidden = false; 
  const loginoutButton = doc.querySelector(
    `#${makeId("caiyunUserLogOut")}`
  ) as XUL.Button;
  loginoutButton.onclick = () => {
    ztoolkit.log('loginout');
    showLogin(doc, box1, box2 );
  }
}
