import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";

export async function registerItemBoxExtraRows() {

    await ztoolkit.ItemBox.register(
      "titleTranslation",
      "标题翻译",
      // getField hook is registered in itemTree.ts
      undefined,
      {
        editable: true,
        setFieldHook: (field, value, loadIn, item, original) => {
          ztoolkit.ExtraField.setExtraField(item, field, value);
          return true;
        },
        index: 2,
        multiline: true,
        collapsible: true,
      }
    );
  

    await ztoolkit.ItemBox.register(
      "abstractTranslation",
      "摘要翻译",
      // (field, unformatted, includeBaseMapped, item, original) => {
      //   return ztoolkit.ExtraField.getExtraField(item, field) || "";
      // },
      undefined,
      {
        editable: true,
        setFieldHook: (field, value, loadIn, item, original) => {
          ztoolkit.ExtraField.setExtraField(item, field, value);
          return true;
        },
        index: 7,
        multiline: true,
        collapsible: true,
      }
    );
  }
