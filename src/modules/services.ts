import ZoteroToolkit from "zotero-plugin-toolkit";
import { getPref } from "../utils/prefs";
import {
  getLastTranslateTask,
  TranslateTask,
  TranslateTaskRunner,
} from "../utils/translate";

export class TranslationServices {
  [key: string]: TranslateTaskRunner | Function;
  constructor() {
    import("./services/caiyun").then(
      (e) => (this.caiyun = new TranslateTaskRunner(e.default))
    );
  }

  public async runTranslationTask(
    task?: TranslateTask,
    options: {
      noCheckZoteroItemLanguage?: boolean;
      noDisplay?: boolean;
    } = {}
  ): Promise<boolean> {
    // ztoolkit.log("runTranslationTask", options);
    task = task || getLastTranslateTask();
    if (!task || !task.raw) {
      // ztoolkit.log("skipped empty");
      return false;
    }
    task.status = "processing" as TranslateTask["status"];
    // Check whether item language is in disabled languages list
    let disabledByItemLanguage = false;
    if (!options.noCheckZoteroItemLanguage && task.itemId) {
      const item = Zotero.Items.getTopLevel([Zotero.Items.get(task.itemId)])[0];
      if (item) {
        const itemLanguage = (
          (item.getField("language") as string) || ""
        ).split("-")[0];
        const disabledLanguages = (
          getPref("disabledLanguages") as string
        ).split(",");
        disabledByItemLanguage = disabledLanguages.includes(itemLanguage);
      }
    }
    if (disabledByItemLanguage) {
      // ztoolkit.log("disabledByItemLanguage");
      return false;
    }
    // Remove possible translation results (for annotations).
    task.raw = task.raw.replace(/🔤[\s\S]*🔤/g, "");
    task.result = "";
    // Display raw
    if (!options.noDisplay) {
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
    }
    // Get task runner
    // ztoolkit.log(task.service);
    // ztoolkit.log(this);
    // const runner = this[task.service] as TranslateTaskRunner;
    const runner = this["caiyun"] as TranslateTaskRunner;
    if (!runner) {
      task.result = `${task.service} is not implemented.`;
      task.status = "fail";
      return false;
    }
    // Run task
    await runner.run(task);
    // Run extra tasks. Do not wait.
    if (task.extraTasks?.length) {
      Promise.all(
        task.extraTasks.map((extraTask) => {
          return this.runTranslationTask(extraTask, {
            noCheckZoteroItemLanguage: options.noCheckZoteroItemLanguage,
            noDisplay: true,
          });
        })
      ).then(() => {
        addon.hooks.onReaderTabPanelRefresh();
      });
    }
    // Try candidate services if current run fails
    if (task.status === "fail" && task.candidateServices.length > 0) {
      task.service = task.candidateServices.shift()!;
      task.status = "waiting";
      return await this.runTranslationTask(task, options);
    } else {
      // Display result
      if (!options.noDisplay) {
        addon.hooks.onReaderPopupRefresh();
        addon.hooks.onReaderTabPanelRefresh();
      }
    }
    const success = task.status === "success";
    const item = Zotero.Items.get(task.itemId!);
    // Data storage for corresponding types
    if (success) {
      switch (task.type) {
        case "annotation":
          {
            if (item) {
              const savePosition = getPref("annotationTranslationPosition") as
                | "comment"
                | "body";
              const currentText = (
                (savePosition === "comment"
                  ? item.annotationComment
                  : item.annotationText) || ""
              ).replace(/🔤[\s\S]*🔤/g, "");
              item[
                savePosition === "comment"
                  ? "annotationComment"
                  : "annotationText"
              ] = `${currentText}${
                currentText[currentText.length - 1] === "\n" ? "" : "\n"
              }🔤${task.result}🔤\n`;
              item.saveTx();
            }
          }
          break;
        case "title":
          {
            if (item) {
              ztoolkit.ExtraField.setExtraField(
                item,
                "标题翻译",
                task.result
              );
              item.saveTx();
            }
          }
          break;
        case "abstract":
          {
            
            if (item) {
              ztoolkit.ExtraField.setExtraField(
                item,
                "摘要翻译",
                task.result
              );
              item.saveTx();
            }
          }
          break;
        default:
          break;
      }
    }
    return success;
  }
}
