export type Profile = {
  id: string;
  name: string;
  age: number;
  email: string;
  phone?: string;
  // Campo image mantido para compatibilidade retroativa
  image: string | null;
  // Novo campo: array de imagens (compatível com frontend)
  images?: (string | null)[];
  // Novo campo: descrição do perfil
  descricao?: string;
  // Novo campo: gênero/sexo (m, f, nb)
  sexo?: 'm' | 'f' | 'nb';
  // Novo campo: localização do usuário
  localizacao?: string;
  // Novo campo: wallpaper do perfil
  wallpaper?: string | null;
  tags: string[];
};

export class User { }
