export const errorCodes = [
  'hitorisskeyIsDenied',
  'teapot',
  'sessionRequired',
  'tokenRequired',
  'invalidParamater',
  'notAuthorized',
  'hostNotFound',
  'registrationDisabled',
  'other',
] as const;

export type ErrorCode = typeof errorCodes[number];
