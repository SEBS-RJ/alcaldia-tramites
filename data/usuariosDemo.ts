export interface Usuario {
  usuario: string;
  contrasena: string;
  rol: string;
}

export const USUARIOS_PRUEBA: Usuario[] = [
  { usuario: "admin",       contrasena: "1234", rol: "Administrador" },
  { usuario: "funcionario", contrasena: "1234", rol: "Funcionario Municipal" },
  { usuario: "jefe",        contrasena: "1234", rol: "Jefe de Área" },
];