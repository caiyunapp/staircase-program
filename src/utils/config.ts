interface TranslateService {
  type: "word" | "sentence";
  id: string;
  defaultSecret?: string;
  secretValidator?: (secret: string) => SecretValidateResult;
}

export interface SecretValidateResult {
  secret: string;
  status: boolean;
  info: string;
}

export const SERVICES: Readonly<Readonly<TranslateService>[]> = <const>[
  {
    type: "sentence",
    id: "caiyun",
    defaultSecret: "3975l6lr5pcbvidl6jl2",
  },
];

export function getService(id: string) {
  return SERVICES[SERVICES.findIndex((service) => service.id === id)];
}

export const LANG_CODE = <const>[
  { code: "ru", name: "Russian" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
];

// export const DEF_CUSTOMER = <const> [
//   { key: 'law', name: '法学领域术语库', trans_type: 'en2zh' },
//   { key: 'medicine', name: '医学领域术语库', trans_type: 'en2zh' },
//   { key: 'machinery', name: '机械领域术语库', trans_type: 'en2zh' },
//   { key: 'computer', name: '计算机领域术语库', trans_type: 'en2zh' },
//   { key: 'commerce', name: '商贸领域术语库', trans_type: 'en2zh' },
//   { key: 'psychology', name: '心理学领域术语库', trans_type: 'en2zh' },
//   { key: 'chemistry', name: '化学领域术语库', trans_type: 'en2zh' }
// ]


export const SVGIcon = `<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M23.3155 8.18419C22.8986 8.31989 8.76245 11.3119 8.76245 11.3119C8.01199 11.5032 7.41685 12.2586 7.41685 12.9976V26.2394C7.41685 26.2394 8.68397 24.8414 9.52109 24.127C10.1734 23.5694 11.3572 23.0986 11.5501 23.0315C12.3463 22.7585 22.1939 20.6968 22.1939 20.6968C24.6823 19.9806 24.5826 18.653 24.5826 18.653C24.5826 18.653 24.5826 9.26492 24.5826 8.65506C24.5826 8.00597 24.0758 7.29475 24.0758 7.29475C24.0758 7.29475 24.5712 7.77544 23.3155 8.18419Z" fill="url(#paint0_linear_2_59)"/>
<path d="M12.845 17.5608C13.431 17.5608 13.9061 17.0858 13.9061 16.4997C13.9061 15.9137 13.431 15.4386 12.845 15.4386C12.259 15.4386 11.7839 15.9137 11.7839 16.4997C11.7839 17.0858 12.259 17.5608 12.845 17.5608Z" fill="white"/>
<path d="M17.2317 16.5848C17.8177 16.5848 18.2928 16.1097 18.2928 15.5237C18.2928 14.9376 17.8177 14.4625 17.2317 14.4625C16.6457 14.4625 16.1706 14.9376 16.1706 15.5237C16.1706 16.1097 16.6457 16.5848 17.2317 16.5848Z" fill="white"/>
<path opacity="0.5" d="M21.5546 15.6103C22.1406 15.6103 22.6157 15.1352 22.6157 14.5492C22.6157 13.9632 22.1406 13.4881 21.5546 13.4881C20.9686 13.4881 20.4935 13.9632 20.4935 14.5492C20.4935 15.1352 20.9686 15.6103 21.5546 15.6103Z" fill="white"/>
<path d="M21.3617 5.7922C21.9437 5.88049 22.5421 6.03418 23.0784 6.36772C23.376 6.55247 23.6458 6.79281 23.8992 7.07894C24.2687 7.49749 24.5826 8.09263 24.5826 8.78913V18.604C24.5826 19.065 24.3112 19.4623 24.3112 19.4623C24.3112 19.4623 24.5532 18.9048 23.9793 18.3734C23.3547 17.7963 21.3257 17.3418 21.3257 17.3418C20.6243 17.1799 20.4951 16.9641 20.4951 15.8817C20.4951 15.8817 20.4951 6.62441 20.4951 6.60152C20.4951 6.3481 20.5851 5.99494 20.7404 5.87558C20.9448 5.71699 21.1737 5.75787 21.396 5.7922C21.396 5.7922 21.36 5.7922 21.3617 5.7922Z" fill="url(#paint1_linear_2_59)"/>
<path opacity="0.5" d="M22.2936 5.98349V17.5919C22.7841 17.7423 23.4381 17.9516 23.7651 18.1887V6.86802C23.6016 6.67346 23.3498 6.50505 23.1291 6.36771C22.8544 6.19767 22.6206 6.07505 22.2936 5.98349Z" fill="url(#paint2_linear_2_59)"/>
<defs>
<linearGradient id="paint0_linear_2_59" x1="2.81132" y1="19.4809" x2="22.4667" y2="15.3557" gradientUnits="userSpaceOnUse">
<stop offset="0.00887941" stop-color="#00DA77"/>
<stop offset="0.5" stop-color="#00B977"/>
<stop offset="1" stop-color="#008F69"/>
</linearGradient>
<linearGradient id="paint1_linear_2_59" x1="19.926" y1="12.2023" x2="24.7247" y2="12.8989" gradientUnits="userSpaceOnUse">
<stop offset="0.000395787" stop-color="#8DEBBB" stop-opacity="0.5"/>
<stop offset="1" stop-color="#00B977"/>
</linearGradient>
<linearGradient id="paint2_linear_2_59" x1="22.2177" y1="12.0857" x2="23.6892" y2="12.0857" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.3"/>
<stop offset="0.9967" stop-color="white" stop-opacity="0.5"/>
</linearGradient>
</defs>
</svg>`;