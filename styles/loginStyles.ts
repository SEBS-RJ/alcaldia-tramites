import { StyleSheet, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const styles = StyleSheet.create({
  // ── Contenedor base ───────────────────────────────────────────────────────
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0f2554',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  // ── Cabecera institucional ────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
    maxWidth: 480,
  },
  logoContainer: {
    marginBottom: 14,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff18',
    borderWidth: 2,
    borderColor: '#ffffff30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isWeb ? 22 : 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 4,
    textAlign: 'center',
  },
  headerDivider: {
    width: 48,
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginTop: 14,
  },

  // ── Tarjeta del formulario ────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: isWeb ? 36 : 24,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: {
    fontSize: isWeb ? 24 : 20,
    fontWeight: '700',
    color: '#0f2554',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  },

  // ── Campos del formulario ─────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    height: 50,
    gap: 8,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  eyeButton: {
    paddingLeft: 4,
  },

  // ── Mensajes de error ─────────────────────────────────────────────────────
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },

  // ── Botón de login ────────────────────────────────────────────────────────
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3a8f',
    borderRadius: 12,
    height: 52,
    marginTop: 4,
    gap: 8,
    shadowColor: '#1a3a8f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#6b7280',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ── Nota de política de contraseñas (Mejora Retrospectiva Sprint 1) ───────
  notaContrasena: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  notaContrasenaTexto: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 16,
  },

  // ── Pie de página ─────────────────────────────────────────────────────────
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 2,
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
  },
  footerSprint: {
    color: '#475569',
    fontSize: 11,
  },

  // ── Pantalla por rol (T-03) ───────────────────────────────────────────────
  rolContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  rolHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  rolBienvenida: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
  },
  rolUsuario: {
    fontSize: 15,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  rolBadge: {
    marginTop: 6,
    backgroundColor: '#ffffff25',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ffffff40',
  },
  rolBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  rolScrollContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  rolSeccionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },

  // ── Módulos por rol ───────────────────────────────────────────────────────
  moduloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  moduloIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduloEtiqueta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  // ── Descripción breve del módulo (Mejora) ─────────────────────────────────
  moduloDescripcion: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  // ── Nota de sprint ────────────────────────────────────────────────────────
  sprintNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sprintNoteText: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
  },

  // ── Cerrar sesión ─────────────────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  logoutButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Pantalla de éxito (legacy — mantenido por compatibilidad) ─────────────
  successContainer: {
    flex: 1,
    backgroundColor: '#0f2554',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 36,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f2554',
    marginBottom: 4,
  },
  successRol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
  },
});