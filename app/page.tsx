"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState("");

  const cleanEmails = async (query: string, label: string) => {
    if (!session?.accessToken) return;

    if (query.includes("TODOS") && !confirm("⚠️ VAI APAGAR TUDO DA CONTA!\nTem certeza absoluta?")) return;

    setLoading(true);
    setCurrentAction(label);
    setStatusMessage(`Processando ${label}...`);

    let attempts = 0;
    const maxAttempts = 12; // tenta até 12 vezes

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await fetch("/api/clean", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, accessToken: session.accessToken }),
        });

        const data = await res.json();

        if (data.success) {
          setStatusMessage(data.message || `✅ Concluído! ${data.total} e-mails apagados.`);
          setLoading(false);
          return; // terminou com sucesso
        }
      } catch (err) {
        console.log(`Tentativa ${attempts} falhou, tentando novamente...`);
      }

      // Espera antes de tentar de novo
      await new Promise(r => setTimeout(r, 2500));
    }

    // Se chegou aqui, tentou muitas vezes
    setStatusMessage(`⚠️ Processo finalizado com algumas tentativas. Verifique seu Gmail.`);
    setLoading(false);
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800">

        <div className="text-center mb-8">
          <img src="/fivecon.ico" alt="WALA" className="w-20 h-20 mx-auto mb-3" />
          <h1 className="text-3xl font-bold">Limpa Gmail</h1>
          <p className="text-zinc-400">Feito pro WALA • Rápido e Seguro</p>
        </div>

        {!session ? (
          <button onClick={() => signIn("google")} className="w-full bg-white text-black py-4 rounded-2xl text-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-3">
            Entrar com Google
          </button>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-zinc-400 text-sm">Logado como</p>
              <p className="font-medium text-zinc-100 break-all">{session.user?.email}</p>
              <button onClick={() => signOut()} className="text-red-400 text-sm hover:underline mt-1">Sair</button>
            </div>

            <div className="space-y-3">
              <button onClick={() => cleanEmails("older_than:2y", "+2 anos")} disabled={loading} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl text-lg font-medium">🗑️ Apagar + de 2 anos</button>
              <button onClick={() => cleanEmails("category:promotions", "Promoções")} disabled={loading} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl text-lg font-medium">📦 Apagar só Promoções</button>
              <button onClick={() => cleanEmails("newsletter OR marketing OR promo OR oferta OR unsubscribe", "Newsletters")} disabled={loading} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl text-lg font-medium">✉️ Apagar Newsletters e Marketing</button>
              <button onClick={() => cleanEmails("-in:trash -in:spam", "TODOS")} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl text-lg font-medium">⚠️ Apagar TODOS os e-mails</button>
            </div>

            {/* Modal sempre aberto enquanto estiver processando */}
            {loading && (
              <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-700 w-full max-w-sm">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl font-medium">Processando {currentAction}</p>
                  <p className="text-amber-400 mt-4">⏳ Pode levar até 20-30 minutos</p>
                  <p className="text-zinc-400 mt-1">Não feche esta aba</p>
                  <p className="text-zinc-500 text-xs mt-6">O sistema está tentando automaticamente</p>
                </div>
              </div>
            )}

            {statusMessage && !loading && (
              <div className="mt-6 p-5 rounded-2xl text-center border text-sm bg-green-950 text-green-400 border-green-900">
                {statusMessage}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}