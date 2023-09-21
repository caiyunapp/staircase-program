import { getString } from "../utils/locale";
import { config } from "../../package.json";
import { LANG_CODE, TARGET_LANG_CODE,SERVICES } from "../utils/config";
import { getPref, setPref } from "../utils/prefs";
import  GetDefCustomerDictsHttp from './services/customer_dicts';
import  GetUserCustomerDictsHttp from './services/customer_users';
import {
  addTranslateTask,
  getLastTranslateTask,
  putTranslateTaskAtHead,
} from "../utils/translate";
import { get } from "http";
import { link } from "fs";

export async function registerReaderTabPanel() {
  const data:any = {};


  const __uid = getPref('caiyunUserid');
  const user:any = {};
  if ( __uid ) {
    user['uid'] = __uid;
    await updateReaderTabPanelsCustomerDicts(data);
    await updateReaderTabPanelsUserCustomerDicts(user);
  }
  

  ztoolkit.ReaderTabPanel.register(
    getString("readerpanel.label"),
    (
      panel: XUL.TabPanel | undefined,
      ownerDeck: XUL.Deck,
      ownerWindow: Window,
      readerInstance: _ZoteroTypes.ReaderInstance
    ) => {

      if ( __uid ) {
        setPref('defCustomerDictsList', JSON.stringify(data.result))
        setPref('userCustomerDictsList', JSON.stringify(user.result))
      }

      if (ownerDeck.selectedPanel?.children[0].tagName === "vbox") {
        panel = createPanel(ownerDeck, readerInstance._instanceID);
        registerReaderTabPanel();

      }
      panel && buildPanel(panel, readerInstance._instanceID);
    },
    {
      selectPanel: getPref("autoFocus") as boolean,
    }
  ).then((tabId) => {
    addon.data.panel.tabOptionId = tabId;
  });
  new (ztoolkit.getGlobal("MutationObserver"))((_muts) => {
    updateTextAreasSize();
  }).observe(document.querySelector("#zotero-context-pane")!, {
    attributes: true,
    attributeFilter: ["width"],
  });
  document
    .querySelector("#zotero-context-pane")
    ?.querySelector("grippy")
    ?.addEventListener("click", (ev) => {
      updateTextAreasSize();
    });
  updateTextAreasSize(true);

  ztoolkit.log('registerReaderTabPanel')
  // registerReaderTabPanel();
}

async function openWindowPanel() {
  if (addon.data.panel.windowPanel && !addon.data.panel.windowPanel.closed) {
    addon.data.panel.windowPanel.close();
  }
  const dialogData = {
    loadLock: Zotero.Promise.defer(),
  };
  const win: Window = ztoolkit.getGlobal("openDialog")(
    `chrome://${config.addonRef}/content/standalone.xhtml`,
    `${config.addonRef}-standalone`,
    `chrome,extrachrome,menubar,resizable=yes,scrollbars,status,dialog=no,${
      getPref("keepWindowTop") ? ",alwaysRaised=yes" : ""
    }`,
    dialogData
  );
  await dialogData.loadLock.promise;
  buildPanel(
    win.document.querySelector("#panel-container") as XUL.Box,
    "standalone"
  );
  win.addEventListener("resize", (ev) => {
    updateTextAreaSize(win.document);
  });
  buildExtraPanel(win.document.querySelector("#extra-container") as XUL.Box);
  updateTextAreaSize(win.document);
  addon.data.panel.windowPanel = win;
}

export function updateReaderTabPanels() {
  ztoolkit.ReaderTabPanel.changeTabPanel(addon.data.panel.tabOptionId, {
    selectPanel: getPref("autoFocus") as boolean,
  });
  cleanPanels();
  addon.data.panel.activePanels.forEach((panel) => updatePanel(panel));
  if (addon.data.panel.windowPanel && !addon.data.panel.windowPanel.closed) {
    updateExtraPanel(addon.data.panel.windowPanel.document);
  }
  updateTextAreasSize(true);
}

