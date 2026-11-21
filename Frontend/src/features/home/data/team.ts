/** Rango militar del recuadro (de mayor a menor). Define el marco y la medalla. */
export type TeamRank = "general" | "teniente-general" | "general-division";

export interface TeamMember {
  name: string;
  role: string;
  img: string;
  bio: string;
  github?: string;
  rank: TeamRank;
  /** Nombre del rango que se muestra en la placa. */
  rankTitle: string;
  /** Cargo dentro del "ejército". */
  post: string;
  /** Número de expediente que se muestra en el recuadro. */
  serial: string;
}

export const teamMembers: TeamMember[] = [
  {
    name: "Nuz",
    role: "Desarrollador Fullstack .NET - Angular",
    img: "/img/Portada_miembros/nuz.jpg",
    bio: "Estudiante de programación y apasionado del hardware y software de PC. Desarrollador Fullstack con sólidos conocimientos en frontend (React, Angular con TypeScript) y backend con C# y .NET. Creador y mantenedor de El sótano del pc.",
    github: "https://github.com/nuz777",
    rank: "general",
    rankTitle: "General",
    post: "Comandante en jefe",
    serial: "001",
  },
  {
    name: "Dozen Apollo",
    role: "Miembro",
    img: "/img/Portada_miembros/manuel.png",
    bio: "They are rage, brutal, without mercy. But you. You will be worse. Rip and tear, until it is done.",
    rank: "teniente-general",
    rankTitle: "Teniente General",
    post: "Segundo al mando",
    serial: "002",
  },
  {
    name: "Nicholas",
    role: "Fue colaborador estrella",
    img: "/img/Portada_miembros/nicolas.png",
    bio: "* Despite everything, it's still you.",
    github: "https://github.com/nicholas-delarosa",
    rank: "general-division",
    rankTitle: "General de División",
    post: "Fuerzas especiales",
    serial: "003",
  },
];
