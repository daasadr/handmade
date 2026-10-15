import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  // Aspoň jedno písmeno a jedna číslice — jinak projde slabé heslo typu
  // „helloworld". Musí sedět s kontrolou na frontendu (register/page.tsx).
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Heslo musí obsahovat alespoň jedno písmeno a jednu číslici.',
  })
  password: string;
}
