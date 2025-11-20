import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) { }

  transform(value: unknown) {
    console.log('🔍 [ZOD VALIDATION] Recebeu:', JSON.stringify(value, null, 2));
    console.log('🔍 [ZOD VALIDATION] Tipo do valor:', typeof value);
    if (value && typeof value === 'object' && 'category' in value) {
      console.log('🔍 [ZOD VALIDATION] Campo category ANTES da validação:', (value as any).category);
      console.log('🔍 [ZOD VALIDATION] Tipo do category:', typeof (value as any).category);
    }
    const result = this.schema.safeParse(value);
    if (!result.success) {
      console.log('❌ [ZOD VALIDATION] Validação falhou:', result.error);
      const flat = result.error.flatten();
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      });
    }
    console.log('✅ [ZOD VALIDATION] Validação passou, retornando:', JSON.stringify(result.data, null, 2));
    if (result.data && typeof result.data === 'object' && 'category' in result.data) {
      console.log('✅ [ZOD VALIDATION] Campo category DEPOIS da validação:', (result.data as any).category);
      console.log('✅ [ZOD VALIDATION] Tipo do category após validação:', typeof (result.data as any).category);
    }
    return result.data;
  }
}
