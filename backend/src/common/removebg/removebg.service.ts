import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class RemoveBgService {
  private readonly logger = new Logger(RemoveBgService.name);
  private readonly apiKey = process.env.REMOVE_BG_API_KEY || '';

  async removeBackground(imageUrl: string, bgColor?: string): Promise<Buffer> {
    if (!this.apiKey) {
      throw new BadRequestException('Remove.bg API klíč není nakonfigurován');
    }

    const body: Record<string, string> = { image_url: imageUrl, size: 'auto' };
    if (bgColor) body.bg_color = bgColor;

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}));
      const msg = err?.errors?.[0]?.title || `Remove.bg chyba ${response.status}`;
      this.logger.error(`Remove.bg failed: ${msg}`);
      throw new BadRequestException(msg);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
