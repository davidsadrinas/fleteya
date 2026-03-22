// TODO: Implement dual profile (client + driver)
// Client: personal info, trip history, payment methods
// Driver: docs (DNI, license, insurance, VTV), vehicles CRUD, stats, earnings

export default function ProfilePage() {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-4xl mb-4">◉</div>
      <h2 className="text-lg font-display font-bold mb-2">Mi perfil</h2>
      <p className="text-fy-dim text-sm max-w-xs">
        Perfil de usuario con documentación, vehículos, estadísticas, y configuración de cuenta.
      </p>
    </div>
  );
}
