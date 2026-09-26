import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { USER, TRANSACTIONS, BILETS, VIDEO_LESSONS } from './data/mock.js';
import { fetchWallet, topupWithCode as apiTopup } from './api/wallet.js';
import { getAccessToken } from './api/client.js';

const WalletContext = createContext(null);
const LS = 'miraemaktab-wallet';

function load() {
  try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch { return null; }
}
function seedPurchases() {
  return [
    ...BILETS.filter((b) => b.unlocked && !b.free).map((b) => `bilet:${b.id}`),
    ...VIDEO_LESSONS.filter((v) => v.granted && !v.free).map((v) => `video:${v.id}`),
  ];
}

export function WalletProvider({ children }) {
  const persisted = load();
  const [balance, setBalance] = useState(persisted?.balance ?? USER.balance);
  const [transactions, setTransactions] = useState(persisted?.transactions ?? TRANSACTIONS);
  const [purchases, setPurchases] = useState(() => new Set(persisted?.purchases ?? seedPurchases()));

  const save = (b, tx, pset) => {
    try { localStorage.setItem(LS, JSON.stringify({ balance: b, transactions: tx, purchases: [...pset] })); } catch { /* ignore */ }
  };

  const hasPurchased = useCallback((key) => purchases.has(key), [purchases]);
  const canAfford = useCallback((amt) => balance >= (amt || 0), [balance]);

  useEffect(() => {
    if (!getAccessToken()) return;
    fetchWallet()
      .then((w) => {
        if (w && (w.balance != null || w.wallet_balance != null)) {
          const b = w.balance ?? w.wallet_balance;
          setBalance(b);
        }
      })
      .catch(() => {});
  }, []);

  const topupCode = useCallback(async (code) => {
    const res = await apiTopup(code);
    if (res?.balance != null) setBalance(res.balance);
    return res;
  }, []);


  // Charge for something. `key` (optional) marks a one-time unlock (bilet/video);
  // omit it for consumable buys (each paid test start).
  const purchase = useCallback(({ key, amount, title }) => {
    if (key && purchases.has(key)) return { ok: true, already: true };
    if (balance < amount) return { ok: false, reason: 'insufficient' };
    const nb = balance - amount;
    const tx = [{ id: `x${Date.now()}`, type: 'purchase', title, amount: -amount, date: new Date().toISOString(), status: 'success' }, ...transactions];
    const pset = new Set(purchases); if (key) pset.add(key);
    setBalance(nb); setTransactions(tx); setPurchases(pset); save(nb, tx, pset);
    return { ok: true };
  }, [balance, transactions, purchases]);

  const topUp = useCallback((amount) => {
    if (!amount || amount <= 0) return { ok: false };
    const nb = balance + amount;
    const tx = [{ id: `x${Date.now()}`, type: 'topup', title: "Click orqali to'ldirish", amount, date: new Date().toISOString(), status: 'success' }, ...transactions];
    setBalance(nb); setTransactions(tx); save(nb, tx, purchases);
    return { ok: true };
  }, [balance, transactions, purchases]);

  return (
    <WalletContext.Provider value={{ balance, transactions, hasPurchased, canAfford, purchase, topUp, topupCode }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