export async function updateReaderTabPanelsCustomerDicts(data:any) {
  data.result =  await GetDefCustomerDictsHttp();
  return data;
}

export async function updateReaderTabPanelsUserCustomerDicts(data:any) {
  data.result =  await GetUserCustomerDictsHttp(data);
  return data;
}

function createPanel(ownerDeck: XUL.Deck, refID: string) {
  const container = ownerDeck.selectedPanel;
  container.innerHTML = "";
  ztoolkit.UI.appendElement(
    {
      tag: "tabbox",
      id: `${config.addonRef}-${refID}-extra-tabbox`,
      classList: ["zotero-view-tabbox"],
      attributes: {
        flex: "1",
      },
      ignoreIfExists: true,
      children: [
        {
          tag: "tabs",
          classList: ["zotero-editpane-tabs"],
          attributes: {
            orient: "horizontal",
          },
          children: [
            {
              tag: "tab",
              attributes: {
                label: getString("readerpanel.label"),
              },
            },
          ],
        },
        {
          tag: "tabpanels",
          classList: ["zotero-view-item"],
          attributes: {
            flex: "1",
          },
          children: [
            {
              tag: "tabpanel",
              attributes: {
                flex: "1",
              },
            },
          ],
        },
      ],
    },
    container
  );
  return container.querySelector("tabpanel") as XUL.TabPanel;
}

function buildPanel(panel: HTMLElement, refID: string, force: boolean = false) {
  const makeId = (type: string) => `${config.addonRef}-${refID}-panel-${type}`;
  // Manually existance check to avoid unnecessary element creation with ...
  if (!force && panel.querySelector(`#${makeId("root")}`)) {
    return;
  }
  var UserStatus = updateLoginPanel(panel, refID);
  ztoolkit.UI.appendElement(
    {
      tag: "vbox",
      id: makeId("root"),
      classList: [`${config.addonRef}-panel-root`],
      attributes: {
        flex: "1",
        align: "stretch",
      },
      styles: {
        padding: "0px 10px 10px 10px",
      },
      ignoreIfExists: true,
      children: UserStatus
    },
    panel
  );
  updatePanel(panel);
  updateTextAreaSize(panel);
  recordPanel(panel);

  ztoolkit.log('--- buildPanel ---');

  updateLoginPanel(panel, refID);
}

