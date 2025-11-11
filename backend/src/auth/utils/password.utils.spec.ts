// src/auth/utils/password.utils.spec.ts
import { hashPassword, validatePassword } from './password.utils';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('password.utils', () => {
  beforeEach(() => jest.clearAllMocks());

  it('hashPassword should call bcrypt.hash with saltRounds=10', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    const res = await hashPassword('secret');
    expect(res).toBe('hashed');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
  });

  it('validatePassword should delegate to bcrypt.compare', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await expect(validatePassword('a', 'b')).resolves.toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('a', 'b');

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(validatePassword('a', 'c')).resolves.toBe(false);
  });
});
