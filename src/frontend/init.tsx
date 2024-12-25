import * as React from 'react';
import { createRoot } from 'react-dom/client';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getBrowserLanguage, languageName, resources } from './langs';
import { App } from './App';
import { LOCALSTORAGE_KEY_LANG } from './const';

import 'xeltica-ui/dist/css/xeltica-ui.min.css';
import './style.scss';
import 'dayjs/locale/ja';

dayjs.extend(relativeTime);

let lng = localStorage[LOCALSTORAGE_KEY_LANG];

if (!lng || !Object.keys(languageName).includes(lng)) {
  lng = localStorage[LOCALSTORAGE_KEY_LANG] = getBrowserLanguage();
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng,
    interpolation: {
      escapeValue: false // Reactは常にXSS対策をしてくれるので、i18next側では対応不要
    }
  });

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(<App />);
