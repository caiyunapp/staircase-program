import { getService, SERVICES } from "../utils/config";
import { clearPref, getPref, setPref } from "../utils/prefs";
import { setServiceSecret } from "../utils/translate";

export function setDefaultPrefSettings() {

  const isZhCN = Zotero.locale === "zh-CN";
  const servicesIds = SERVICES.map((service) => service.id);
  if (!servicesIds.includes((getPref("translateSource") as string) || "")) {
    setPref("translateSource", "caiyun");
  }
  if (!servicesIds.includes((getPref("dictSource") as string) || "")) {
    setPref("dictSource", isZhCN ? "bingdict" : "freedictionaryapi");
  }

  if (!getPref("targetLanguage")) {
    setPref("targetLanguage", Zotero.locale);
  }

  const secrets = JSON.parse((getPref("secretObj") as string) || "{}");
  for (const serviceId of servicesIds) {
    if (typeof secrets[serviceId] === "undefined") {
      secrets[serviceId] = getService(serviceId).defaultSecret || "";
    }
  }
  setPref("secretObj", JSON.stringify(secrets));

  if (isZhCN && !getPref("disabledLanguages")) {
    setPref("disabledLanguages", "zh,中文,中文;");
  }

  const extraServices = getPref("extraEngines") as string;
  if (extraServices.startsWith(",")) {
    setPref("extraEngines", extraServices.slice(1));
  }

  // For NiuTrans login. caiyuntransLog is deprecated.
  const caiyuntransApiKey = getPref("caiyuntransApikey") as string;
  if (caiyuntransApiKey) {
    setServiceSecret("caiyun", caiyuntransApiKey);
    setServiceSecret("caiyun_research", caiyuntransApiKey);
    setServiceSecret("caiyun_common", caiyuntransApiKey);


    // clearPref("caiyuntransApikey");
  }
  if (getPref("translateSource") === "caiyuntransLog") {
    setPref("translateSource", "caiyun");
  }
  try {
    const oldDict = JSON.parse(
      (getPref("caiyuntransDictLibList") as string) || "{}"
    );
    if (oldDict?.dlist) {
      setPref("caiyuntransDictLibList", JSON.stringify(oldDict.dlist));
    } else {
      setPref("caiyuntransDictLibList", "[]");
    }
    const oldMemory = JSON.parse(
      (getPref("caiyuntransMemoryLibList") as string) || "{}"
    );
    if (oldMemory?.mlist) {
      setPref("caiyuntransMemoryLibList", JSON.stringify(oldMemory?.mlist));
    } else {
      setPref("caiyuntransMemoryLibList", "[]");
    }
  } catch (e) {
    setPref("caiyuntransDictLibList", "[]");
    setPref("caiyuntransMemoryLibList", "[]");
  }
}
