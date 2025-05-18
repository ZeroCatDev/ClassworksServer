import bcrypt from "bcrypt";
import { Base64 } from "js-base64";

const SALT_ROUNDS = 8;

/**
 * 从 base64 解码字符串
 */
export function decodeBase64(str) {
  if (!str) return null;
  try {
    return Base64.decode(str);
  } catch (error) {
    return null;
  }
}

/**
 * 对字符串进行 UTF-8 编码处理
 */
function encodeUTF8(str) {
  try {
    return encodeURIComponent(str);
  } catch (error) {
    return null;
  }
}

/**
 * 验证密码是否匹配（带 base64 解码）
 */
export async function DecodeAndVerifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  const decodedPassword = decodeBase64(plainPassword);
  console.debug(decodedPassword);
  if (!decodedPassword) return false;
  const encodedPassword = encodeUTF8(decodedPassword);
  console.debug(encodedPassword);
  if (!encodedPassword) return false;
  return await bcrypt.compare(encodedPassword, hashedPassword);
}

/**
 * 验证密码是否匹配（不解码 base64，但处理 UTF-8）
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  const encodedPassword = encodeUTF8(plainPassword);
  console.debug(encodedPassword);
  if (!encodedPassword) return false;
  return await bcrypt.compare(encodedPassword, hashedPassword);
}

/**
 * 对密码进行哈希处理（带 base64 解码）
 */
export async function DecodeAndhashPassword(plainPassword) {
  if (!plainPassword) return null;
  const decodedPassword = decodeBase64(plainPassword);
  console.debug(decodedPassword);
  if (!decodedPassword) return null;
  const encodedPassword = encodeUTF8(decodedPassword);
  if (!encodedPassword) return null;
  console.debug(encodedPassword);
  return await bcrypt.hash(encodedPassword, SALT_ROUNDS);
}

/**
 * 对密码进行哈希处理（不解码 base64，但处理 UTF-8）
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword) return null;
  const encodedPassword = encodeUTF8(plainPassword);
  if (!encodedPassword) return null;
  console.debug(encodedPassword);
  return await bcrypt.hash(encodedPassword, SALT_ROUNDS);
}

/**
 * 验证站点密钥
 */
export function verifySiteKey(providedKey, actualKey) {
  if (!actualKey) return true; // 如果没有设置站点密钥，则总是通过
  if (!providedKey) return false;
  const decodedKey = decodeBase64(providedKey);
  if (!decodedKey) return false;
  const encodedKey = encodeUTF8(decodedKey);
  if (!encodedKey) return false;
  console.debug(encodedKey);
  return encodedKey === actualKey;
}
