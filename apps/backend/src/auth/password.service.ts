import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("base64url");
    const derived = (await scrypt(password, salt, keyLength)) as Buffer;
    return `scrypt$${salt}$${derived.toString("base64url")}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, salt, hash] = storedHash.split("$");
    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }
    const expected = Buffer.from(hash, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
