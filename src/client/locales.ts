/** `settings.notify` namespace dictionaries. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'notify.title': '提示音提醒',
  'notify.enabled': '启用提醒',
  'notify.sound': '提示音',
  'notify.preview': '试听',
  'notify.volume': '音量',
  'notify.remind': '提醒范围',
  'notify.remindBackground': '仅后台会话完成时',
  'notify.remindAny': '所有会话完成时',
  'notify.soundNone': '无',
  'notify.soundA': '提示音 1',
  'notify.soundB': '提示音 2',
  'notify.soundC': '提示音 3',
} satisfies Record<string, string>

/** The notification namespace key union. */
export type NotifyKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'notify.title': 'Completion Sound',
  'notify.enabled': 'Enable reminders',
  'notify.sound': 'Sound',
  'notify.preview': 'Preview',
  'notify.volume': 'Volume',
  'notify.remind': 'Remind when',
  'notify.remindBackground': 'A background session finishes',
  'notify.remindAny': 'Any session finishes',
  'notify.soundNone': 'None',
  'notify.soundA': 'Chime 1',
  'notify.soundB': 'Chime 2',
  'notify.soundC': 'Chime 3',
} satisfies Record<NotifyKey, string>
