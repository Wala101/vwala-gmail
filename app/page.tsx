"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [statusMessage, setStatusMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState("");

  const cleanEmails = async (query: string, label: string) => {
    if (!session?.accessToken) return;

    if (query.includes("TODOS") && !confirm("⚠️ VAI APAGAR TUDO DA CONTA!\nTem certeza absoluta?")) return;

    setLoading(true);
    setCurrentAction(label);
    setStatusMessage(`Processando ${label}...`);
    setMessageType("");

    try {
      const res = await fetch("/api/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, accessToken: session.accessToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage(`✅ Concluído! ${data.total} e-mails movidos para a lixeira.`);
        setMessageType("success");
      } else {
        setStatusMessage(`❌ ${data.error || "Erro desconhecido"}`);
        setMessageType("error");
      }
    } catch (err) {
      setStatusMessage("❌ Erro de conexão");
      setMessageType("error");
    }

    setLoading(false);
    setCurrentAction("");
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800">

        {/* Cabeçalho WALA */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧹</div>
          <h1 className="text-3xl font-bold">Limpa Gmail</h1>
        </div>

        {!session ? (
          <button
            onClick={() => signIn("google")}
            className="w-full bg-white text-black py-4 rounded-2xl text-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6" />
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
              <button onClick={() => cleanEmails("older_than:2y", "+2 anos")} disabled={loading} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl text-lg font-medium">
                🗑️ Apagar + de 2 anos
              </button>

              <button onClick={() => cleanEmails("category:promotions", "Promoções")} disabled={loading} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl text-lg font-medium">
                📦 Apagar só Promoções
              </button>

              <button onClick={() => cleanEmails("newsletter OR marketing OR promo OR oferta OR unsubscribe", "Newsletters")} disabled={loading} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl text-lg font-medium">
                ✉️ Apagar Newsletters e Marketing
              </button>

              <button onClick={() => cleanEmails("-in:trash -in:spam", "TODOS")} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl text-lg font-medium">
                ⚠️ Apagar TODOS os e-mails
              </button>
            </div>

            {/* Modal Carregamento */}
            {loading && (
              <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-700 w-full max-w-sm">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-2xl font-semibold mb-3">
  Limpando seus e-mails...
</p>

<p className="text-zinc-300 text-sm leading-relaxed">
  O processo pode levar até <span className="text-white font-semibold">30 minutos</span>,
  dependendo da quantidade de e-mails encontrados.
</p>

<p className="text-zinc-500 text-sm mt-4">
  Não feche esta aba durante a limpeza.
</p>

<div className="mt-5 bg-zinc-800 rounded-xl p-3 border border-zinc-700">
  <p className="text-blue-400 text-sm">
    Processando: <span className="font-semibold">{currentAction}</span>
  </p>
</div>
                </div>
              </div>
            )}

            {statusMessage && !loading && (
              <div className={`mt-6 p-5 rounded-2xl text-center border text-sm ${
                messageType === "success" 
                  ? "bg-green-950 text-green-400 border-green-900" 
                  : "bg-red-950 text-red-400 border-red-900"
              }`}>
                {statusMessage}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}