// TODO: Account settings
// - Edit profile (name, phone, avatar)
// - Notification preferences
// - Payment methods
// - Switch role (client <-> driver)
// - Delete account
// - Logout

export default function SettingsPage() {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-4xl mb-4">⚙️</div>
      <h2 className="text-lg font-display font-bold mb-2">Configuración</h2>
      <p className="text-fy-dim text-sm max-w-xs">
        Configuración de cuenta, notificaciones, métodos de pago, y preferencias.
      </p>
    </div>
  );
}
