import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) { }

  transform(value: unknown) {
    console.log('ZodValidationPipe recebeu:', value);
    console.log('Tipo do valor:', typeof value);
    console.log('Schema sendo usado:', this.schema);
    const result = this.schema.safeParse(value);
    if (!result.success) {
      console.log('Validação falhou:', result.error);
      const flat = result.error.flatten();
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      });
    }
    console.log('Validação passou, retornando:', result.data);
    return result.data;
  }
}
