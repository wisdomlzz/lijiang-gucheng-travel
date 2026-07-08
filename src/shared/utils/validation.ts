/** 中国大陆手机号正则：1 开头，第二位 3-9，共 11 位 */
export const PHONE_REGEX = /^1[3-9]\d{9}$/

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone)
}