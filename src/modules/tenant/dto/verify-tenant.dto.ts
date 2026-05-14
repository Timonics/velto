import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class VerifyTenantDto {
  @IsUUID()
  tenantId!: string;

  @IsBoolean()
  isVerified!: boolean;
}