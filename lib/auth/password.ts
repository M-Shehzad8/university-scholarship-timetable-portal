import bcrypt from "bcrypt";

const BCRYPT_COST = 12;

// A valid hash used when an email does not exist. Comparing against it keeps
// failed-login timing similar whether or not the account is real.
const DUMMY_PASSWORD_HASH =
  "$2b$12$di9A3k/7Hh9mcRJj9xiXvewp0w8o9ZyJ.RboIgdsM0AyPBQsrgrKu";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function verifyPasswordOrDummy(
  password: string,
  passwordHash: string | null,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash ?? DUMMY_PASSWORD_HASH);
}
