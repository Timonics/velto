import { OmitType } from '@nestjs/mapped-types';
import { CreatePortfolioItemDto } from './create-portfolio-item.dto';

export class UpdatePortfolioItemDto extends OmitType(CreatePortfolioItemDto, [
  'mediaUrl',
] as const) {}
