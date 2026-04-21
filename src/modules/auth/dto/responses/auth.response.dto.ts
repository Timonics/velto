/**
 * Auth Response DTO – Standard response shape for auth endpoints.
 */

export class AuthResponseDto {
  userId!: string;
  role!: string;
}