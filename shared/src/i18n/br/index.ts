import admin from './admin';
import airport from './airport';
import atlas from './atlas';
import backup from './backup';
import budget from './budget';
import categories from './categories';
import collab from './collab';
import collection from './collection';
import common from './common';
import dashboard from './dashboard';
import day from './day';
import dayplan from './dayplan';
import files from './files';
import help from './help';
import inspector from './inspector';
import journey from './journey';
import login from './login';
import map from './map';
import members from './members';
import memories from './memories';
import nav from './nav';
import notif from './notif';
import notifications from './notifications';
import oauth from './oauth';
import packing from './packing';
import pdf from './pdf';
import perm from './perm';
import photos from './photos';
import places from './places';
import planner from './planner';
import register from './register';
import reservations from './reservations';
import settings from './settings';
import share from './share';
import shared from './shared';
import stats from './stats';
import system_notice from './system_notice';
import todo from './todo';
import transport from './transport';
import trip from './trip';
import trips from './trips';
import undo from './undo';
import vacay from './vacay';

const locale = {
  ...common,
  ...trips,
  ...nav,
  ...dashboard,
  ...settings,
  ...admin,
  ...dayplan,
  ...share,
  ...shared,
  ...login,
  ...register,
  ...vacay,
  ...collection,
  ...atlas,
  ...trip,
  ...places,
  ...inspector,
  ...reservations,
  ...airport,
  ...map,
  ...budget,
  ...files,
  ...packing,
  ...members,
  ...categories,
  ...backup,
  ...photos,
  ...pdf,
  ...planner,
  ...stats,
  ...day,
  ...collab,
  ...memories,
  ...perm,
  ...undo,
  ...notifications,
  ...todo,
  ...notif,
  ...journey,
  ...oauth,
  ...system_notice,
  ...transport,
  ...help,
};
export default locale;
