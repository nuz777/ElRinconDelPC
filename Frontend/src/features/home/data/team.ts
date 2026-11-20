export interface TeamMember {
  name: string;
  role: string;
  img: string;
  bio: string;
  github?: string;
}

export const teamMembers: TeamMember[] = [
  {
    name: "Nuz_v",
    role: "Desarrollador Fullstack .NET - Angular",
    img: "/img/Portada_miembros/nuz.jpg",
    bio: "Estudiante de programación y apasionado del hardware y software de PC. Desarrollador Fullstack con sólidos conocimientos en frontend (React, Angular con TypeScript) y backend con C# y .NET. Creador y mantenedor de El sótano del pc.",
    github: "https://github.com/nuz777",
  },
  {
    name: "Manuel",
    role: "Miembro",
    img: "/img/Portada_miembros/manuel.png",
    bio: "They are rage, brutal, without mercy. But you. You will be worse. Rip and tear, until it is done.",
  },
  {
    name: "Nicolas",
    role: "Fue colaborador estrella",
    img: "/img/Portada_miembros/nicolas.png",
    bio: "* Despite everything, it's still you.",
  },
];