function buildExtraPanel(panel: XUL.Box) {
  ztoolkit.UI.appendElement(
    {
      tag: "hbox",
      id: "extraTools",
      attributes: {
        flex: "1",
        align: "center",
      },
      properties: {
        maxHeight: 30,
        minHeight: 30,
      },
      ignoreIfExists: true,
      children: [
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString("readerpanel.extra.addservice.label"),
            flex: "0",
          },
          listeners: [
            {
              type: "click",
              listener: (ev: Event) => {
                const extraServices = getPref("extraEngines");
                setPref(
                  "extraEngines",
                  extraServices
                    ? `${extraServices},${SERVICES[0].id}`
                    : SERVICES[0].id
                );
                openWindowPanel();
              },
            },
          ],
        },
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString("readerpanel.extra.resize.label"),
            flex: "0",
          },
          listeners: [
            {
              type: "click",
              listener: (ev: Event) => {
                const win = addon.data.panel.windowPanel;
                if (!win) {
                  return;
                }
                Array.from(win.document.querySelectorAll("textarea")).forEach(
                  (elem) => (elem.style.width = "280px")
                );
                ztoolkit.getGlobal("setTimeout")(() => {
                  win?.resizeTo(300, win.outerHeight);
                }, 10);
              },
            },
          ],
        },
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString(
              `readerpanel.extra.${
                getPref("keepWindowTop") ? "pinned" : "pin"
              }.label`
            ),
            flex: "0",
          },
          styles: {
            minWidth: "0px",
          },
          listeners: [
            {
              type: "click",
              listener: (ev: Event) => {
                setPref("keepWindowTop", !getPref("keepWindowTop"));
                openWindowPanel();
              },
            },
          ],
        },
      ],
    },
    panel
  );
  ztoolkit.UI.appendElement(
    {
      tag: "vbox",
      attributes: {
        flex: "1",
        align: "stretch",
      },
      children: (getPref("extraEngines") as string)
        .split(",")
        .filter((thisServiceId) =>
          SERVICES.find((service) => service.id === thisServiceId)
        )
        .map((serviceId, idx) => {
          return {
            tag: "vbox",
            attributes: {
              flex: "1",
              align: "stretch",
            },
            children: [
              {
                tag: "hbox",
                id: `${serviceId}-${idx}`,
                attributes: {
                  flex: "1",
                  align: "center",
                },
                properties: {
                  maxHeight: 30,
                  minHeight: 30,
                },
                classList: [serviceId],
                children: [
                  {
                    tag: "menulist",
                    attributes: {
                      flex: "1",
                      value: serviceId,
                    },
                    listeners: [
                      {
                        type: "command",
                        listener: (ev: Event) => {
                          const menulist = ev.currentTarget as XUL.MenuList;
                          const newService = menulist.value;
                          const [serviceId, idx] =
                            menulist.parentElement?.id.split("-") || [];
                          const extraServices = (
                            getPref("extraEngines") as string
                          ).split(",");
                          if (extraServices[Number(idx)] === serviceId) {
                            // If the idx and service matches
                            extraServices[Number(idx)] = newService;
                            menulist.parentElement!.id = `${newService}-${idx}`;
                            menulist.parentElement!.className = newService;
                            setPref("extraEngines", extraServices.join(","));
                          } else {
                            // Otherwise reload window
                            openWindowPanel();
                          }
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
                  {
                    tag: "button",
                    namespace: "xul",
                    attributes: {
                      label: getString("readerpanel.extra.removeservice.label"),
                    },
                    styles: {
                      minWidth: "0px",
                    },
                    listeners: [
                      {
                        type: "click",
                        listener: (ev) => {
                          const [serviceId, idx] =
                            (ev.target as XUL.Button).parentElement?.id.split(
                              "-"
                            ) || [];
                          const extraServices = (
                            getPref("extraEngines") as string
                          ).split(",");
                          // If the idx and service matches
                          if (extraServices[Number(idx)] === serviceId) {
                            extraServices.splice(Number(idx), 1);
                            setPref("extraEngines", extraServices.join(","));
                          }
                          openWindowPanel();
                        },
                      },
                    ],
                  },
                ],
              },
              {
                tag: "hbox",
                attributes: {
                  flex: "1",
                  spellcheck: false,
                },
                children: [
                  {
                    tag: "textarea",
                    styles: {
                      resize: "none",
                      fontSize: `${getPref("fontSize")}px`,
                      "fontFamily": "inherit",
                      lineHeight: getPref("lineHeight") as string,
                    },
                  },
                ],
              },
            ],
          };
        }),
    },
    panel
  );
}

function updateLoginPanel(panel: HTMLElement, refID: string, force: boolean = false) {
  const makeId = (type: string) => `${config.addonRef}-${refID}-panel-${type}`;
  const uid = getPref('caiyunUserid');
  // window.alert(uid)
  const UserStatus = [];
  // const Customer = [];
  if ( uid ) {
   
    const avatar = getPref("caiyunUserAvatar");
    const username = getPref("caiyunUserName");
    const vip_type = getPref("caiyunUserVipType");
    // window.alert(avatar+"  "+username+"  "+vip_type);
    UserStatus.push(
      {
        tag: "div",
        id: makeId("temp"),
        properties: {
          innerHTML: " ",
        },
        styles: {
          marginTop: "10px",
        }
      },
    );

    UserStatus.push( 
      {
        tag: "hbox",
        id: makeId("user_info"),
        attributes: {
          flex: "1",
          align: "center",
        },
        properties: {
          maxHeight: 30,
          minHeight: 30,
        },
        children: [
          {
            tag: "image",
            namespace: "xul",
            id: makeId("user-avater"),
            attributes: {
              src: avatar,
              width: '35px',
              height: '35px',
            }
          },
          {
            tag: "div",
            id: makeId("user-name"),
            properties: {
              innerHTML: username,
            },
            styles: {
              marginLeft: "10px",
              marginTop: "5px",
            },
            // {
            //   tag: "text",
            //   namespace: "xul",
            //   attributes: {
            //     src: 'https://fanyi.caiyunapp.com/assets/webtrs-banner.96d7d824.jpg',
            //     width: '30px',
            //     height: '30px',
            //   },
            // }
          },
        ],
      },);


    //翻译语种
    UserStatus.push(
      {
        tag: "hbox",
        id: makeId("lang"),
        attributes: {
          flex: "1",
          align: "center",
        },
        properties: {
          maxHeight: 30,
          minHeight: 30,
        },
        children: [
          {
            tag: "div",
            properties: {
              innerHTML: getString("readerpanel.translan.default.label"),
            },
          },
          {
            tag: "menulist",
            id: makeId("langfrom"),
            attributes: {
              flex: "1",
            },
            listeners: [
              {
                type: "command",
                listener: (e: Event) => {
                  setPref("sourceLanguage", (e.target as XUL.MenuList).value);
                  addon.hooks.onReaderTabPanelRefresh();
                  ztoolkit.log("listeners langfrom:");
                  ztoolkit.log((e.target as XUL.MenuList).value);
                },
              },
            ],
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
          {
            tag: "div",
            properties: {
              innerHTML: "↔️",
            },
            listeners: [
              {
                type: "click",
                listener: () => {
                  const langfrom = getPref("sourceLanguage") as string;
                  const langto = getPref("targetLanguage") as string;
                  setPref("targetLanguage", langfrom);
                  setPref("sourceLanguage", langto);
                  addon.hooks.onReaderTabPanelRefresh();
                },
              },
            ],
          },
          {
            tag: "menulist",
            id: makeId("langto"),
            attributes: {
              flex: "1",
            },
            listeners: [
              {
                type: "command",
                listener: (e: Event) => {
                  setPref("targetLanguage", (e.target as XUL.MenuList).value);
                  addon.hooks.onReaderTabPanelRefresh();
                  ztoolkit.log("listeners langto:");
                  ztoolkit.log((e.target as XUL.MenuList).value)
                },
              },
            ],
            children: [
              {
                tag: "menupopup",
                children: TARGET_LANG_CODE.map((lang) => ({
                  tag: "menuitem",
                  attributes: {
                    label: lang.name,
                    value: lang.code,
                  },
                })),
              },
            ],
          },
        ], 
      },
    );


    //模型
    UserStatus.push(
      {
        tag: "hbox",
        id: makeId("engine"),
        attributes: {
          flex: "1",
          align: "center",
        },
        properties: {
          maxHeight: 30,
          minHeight: 30,
        },
        children: [
          {
            tag: "div",
            properties: {
              innerHTML: getString("readerpanel.transmodel.default.label"),
            },
          },
          {
            tag: "menulist",
            id: makeId("services"),
            attributes: {
              flex: "1",
            },
            listeners: [
              {
                type: "command",
                listener: (e: Event) => {
                  const newService = (e.target as XUL.MenuList).value;
                  setPref("translateSource", newService);
                  addon.hooks.onReaderTabPanelRefresh();
                  const data = getLastTranslateTask();
                  return;
                  // if (!data) {
                  //   return;
                  // }
                  // data.service = newService;
                  // addon.hooks.onTranslate(undefined, {
                  //   noCheckZoteroItemLanguage: true,
                  // });
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
          }
        ],
      },

      );
    //术语库
   
    if ( vip_type === 'vip' || vip_type==='svip') {
      const __data1:any = getPref('defCustomerDictsList');
      const DEF_CUSTOMER = JSON.parse(__data1);
      const __data2:any = getPref('userCustomerDictsList');
      const USER_CUSTOMER = JSON.parse(__data2);
    
      UserStatus.push( {
        tag: "hbox",
        id: makeId("defcustomerlist"),
        attributes: {
          flex: "1",
          align: "center",
        },
        properties: {
          maxHeight: 30,
          minHeight: 30,
        },
        children: [
          {
            tag: "div",
            properties: {
              innerHTML: getString("readerpanel.customer.default.label"),
            },
          },
          {
            tag: "menulist",
            id: makeId("defcustomer"),
            attributes: {
              flex: "1",
            },
            listeners: [
              {
                type: "command",
                listener: (e: Event) => {
                 
                  setPref("defCustomerDicts", (e.target as XUL.MenuList).value);
                  addon.hooks.onReaderTabPaneCustomerDicts();
                  ztoolkit.log('listener defCustomerDicts:')
                  ztoolkit.log((e.target as XUL.MenuList).value)
                },
              },
            ],
            children: [
              {
                tag: "menupopup",
                children: DEF_CUSTOMER.map((lang:any) => ({
                  tag: "menuitem",
                  attributes: {
                    label: lang.name,
                    value: lang.key ,
                  },
                })),
              },
            ],
          },
        ],
      },);
      UserStatus.push( 
        {
          tag: "hbox",
          id: makeId("vipcustomerlist"),
          attributes: {
            flex: "1",
            align: "center",
          },
          properties: {
            maxHeight: 30,
            minHeight: 30,
          },
          children: [
            {
              tag: "div",
              properties: {
                innerHTML: getString("readerpanel.customer.user.label"),
              },
            },
            {
              tag: "menulist",
              id: makeId("vipcustomer"),
              attributes: {
                flex: "1",
              },
              listeners: [
                {
                  type: "command",
                  listener: (e: Event) => {
                    setPref("useCustomerDicts", (e.target as XUL.MenuList).value);
                    addon.hooks.onReaderTabPaneCustomerDicts();
                  },
                },
              ],
              children: [
                {
                  tag: "menupopup",
                  children: USER_CUSTOMER.map((lang:any) => ({
                    tag: "menuitem",
                    attributes: {
                      label: lang.name,
                      value: lang.name ,
                    },
                  })),
                },
              ],
            },
          ],
        },)
    }else{
      UserStatus.push({
        tag: "hbox",
        id: makeId("vipcustomerlist"),
        attributes: {
          flex: "1",
          align: "center",
        },
        properties: {
          maxHeight: 30,
          minHeight: 30,
        },
        children: [
          {
          tag: "button",
          properties: {
            innerHTML: getString("readerpanel.customer.no_vip.label"),
          },
        },
        {
          tag: "div",
          properties: {
            // href: "https://fanyi.caiyunapp.com/#/mine/vip/pay",
            innerHTML: getString("readerpanel.customer.open_default"),
            marginLeft: "5px",
          }
        }
      ]
      })
    }
  } else {
    UserStatus.push({
      tag: "hbox",
      id: makeId("vipcustomerlist"),
      attributes: {
        flex: "1",
        align: "center",
      },
      properties: {
        maxHeight: 30,
        minHeight: 30,
      },
      children: [
      //   {
      //   tag: "div",
      //   properties: {
      //     innerHTML: getString("readerpanel.customer.default.label"),
      //   },
      // },
      {
        tag: "div",
        properties: {
          // href: "https://fanyi.caiyunapp.com/#/mine/vip/pay",
          innerHTML: getString("readerpanel.customer.id_invalid"),
        }
       
      }
    ]
    })
    
  }

  //operation pane
  UserStatus.push(


    {
      tag: "hbox",
      id: makeId("engine_trans"),
      attributes: {
        flex: "1",
        align: "center",
      },
      properties: {
        maxHeight: 30,
        minHeight: 30,
      },
      children: [
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: `${getString(
              "readerpanel.translate.button.label"
            )}`,
            flex: "1",
          },
          listeners: [
            {
              type: "click",
              listener: (ev: Event) => {
                if (!getLastTranslateTask()) {
                  addTranslateTask(
                    (
                      panel.querySelector(
                        `#${makeId(
                          getPref("rawResultOrder")
                            ? "resulttext"
                            : "rawtext"
                        )}`
                      ) as HTMLTextAreaElement
                    )?.value
                  );
                }
                addon.hooks.onTranslate(undefined, {
                  noCheckZoteroItemLanguage: true,
                });
              },
            },
          ],
        },
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString("readerpanel.concat.clear.label"),
            flex: "0",
          },
          listeners: [
            {
              type: "click",
              listener: (e:Event) => {
                const task = getLastTranslateTask();
                if (task) {
                  task.raw = "";
                  task.result = "";
                  addon.hooks.onReaderTabPanelRefresh();
                }
              },
            },
          ],
        },
      ],
    },
    // {
    //   tag: "hbox",
    //   id: makeId("auto"),
    //   attributes: {
    //     flex: "1",
    //     align: "center",
    //   },
    //   properties: {
    //     maxHeight: 30,
    //     minHeight: 30,
    //   },
    //   children: [
    //     {
    //       tag: "div",
    //       properties: {
    //         innerHTML: getString("readerpanel.auto.description.label"),
    //       },
    //     },
    //     {
    //       tag: "checkbox",
    //       id: makeId("autotrans"),
    //       attributes: {
    //         label: getString("readerpanel.auto.selection.label"),
    //       },
    //       listeners: [
    //         {
    //           type: "command",
    //           listener: (e: Event) => {
    //             setPref("enableAuto", (e.target as XUL.Checkbox).checked);
    //             addon.hooks.onReaderTabPanelRefresh();
    //           },
    //         },
    //       ],
    //     },
    //     {
    //       tag: "checkbox",
    //       id: makeId("autoannot"),
    //       attributes: {
    //         label: getString("readerpanel.auto.annotation.label"),
    //       },
    //       listeners: [
    //         {
    //           type: "command",
    //           listener: (e: Event) => {
    //             setPref(
    //               "enableComment",
    //               (e.target as XUL.Checkbox).checked
    //             );
    //             addon.hooks.onReaderTabPanelRefresh();
    //           },
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   tag: "hbox",
    //   id: makeId("concat"),
    //   attributes: {
    //     flex: "1",
    //     align: "center",
    //   },
    //   properties: {
    //     maxHeight: 30,
    //     minHeight: 30,
    //   },
    //   children: [
    //     {
    //       tag: "div",
    //       properties: {
    //         innerHTML: getString("readerpanel.concat.description.label"),
    //       },
    //     },
    //     {
    //       tag: "checkbox",
    //       id: makeId("concat"),
    //       attributes: {
    //         label: `${getString(
    //           "readerpanel.concat.enable.label"
    //         )}/${getString("alt")}`,
    //       },
    //       listeners: [
    //         {
    //           type: "command",
    //           listener: (e:Event) => {
    //             addon.data.translate.concatCheckbox = (
    //               e.target as XUL.Checkbox
    //             ).checked;
    //             addon.hooks.onReaderTabPanelRefresh();
    //           },
    //         },
    //       ],
    //     },
    //     {
    //       tag: "button",
    //       namespace: "xul",
    //       attributes: {
    //         label: getString("readerpanel.concat.clear.label"),
    //         flex: "0",
    //       },
    //       listeners: [
    //         {
    //           type: "click",
    //           listener: (e:Event) => {
    //             const task = getLastTranslateTask();
    //             if (task) {
    //               task.raw = "";
    //               task.result = "";
    //               addon.hooks.onReaderTabPanelRefresh();
    //             }
    //           },
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      tag: "hbox",
      id: makeId("raw_tip"),
      attributes: {
        flex: "1",
      },
      properties: {
            maxHeight: 20,
            minHeight: 20,
      },
      children: [
        {
          tag: "div",
          properties: {
            innerHTML: "译文:",
          },
        },
      ],
    },
    {
      tag: "hbox",
      id: makeId("raw"),
      attributes: {
        flex: "1",
        spellcheck: false,
      },
      children: [
       
        {
          tag: "textarea",
          id: makeId("rawtext"),
          styles: {
            resize: "none",
            "fontFamily": "inherit",
          },
          listeners: [
            {
              type: "input",
              listener: (ev:Event) => {
                const task = getLastTranslateTask({
                  id: panel.getAttribute("translate-task-id") || "",
                });
                if (!task) {
                  return;
                }
                const reverseRawResult = getPref("rawResultOrder");
                if (!reverseRawResult) {
                  task.raw = (ev.target as HTMLTextAreaElement).value;
                } else {
                  task.result = (ev.target as HTMLTextAreaElement).value;
                }
                putTranslateTaskAtHead(task.id);
              },
            },
          ],
        },
      ],
    },
    // {
    //   tag: "splitter",
    //   id: makeId("splitter"),
    //   attributes: { collapse: "after" },
    //   children: [
    //     {
    //       tag: "grippy",
    //     },
    //   ],
    // },
    {
      tag: "hbox",
      id: makeId("raw_tip_trans"),
      attributes: {
        flex: "1",
      },
      properties: {
            maxHeight: 20,
            minHeight: 20,
      },
      children: [
        {
          tag: "div",
          properties: {
            innerHTML: "原文/选择的文本内容:",
          },
        },
      ],
    },
    {
      tag: "hbox",
      id: makeId("result"),
      attributes: {
        flex: "1",
        spellcheck: false,
      },
      children: [
        {
          tag: "textarea",
          id: makeId("resulttext"),
          styles: {
            resize: "none",
            "fontFamily": "inherit",
          },
          listeners: [
            {
              type: "input",
              listener: (ev:Event) => {
                console.log(ev)
                const task = getLastTranslateTask({
                  id: panel.getAttribute("translate-task-id") || "",
                });
                if (!task) {
                  return;
                }
                const reverseRawResult = getPref("rawResultOrder");
                if (!reverseRawResult) {
                  task.result = (ev.target as HTMLTextAreaElement).value;
                } else {
                  task.raw = (ev.target as HTMLTextAreaElement).value;
                }
                putTranslateTaskAtHead(task.id);
              },
            },
          ],
        },
      ],
    },
    {
      tag: "hbox",
      id: makeId("copy"),
      attributes: {
        flex: "1",
        align: "center",
      },
      properties: {
        maxHeight: 20,
        minHeight: 20,
      },
      children: [
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString("readerpanel.copy.raw.label"),
            flex: "1",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                const task = getLastTranslateTask({
                  id: panel.getAttribute("translate-task-id") || "",
                });
                if (!task) {
                  return;
                }
                new ztoolkit.Clipboard()
                  .addText(task.raw, "text/unicode")
                  .copy();
              },
            },
          ],
        },
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString("readerpanel.copy.result.label"),
            flex: "1",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                const task = getLastTranslateTask({
                  id: panel.getAttribute("translate-task-id") || "",
                });
                if (!task) {
                  return;
                }
                new ztoolkit.Clipboard()
                  .addText(task.result, "text/unicode")
                  .copy();
              },
            },
          ],
        },
        // {
        //   tag: "button",
        //   namespace: "xul",
        //   attributes: {
        //     label: getString("readerpanel.copy.both.label"),
        //     flex: "1",
        //   },
        //   listeners: [
        //     {
        //       type: "click",
        //       listener: (e: Event) => {
        //         const task = getLastTranslateTask({
        //           id: panel.getAttribute("translate-task-id") || "",
        //         });
        //         if (!task) {
        //           return;
        //         }
        //         new ztoolkit.Clipboard()
        //           .addText(
        //             `${task.raw}\n----\n${task.result}`,
        //             "text/unicode"
        //           )
        //           .copy();
        //       },
        //     },
        //   ],
        // },
      ],
    },
    {
      tag: "hbox",
      id: makeId("openwindow"),
      attributes: {
        flex: "1",
        align: "center",
      },
      properties: {
        maxHeight: 30,
        minHeight: 30,
      },
      children: [
        {
          tag: "button",
          namespace: "xul",
          attributes: {
            label: getString("readerpanel.openwindow.open.label"),
            flex: "1",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                openWindowPanel();
              },
            },
          ],
        },
      ],
    }
  );
  return UserStatus;
  
}

