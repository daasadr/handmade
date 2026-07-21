import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Response } from 'express';
import { IMAGE_UPLOAD, formatBytes } from './image-upload.options';

/**
 * Multer hlásí chyby anglicky a bez kontextu („File too large"). Tenhle filtr
 * je přeloží a přidá radu, co má uživatel udělat. Ostatní chyby propouští beze
 * změny — hlavně validační BadRequest z ValidationPipe.
 */
const MULTER_MESSAGES: Record<string, { message: string; tip: string }> = {
  'File too large': {
    message: `Fotka je větší než ${formatBytes(IMAGE_UPLOAD.maxFileBytes)}.`,
    tip: 'Zmenšete ji před nahráním — např. na squoosh.app, nebo ve Fotkách přes Upravit → Změnit velikost. Pro listing stačí zhruba 2000 × 2000 px.',
  },
  'Too many files': {
    message: `Najednou lze nahrát nejvýš ${IMAGE_UPLOAD.maxFiles} fotek.`,
    tip: 'Nahrajte je prosím po menších dávkách.',
  },
  'Unexpected field': {
    message: 'Soubor dorazil pod neočekávaným názvem pole.',
    tip: 'Zkuste stránku načíst znovu (Ctrl+F5) a nahrát fotku ještě jednou.',
  },
};

@Catch(PayloadTooLargeException, BadRequestException)
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const rawMessage =
      typeof body === 'string'
        ? body
        : ((body as { message?: unknown }).message ?? exception.message);

    const known =
      typeof rawMessage === 'string' ? MULTER_MESSAGES[rawMessage] : undefined;

    if (!known) {
      // Není to chyba uploadu — necháme původní odpověď být.
      return response.status(status).json(body);
    }

    return response.status(status).json({
      statusCode: status,
      message: `${known.message} ${known.tip}`,
      error: exception.name,
    });
  }
}
