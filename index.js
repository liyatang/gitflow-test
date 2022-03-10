import 'styles/common/common.scss';

/*
 * 需要跑在最前面
 * 1 需要再前面初始化的部分。如多语；registProcessEnv
 * 2 注意：@ones-ai/unit 会被 babel 处理放在文件的前面，引发bug。
 * */
import './index_before';

import React from 'react';
import ReactDom from 'react-dom';
import { initELK } from '@ones-ai/components/src/scripts/third_script';
import { assignDefaultOptions } from '@ones-ai/utils/lib/request';
import Logger from '@ones-ai/utils/lib/logger';
import { getEnvVariable } from '@ones-ai/utils/lib/env_config';
import OnesProductEnum from '@ones-ai/dao/lib/enums/product';
import { OpenPlatformConnector } from '@ones-ai/components/src/scripts/open_platform_connector';
import { getGoogleAccountLoginSupport } from 'components_scripts/third_party_connect/utils';
import {
  getGoogleApiSrc,
  getGoogleClientId,
} from 'components_scripts/third_party_connect/google_account/utils/google_account_helper';
import Root from './root';
import { initThird, disableStatsCollect } from './utils/third_scripts';

const isDevelopmentOnline = process.env.ENV_MODE === 'development_online';
const isProduction = process.env.ENV_MODE === 'production';
const isDevelopment = process.env.ENV_MODE === 'development';
const isPrivate = getEnvVariable('cloudType') === 'private';

// log environment info
if (isDevelopment) {
  window.buildOnesProcessEnv = process.env;
}

const JSON_STRING_TAB_SIZE = 4;
console.info(
  '构建概要信息:',
  JSON.stringify(
    {
      version: process.env.VERSION,
      commitHash: process.env.commit,
      build: process.env.commitTimes,
      TAG: process.env.TAG,
    },
    null,
    JSON_STRING_TAB_SIZE
  )
);

if (isPrivate) {
  // eslint-disable-next-line @ones-ai/checkzh/no-chinese-code
  console.info(`前端版本：${process.env.webVersion}`);
}

if (isDevelopmentOnline) {
  // 打印各产品后端分支名
  const products = ['project', 'wiki', 'website'];
  const productApis = products.reduce(
    (accum, current) => ({
      ...accum,
      [current]: process.env[`${current}Api`],
    }),
    {}
  );
  console.info('后端 api 分支指向：');
  console.info(productApis);
}

if (isDevelopment) {
  try {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React, {});
  } catch (e) {
    console.info('why-did-you-render load fail');
  }
}

if (!isDevelopment) {
  Logger.init();
}

assignDefaultOptions({
  product: OnesProductEnum.PROJECT.value,
});

if (getGoogleAccountLoginSupport() === 'private') {
  /*
   * Installing via package managers, usage with webpack and react:
   * https://github.com/google/google-api-javascript-client/issues/319
   */
  window.init = function init() {
    // eslint-disable-next-line
    gapi.load('auth2', { callback: onAuthApiLoad });
    function onAuthApiLoad() {
      // eslint-disable-next-line
      gapi.auth2.init({
        client_id: getGoogleClientId(),
      });
    }
  };
  const gapiScript = document.createElement('script');
  gapiScript.src = getGoogleApiSrc();
  document.body.appendChild(gapiScript);
}

if (!disableStatsCollect()) {
  initThird(isProduction);
}
initELK();

// 在必要的依赖初始化完成之后才初始化插件平台的功能
if (OpenPlatformConnector.isEnabled()) {
  OpenPlatformConnector.launch();
}

ReactDom.render(<Root />, document.querySelector('.container'));
