'use client'

import { useState, useEffect } from 'react'
import crypto from 'crypto'

interface SubAccount {
  id: string
  name: string
  exchange: string
}

export default function DashboardPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSubAccounts = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subaccounts`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setSubAccounts(data)
      } catch (error) {
        console.error('Error obteniendo subcuentas:', error)
      }
    }

    fetchSubAccounts()
  }, [])

  const fetchBalance = async () => {
    if (!apiKey || !apiSecret) {
      alert('Por favor ingresa la API Key y Secret Key')
      return
    }

    setLoading(true)

    try {
      const baseUrl = 'https://api-testnet.bybit.com'
      const endpoint = '/v5/account/wallet-balance'
      const params = 'accountType=UNIFIED'
      const timestamp = Date.now().toString()
      const recvWindow = '5000'

      // 🔹 Generar firma HMAC SHA256
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(timestamp + apiKey + recvWindow + params)
        .digest('hex')

      const res = await fetch(`${baseUrl}${endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'X-BAPI-SIGN': signature,
        },
      })

      const data = await res.json()
      if (data.retCode !== 0) throw new Error(`Error en la API: ${data.retMsg}`)

      const totalBalance = data.result.list[0]?.totalWalletBalance || '0.00'
      setBalance(totalBalance)
    } catch (error) {
      console.error('❌ Error obteniendo balance:', error)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* 🔹 Formulario para ingresar las API Keys */}
      <div className="mt-6 p-4 bg-white shadow rounded">
        <h2 className="text-xl font-semibold">Obtener Balance</h2>

        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />
        <input
          type="password"
          placeholder="Secret Key"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />

        <button
          onClick={fetchBalance}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          {loading ? 'Cargando...' : 'Consultar Balance'}
        </button>

        {balance !== null && (
          <p className="mt-4 text-xl font-bold text-green-500">
            Balance: ${Number(balance).toFixed(2)}
          </p>
        )}
      </div>

      {/* 🔹 Lista de Subcuentas */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Subcuentas</h2>
        {subAccounts.length === 0 ? (
          <p>No tienes subcuentas registradas.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {subAccounts.map((sub) => (
              <li key={sub.id} className="p-3 bg-gray-100 rounded">
                {sub.name} ({sub.exchange})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
