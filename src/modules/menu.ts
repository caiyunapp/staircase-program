import { config } from "../../package.json";
import { getString } from "../utils/locale";
import {
  addTranslateAbstractTask,
  addTranslateTitleTask,
  TranslateTask,
} from "../utils/translate";

export function registerMenu() {
  const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
}
