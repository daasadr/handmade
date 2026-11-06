import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  // Stejné pravidlo jako při registraci: aspoň jedno písmeno a číslice.
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Heslo musí obsahovat alespoň jedno písmeno a jednu číslici.',
  })
  password: string;
}
