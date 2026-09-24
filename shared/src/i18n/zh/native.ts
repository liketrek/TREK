import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': '连接到 TREK',
  'native.connect.hint': '请输入你在浏览器中打开 TREK 时使用的地址。',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': '连接',
  'native.connect.checking': '正在检查…',
  'native.connect.errorInvalid': '这看起来不像网址。',
  'native.connect.errorUnreachable': '此地址没有服务器响应。请检查地址和网络连接。',
  'native.connect.errorNotTrek': '此地址上的服务器不是 TREK。',
  'native.connect.errorTooOld': '此 TREK 服务器版本过旧，无法用于应用。请先更新服务器。',
  'native.offline.title': '无法连接服务器',
  'native.offline.hint': 'TREK 无法连接到 {server}。请检查网络连接后重试。',
  'native.offline.retry': '重试',
  'native.changeServer': '更换服务器',
  'native.login.failed': '登录未成功，请重试。',
  'native.handoff.title': '在应用中继续',
  'native.handoff.hint': '你已以 {name} 身份登录。请打开 TREK 应用，在那里完成登录。',
  'native.handoff.open': '打开 TREK 应用',
  'native.handoff.switchAccount': '使用其他账号',
  'native.settings.server': '服务器',
  'native.settings.serverHint': '此应用已连接到 {server}。',
};

export default native;
