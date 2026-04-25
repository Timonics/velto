import { IsString, IsOptional, IsEnum, MaxLength, IsNotEmpty } from 'class-validator';
import { MediaType } from 'generated/prisma/client';
import { TenantCreateNestedOneWithoutPostsInput } from 'generated/prisma/models';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  mediaUrl!: string; // Cloudinary URL

  @IsEnum(MediaType)
  mediaType!: MediaType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;

  tenant?: TenantCreateNestedOneWithoutPostsInput
}