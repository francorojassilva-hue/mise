/** Notificações do aparelho. Só funcionam com o app aberto (não há servidor de push). */
const icone = () => `${import.meta.env.BASE_URL}icon-512.png`;

export const notificacaoDisponivel = () => typeof Notification !== "undefined";
export const permissaoNotificacao = (): NotificationPermission | "indisponivel" => (notificacaoDisponivel() ? Notification.permission : "indisponivel");

/** Pede permissão uma vez; devolve se está concedida. */
export async function pedirPermissao(): Promise<boolean> {
  if (!notificacaoDisponivel()) return false;
  try {
    if (Notification.permission === "default") await Notification.requestPermission();
  } catch {
    return false;
  }
  return Notification.permission === "granted";
}

/** Mostra a notificação pelo service worker quando há permissão; senão devolve false (quem chama mostra um aviso na tela). */
export async function notificar(titulo: string, corpo: string): Promise<boolean> {
  if (!notificacaoDisponivel() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(titulo, { body: corpo, icon: icone() });
    else new Notification(titulo, { body: corpo, icon: icone() });
    return true;
  } catch {
    return false;
  }
}
