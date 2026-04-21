import { Result, ok, err } from '../shared/result';

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Result<Email, string> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return err('Invalid email format');
    }
    return ok(new Email(email.toLowerCase()));
  }

  getValue(): string {
    return this.value;
  }
}