function updatePanel(panel: HTMLElement) {
  const idPrefix = panel
    .querySelector(`.${config.addonRef}-panel-root`)!
    .id.split("-")
    .slice(0, -1)
    .join("-");
  const makeId = (type: string) => `${idPrefix}-${type}`;
  const updateHidden = (type: string, pref: string) => {
    const elem = panel.querySelector(`#${makeId(type)}`) as XUL.Box;
    elem.hidden = !getPref(pref) as boolean;
  };
  const setCheckBox = (type: string, checked: boolean) => {
    const elem = panel.querySelector(`#${makeId(type)}`) as XUL.Checkbox;
    elem.checked = checked;
  };
  const setValue = (type: string, value: string) => {
    const elem = panel.querySelector(`#${makeId(type)}`) as XUL.Textbox;
    elem.value = value;
  };
  const setTextBoxStyle = (type: string) => {
    const elem = panel.querySelector(`#${makeId(type)}`) as XUL.Textbox;
    elem.style.fontSize = `${getPref("fontSize")}px`;
    elem.style.lineHeight = getPref("lineHeight") as string;
  };

  updateHidden("engine", "showSidebarEngine");
  updateHidden("lang", "showSidebarLanguage");
  // updateHidden("auto", "showSidebarSettings");
  // updateHidden("concat", "showSidebarConcat");
  updateHidden("raw", "showSidebarRaw");
  // updateHidden("splitter", "showSidebarRaw");
  updateHidden("copy", "showSidebarCopy");

  setValue("services", getPref("translateSource") as string);
  setValue("langfrom", getPref("sourceLanguage") as string);
  setValue("langto", getPref("targetLanguage") as string);

  // setCheckBox("autotrans", getPref("enableAuto") as boolean);
  // setCheckBox("autoannot", getPref("enableComment") as boolean);
  // setCheckBox("concat", addon.data.translate.concatCheckbox);

  const lastTask = getLastTranslateTask();
  if (!lastTask) {
    return;
  }
  // For manually update translation task
  panel.setAttribute("translate-task-id", lastTask.id);
  const reverseRawResult = getPref("rawResultOrder");
  setValue("rawtext", reverseRawResult ? lastTask.result : lastTask.raw);
  setValue("resulttext", reverseRawResult ? lastTask.raw : lastTask.result);
  setTextBoxStyle("rawtext");
  setTextBoxStyle("resulttext");
  panel
    .querySelector(`#${makeId("splitter")}`)
    ?.setAttribute("collapse", reverseRawResult ? "after" : "before");
}

