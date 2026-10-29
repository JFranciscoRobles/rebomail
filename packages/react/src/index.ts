// The API of @rebomail/react: the whole editor as one component, its parts
// for a layout of one's own, and the hooks for an interface of one's own.

export { blankEmail, type Email, readEmail, renderEmail, sampleEmail } from '@rebomail/core';
export { MailCanvas } from './Canvas';
export { Editable, type EditableProps } from './Editable';
export { addLink, type Selected, toggleMark } from './format';
export { WORDS, type Words } from './i18n';
export { Icon, type IconName } from './icons';
export { MailInspector } from './Inspector';
export { handleMailKeys, MailEditor, type MailEditorProps } from './MailEditor';
export { MailPalette } from './Palette';
export { MailPreview, type MailPreviewProps } from './Preview';
export {
  type CustomLookProps,
  type Dragged,
  type EditorBlock,
  MailProvider,
  type MailProviderProps,
  type MailState,
  type PaletteEntry,
  useMail,
  useSelection,
} from './state';
