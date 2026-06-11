// Removido — sem animações de transição de página (spec IHC: baixa carga cognitiva)
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
