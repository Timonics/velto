import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePortfolioItemDto {
  @IsString()
  @IsNotEmpty()
  mediaUrl!: string; // Cloudinary URL

  @IsString()
  @IsOptional()
  @MaxLength(200)
  caption?: string;
}