function updateExtraPanel(container: HTMLElement | Document) {
  const extraTasks = getLastTranslateTask()?.extraTasks;
  if (extraTasks?.length === 0) {
    return;
  }
  extraTasks?.forEach((task) => {
    Array.from(
      container.querySelectorAll(`.${task.service}+hbox>textarea`)
    ).forEach((elem) => ((elem as HTMLTextAreaElement).value = task.result));
  });
}

function updateTextAreaSize(
  container: HTMLElement | Document,
  noDelay: boolean = false
) {
  const setTimeout = ztoolkit.getGlobal("setTimeout");
  Array.from(container.querySelectorAll("textarea")).forEach((elem) => {
    if (noDelay) {
      elem.style.width = `${elem.parentElement?.scrollWidth}px`;
      return;
    }
    elem.style.width = "0px";
    setTimeout(() => {
      elem.style.width = `${elem.parentElement?.scrollWidth}px`;
    }, 0);
  });
}

function updateTextAreasSize(noDelay: boolean = false) {
  cleanPanels();
  addon.data.panel.activePanels.forEach((panel) =>
    updateTextAreaSize(panel, noDelay)
  );
}

function recordPanel(panel: HTMLElement) {
  addon.data.panel.activePanels.push(panel);
}

function cleanPanels() {
  addon.data.panel.activePanels = addon.data.panel.activePanels.filter(
    (elem) => elem.parentElement
  );
}
