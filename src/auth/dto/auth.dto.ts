import { z } from 'zod';

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export const EmailSignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().nonnegative(),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (XX) XXXXX-XXXX')
    .refine((phone) => {
      const ddd = phone.substring(1, 3);
      const validDDDs = [
        '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
        '21', '22', '24', // RJ
        '27', '28', // ES
        '31', '32', '33', '34', '35', '37', '38', // MG
        '41', '42', '43', '44', '45', '46', // PR
        '47', '48', '49', // SC
        '51', '53', '54', '55', // RS
        '61', // DF
        '62', '64', // GO
        '63', // TO
        '65', '66', // MT
        '67', // MS
        '68', // AC
        '69', // RO
        '71', '73', '74', '75', '77', // BA
        '79', // SE
        '81', '87', // PE
        '82', // AL
        '83', // PB
        '84', // RN
        '85', '88', // CE
        '86', '89', // PI
        '91', '93', '94', // PA
        '92', '97', // AM
        '95', // RR
        '96', // AP
        '98', '99', // MA
      ];
      return validDDDs.includes(ddd);
    }, 'DDD inválido')
    .refine((phone) => {
      const number = phone.replace(/\D/g, '');
      return number.length === 10 || number.length === 11;
    }, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
});

export const EmailLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type GoogleAuthDto = z.infer<typeof GoogleAuthSchema>;
export type EmailSignupDto = z.infer<typeof EmailSignupSchema>;
export type EmailLoginDto = z.infer<typeof EmailLoginSchema>;
