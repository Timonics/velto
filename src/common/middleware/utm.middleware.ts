import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UtmMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const query = req.query;
    req['utm'] = {
      source: query.utm_source as string,
      medium: query.utm_medium as string,
      campaign: query.utm_campaign as string,
      term: query.utm_term as string,
      content: query.utm_content as string,
    };
    next();
  }
}
