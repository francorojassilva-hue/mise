import { MeshBackground } from "@/components/mise/MeshBackground";

export function App() {
  return (
    <>
      <MeshBackground />
      <main className="mx-auto max-w-md p-4">
        <div className="glass p-5">
          <h1 className="text-xl font-extrabold">Mise</h1>
          <button className="btn-vivid mt-3 min-h-11 rounded-2xl px-5 font-bold">Começar</button>
        </div>
      </main>
    </>
  );
}
