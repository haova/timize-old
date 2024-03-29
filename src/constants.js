export const RDialogActions = {
  CANCEL: 'cancel',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  DUPLICATE: 'duplicate',
  TOGGLE_DONE: 'toggle-done',
};

export const EVENT_STORAGE = 'timize.storage.events';
export const API_TOKEN = 'timize.api.token';
export const API_EMAIL = 'timize.api.email';
export const API_PASSWORD = 'timize.api.password';
export const INFO_LAST_SAVE = 'timize.info.savedAt';
export const INFO_LAST_LOAD = 'timize.info.loadedAt';
export const CONTENT_EXPANDED = 'timize.storage.content-expanded';
export const DATE_OF_BIRTH = 'timize.storage.dob';

export const MAX_YEAR = 60;
export const ALL_DAY = 1000 * 60 * 60 * 24;
export const MAX_DAY = 1;

export const EVENT_LABELS = {
  true: {
    true: 'Critical',
    false: 'Pressing',
  },
  false: {
    true: 'Crucial',
    false: 'Trivial',
  },
};
